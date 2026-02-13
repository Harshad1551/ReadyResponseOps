import { useEffect, useState } from "react";
import { MapPin, Clock, User, Truck, AlertTriangle, Circle, CheckCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Incident, Resource } from "@/types";
import { useAuth } from "@/context/AuthContext";
import {
  assignResourceToIncident,
  resolveIncident,
  getIncident, // ✅ IMPORTANT
} from "@/services/incidentService";
import { formatDistanceToNow } from "date-fns";
interface Props {
  incident: any | null;
  resources: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (incidentId: string, newStatus: string) => void;
}

export function IncidentDetailPanel({
  incident,
  resources,
  open,
  onOpenChange,
}: Props) {
  const { user, token } = useAuth();


  const [assignOpen, setAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (incident) {
      const lat = incident.location?.lat ?? incident.location?.latitude ?? (incident as any).latitude;
      const lng = incident.location?.lng ?? incident.location?.longitude ?? (incident as any).longitude;

      if (lat && lng) {
        if (incident.location?.address && !incident.location.address.startsWith("Lat:")) {
          setAddress(incident.location.address);
        } else {
          import("@/services/geocodingService").then(({ reverseGeocode }) => {
            reverseGeocode(lat, lng).then(setAddress);
          });
        }
      }
    }
  }, [incident]);

  // Removed redundant fetch. Dashboard passes fresh data via socket updates.
  const data = incident;

  if (!data) return null;

  // Removed strict "if (!fullIncident) return null" to allow Sheet to animate/open with partial data
  const availableResources = resources.filter(
    (r) => r.status === "Available"
  );

  const canAssign = user?.role === "coordinator";
  const canResolve =
    user?.role === "coordinator" || user?.role === "community";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="flex flex-col p-0">
          {/* HEADER */}
          <SheetHeader className="p-6 border-b-2 border-border">
            <div className="flex items-start justify-between">
              <SheetTitle className="text-2xl font-bold">
                {data.type || data.category}
              </SheetTitle>

              <div className="flex flex-col items-end gap-2">
                {data.severity && (
                  <span className="px-2 py-1 text-xs font-mono uppercase border-2 border-red-600 text-red-600">
                    {data.severity}
                  </span>
                )}
                <span className="px-2 py-1 text-xs font-mono uppercase border-2 border-green-600 text-green-600">
                  {data.status}
                </span>
              </div>
            </div>
          </SheetHeader>

          {/* INCIDENT DETAILS */}
          <div className="flex-1 divide-y-2 divide-border overflow-y-auto">

            {/* REPORTED TIME */}
            <section className="p-6">
              <p className="text-sm text-muted-foreground">
                Reported at{" "}
                {data.created_at || data.reportedAt ? new Date(data.created_at || data.reportedAt!).toLocaleString() : 'N/A'}
              </p>
            </section>

            {/* DESCRIPTION */}
            {data.description && (
              <section className="p-6">
                <h3 className="font-mono text-xs uppercase text-muted-foreground mb-2">
                  Description
                </h3>
                <p className="text-sm leading-relaxed">
                  {data.description}
                </p>
              </section>
            )}

            {/* LOCATION */}
            <section className="p-6">
              <h3 className="font-mono text-xs uppercase text-muted-foreground mb-2">
                Location
              </h3>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{address || "Loading location..."}</span>
              </div>
            </section>

            {/* ASSIGNED RESOURCES */}
            <section className="p-6">
              <h3 className="font-mono text-xs uppercase text-muted-foreground mb-3">
                Assigned Resources
              </h3>

              {data.assignedResources?.length > 0 ? (
                <div className="space-y-2">
                  {data.assignedResources.map((rid) => {
                    const res = resources.find((r) => r.id === rid);
                    if (!res) return null;

                    return (
                      <div
                        key={rid}
                        className="flex items-center justify-between p-3 border-2 border-border bg-muted/50"
                      >
                        <div>
                          <p className="font-medium text-sm">{res.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {res.type}
                          </p>
                        </div>
                        <span className="text-xs font-mono uppercase">
                          {res.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No resources assigned
                </p>
              )}
            </section>
          </div>

          {/* ACTIONS (BOTTOM) */}
          <div className="p-6 border-t-2 border-border space-y-3">
            {canAssign && (
              <Button
                className="w-full border-2 border-foreground h-12"
                onClick={() => setAssignOpen(true)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Assign Resource
              </Button>
            )}

            {canResolve && data.status !== "resolved" && (
              <Button
                variant="outline"
                className="w-full border-2 border-foreground h-11"
                onClick={async () => {
                  try {
                    await resolveIncident(data.id, token!);
                    onOpenChange(false);
                  } catch (err: any) {
                    alert(err.message);
                  }
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve Incident
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ASSIGN RESOURCE DIALOG */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Resource to Assign</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {availableResources.map((resource) => (
              <Button
                key={resource.id}
                variant="outline"
                className="w-full justify-between"
                disabled={assigning}
                onClick={async () => {
                  try {
                    setAssigning(true);
                    await assignResourceToIncident(
                      data.id,
                      resource.id,
                      token!
                    );
                    setAssignOpen(false);
                  } finally {
                    setAssigning(false);
                  }
                }}
              >
                <span>{resource.name}</span>
                <span className="text-xs text-muted-foreground">
                  {resource.type}
                </span>
              </Button>
            ))}

            {availableResources.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No available resources
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}