import { useEffect, useState } from "react";
import { Plus, Filter, Loader2, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { ResourceStatus } from "@/types";
import { getResources, updateResourceStatus } from "@/services/resourceService";
import { io } from "socket.io-client";
/* -------------------- CONSTANTS -------------------- */

const resourceTypes = [
  "Fire Truck",
  "Ambulance",
  "HazMat",
  "Rescue",
  "Police",
  "Helicopter",
];

export default function ResourcesPage() {
  const { user, token } = useAuth();
const API_BASE = import.meta.env.VITE_API_URL;
  const [resources, setResources] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  /* ---------- ADD RESOURCE STATE ---------- */
  const [resourceName, setResourceName] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const socket = io(API_BASE);
  const canAddResources = user?.role === "agency";
const canEditStatus = user?.role === 'agency';
  /* ===================== FETCH RESOURCES ===================== */

  const loadResources = async () => {
    // console.log(resour)
    if (!token) return;
    try {
      const data = await getResources(token);
      // console.log(data)
      setResources(data);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    }
  };

  useEffect(() => {
    loadResources();
  }, [token]);
const handleStatusChange = async (resourceId: string, newStatus: string) => {
  if (!token) return;

  try {
    await updateResourceStatus(resourceId, newStatus, token);

    // Reload from DB to keep backend as source of truth
    await loadResources();
  } catch (err: any) {
    alert(err.message);
  }
};
useEffect(() => {
  socket.on("resource:new", (resource) => {
    setResources((prev) => [resource, ...prev]);
  });

  socket.on("resource:update", (updated) => {
    setResources((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  });

  socket.on("resource:assigned", (updated) => {
    setResources((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r))
    );
  });

  return () => {
    socket.off("resource:new");
    socket.off("resource:update");
    socket.off("resource:assigned");
  };
}, []);
  /* ===================== FILTERING ===================== */

  const filteredResources = resources.filter((resource) => {
    if (statusFilter !== "all" && resource.status !== statusFilter) return false;
    if (typeFilter !== "all" && resource.type !== typeFilter) return false;
    return true;
  });

  const stats = {
    available: resources.filter((r) => r.status === "Available").length,
    engaged: resources.filter((r) => r.status === "Engaged").length,
    unavailable: resources.filter((r) => r.status === "Unavailable").length,
  };

  /* ===================== GEOLOCATION ===================== */

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
      },
      () => {
        alert("Location permission denied");
        setIsLocating(false);
      }
    );
  };

  /* ===================== ADD RESOURCE ===================== */

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!resourceName || !resourceType || latitude === null || longitude === null) {
      alert("All fields including location are required");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE}/resources/create-resource`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: resourceName,
          type: resourceType,
          latitude,
          longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create resource");

      await loadResources();

      setIsAddDialogOpen(false);
      setResourceName("");
      setResourceType("");
      setLatitude(null);
      setLongitude(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===================== UI ===================== */

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Resources</h1>

          {canAddResources && (
            <Button
              type="button"
              onClick={() => setIsAddDialogOpen(true)}
              className="border-2 border-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3 animate-stagger-in">
          <div className="border-2 border-status-active bg-card p-4">
            <span className="font-mono text-xs text-muted-foreground">AVAILABLE</span>
            <div className="text-3xl font-bold text-status-active">{stats.available}</div>
          </div>
          <div className="border-2 border-status-pending bg-card p-4">
            <span className="font-mono text-xs text-muted-foreground">ENGAGED</span>
            <div className="text-3xl font-bold text-status-pending">{stats.engaged}</div>
          </div>
          <div className="border-2 border-foreground bg-card p-4">
            <span className="font-mono text-xs text-muted-foreground">UNAVAILABLE</span>
            <div className="text-3xl font-bold text-muted-foreground">{stats.unavailable}</div>
          </div>
        </div>

        {/* Filters */}
         <div className="mb-6 flex items-center gap-3 border-2 border-foreground bg-card p-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[140px] border-2 border-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-2 border-foreground bg-popover">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="engaged">Engaged</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] border-2 border-foreground">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="border-2 border-foreground bg-popover">
              <SelectItem value="all">All Types</SelectItem>
              {resourceTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ml-4 font-mono text-sm text-muted-foreground">
            {filteredResources.length} resources
          </span>
        </div>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-stagger-in">
          {filteredResources.map((r) => (
            <ResourceCard
              key={r.id}
              resource={r}
               canEditStatus={canEditStatus}
  onStatusChange={(status) => handleStatusChange(r.id, status)}
            />
          ))}
        </div>
      </div>

      {/* Add Resource Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Resource</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddResource} className="space-y-4">
            <Input
              placeholder="Resource name"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
            />

            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              className="w-full"
            >
              {isLocating ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Detect Location
                </>
              )}
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full border-2 border-foreground"
            >
              {isSubmitting ? "Adding..." : "Add Resource"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
