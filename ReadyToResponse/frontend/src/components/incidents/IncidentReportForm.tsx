import { useState, useEffect } from "react";
import { MapPin, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { VoiceAssistInput } from "@/components/incidents/VoiceAssistInput";
import { incidentTypes } from "@/data/mockData";
import { reportIncident } from "@/services/incidentService";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

/* ✅ FIX 1: Proper props typing */
interface IncidentReportFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function IncidentReportForm({
  onCancel,
  onSuccess,
}: IncidentReportFormProps) {

  const [type, setType] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [location, setLocation] = useState<string>("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [description, setDescription] = useState<string>("");

  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState<boolean>(false);
  const [voicePrefilledFields, setVoicePrefilledFields] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const { token } = useAuth();
  const { toast } = useToast();

  /* -------------------- AUTO GPS LOCATION -------------------- */
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLatitude(latitude);
        setLongitude(longitude);

        // Auto-fill address
        import("@/services/geocodingService").then(({ reverseGeocode }) => {
          reverseGeocode(latitude, longitude).then((addr) => {
            setLocation(addr);
          });
        });
      },
      () => console.warn("Location unavailable"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /* -------------------- VOICE → AI -------------------- */
  const handleVoiceTranscription = async (transcription: string) => {
    setIsProcessingVoice(true);
    setVoicePrefilledFields([]);

    try {
      const res = await fetch("http://localhost:8000/ai/extract-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      const filled: string[] = [];

      if (data.type && incidentTypes.includes(data.type)) {
        setType(data.type);
        filled.push("type");
      }

      if (data.severity) {
        setSeverity(data.severity);
        filled.push("severity");
      }

      if (data.location) {
        setLocation(data.location);
        filled.push("location");
      }

      if (data.description) {
        setDescription(data.description);
        filled.push("description");
      } else {
        setDescription(transcription);
      }

      setVoicePrefilledFields(filled);

      toast({
        title: "Voice processed",
        description: `${filled.length} fields auto-filled`,
      });
    } catch {
      setDescription(transcription);
      toast({
        title: "Voice captured",
        description: "Added to description",
      });
    } finally {
      setIsProcessingVoice(false);
    }
  };

  /* -------------------- SUBMIT INCIDENT -------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !severity) return;

    try {
      await reportIncident(
        {
          category: type,
          severity,
          latitude,
          longitude,
          description: description || null,
        },
        token
      );

      setIsSubmitted(true);
      onSuccess?.();
      setTimeout(onCancel, 2000);
    } catch (err: any) {
      alert(err?.message || "Failed to report incident");
    }
  };

  /* -------------------- SUCCESS STATE -------------------- */
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-10 w-10 text-primary mb-3" />
        <h3 className="text-lg font-bold">Incident Reported</h3>
        <p className="text-sm text-muted-foreground">
          Emergency services have been notified.
        </p>
      </div>
    );
  }

  const isVoiceFilled = (f: string) => voicePrefilledFields.includes(f);

  /* -------------------- FORM -------------------- */
  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Voice Assist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Quick Fill with Voice</span>
        </div>

        <VoiceAssistInput
          onTranscriptionComplete={handleVoiceTranscription}
          disabled={isProcessingVoice}
        />

        {isProcessingVoice && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Extracting details...
          </div>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label>Incident Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className={`border-2 ${isVoiceFilled("type") ? "border-primary" : ""}`}>
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            {incidentTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Severity */}
      <div className="space-y-2">
        <Label>Severity *</Label>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className={`border-2 ${isVoiceFilled("severity") ? "border-primary" : ""}`}>
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>Location *</Label>
        <Input value={location} readOnly className="border-2 border-foreground" />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border-2 border-foreground"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Submit Report
        </Button>
      </div>
    </form>
  );
}
// Forces HMR update
