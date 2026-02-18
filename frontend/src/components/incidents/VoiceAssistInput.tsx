import { useState, useRef, useCallback } from 'react';
import { Mic, Square, RotateCcw, Loader2, AlertCircle, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { webmToWav } from '@/utils/webmToWav';

interface VoiceAssistInputProps {
  onTranscriptionComplete: (transcription: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

type CaptureState = 'idle' | 'requesting' | 'recording' | 'processing' | 'error';

export function VoiceAssistInput({
  onTranscriptionComplete,
  onError,
  disabled
}: VoiceAssistInputProps) {
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
 const API_BASE = process.env.STT_URL;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setCaptureState('requesting');
    setErrorMessage('');
    setLiveTranscript('');
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorder.start(1000);
      setCaptureState('recording');

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Live preview using Web Speech API (unchanged)
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setLiveTranscript(transcript);
        };

        recognition.onerror = () => {
          // silent fail
        };

        recognition.start();
        (mediaRecorderRef.current as any).speechRecognition = recognition;
      }
    } catch (error) {
      setCaptureState('error');
      const message =
        error instanceof Error ? error.message : 'Could not access microphone';
      setErrorMessage(message);
      onError?.(message);
    }
  }, [onError]);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current || captureState !== 'recording') return;

    setCaptureState('processing');

    const recognition = (mediaRecorderRef.current as any).speechRecognition;
    if (recognition) recognition.stop();

    mediaRecorderRef.current.stop();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    await new Promise((r) => setTimeout(r, 100));

    const webmBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

    try {
      // 🔴 KEY CHANGE: WebM → WAV in browser
      const wavBlob = await webmToWav(webmBlob);

      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');

      const response = await fetch(`${API_KEY}/speech-to-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcription = data.text || liveTranscript || '';

      if (transcription) {
        onTranscriptionComplete(transcription);
        setCaptureState('idle');
      } else {
        throw new Error('No transcription received');
      }
    } catch (error) {
      if (liveTranscript) {
        onTranscriptionComplete(liveTranscript);
        setCaptureState('idle');
      } else {
        setCaptureState('error');
        const message =
          'Voice processing failed. Please try again or use manual entry.';
        setErrorMessage(message);
        onError?.(message);
      }
    }
  }, [captureState, liveTranscript, onTranscriptionComplete, onError]);

  const resetCapture = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current) {
      const recognition = (mediaRecorderRef.current as any).speechRecognition;
      if (recognition) recognition.stop();
    }

    setCaptureState('idle');
    setErrorMessage('');
    setLiveTranscript('');
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /* ================= UI (UNCHANGED) ================= */

  if (captureState === 'idle') {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={startRecording}
        disabled={disabled}
        className="w-full border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:bg-primary/5"
      >
        <Mic className="h-4 w-4 mr-2" />
        Describe Incident by Voice
      </Button>
    );
  }

  if (captureState === 'requesting') {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Requesting microphone access...</span>
      </div>
    );
  }

  if (captureState === 'recording') {
    return (
      <div className="space-y-4">
        <div className="border-2 border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-severity-critical opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-severity-critical"></span>
              </span>
              <span className="text-sm font-medium">Recording</span>
            </div>
            <span className="font-mono text-sm text-muted-foreground">
              {formatDuration(recordingDuration)}
            </span>
          </div>

          {liveTranscript ? (
            <div className="bg-background/50 border p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Live preview:</p>
              <p>{liveTranscript}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              Speak clearly to describe the incident...
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={resetCapture} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
          <Button onClick={stopRecording} className="flex-1 bg-primary">
            <Square className="h-4 w-4 mr-2" />
            Stop & Process
          </Button>
        </div>
      </div>
    );
  }

  if (captureState === 'processing') {
    return (
      <div className="border-2 border-muted p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="font-medium">Processing voice input...</p>
        </div>
      </div>
    );
  }

  if (captureState === 'error') {
    return (
      <div className="border-2 border-severity-high bg-severity-high/5 p-4">
        <p className="font-medium text-severity-high">Voice capture failed</p>
        <p className="text-sm mt-1">{errorMessage}</p>
        <Button variant="outline" onClick={resetCapture} className="w-full mt-3">
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return null;
}
