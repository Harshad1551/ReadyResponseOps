import { useState, useEffect } from "react";
import { MapPin, Clock, Users } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";
import { Incident } from "@/types";

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
  compact?: boolean;
}

/* ---------------- HELPERS ---------------- */
function formatTimeAgo(date?: Date | string): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatLocation(lat?: number, lng?: number) {
  if (lat == null || lng == null) return "Location unavailable";
  return `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`;
}

/* ---------------- COMPONENT ---------------- */
export function IncidentCard({
  incident,
  onClick,
  compact,
}: IncidentCardProps) {
  // Use reportedAt (mapped) or created_at (raw fallback)
  const dateToUse = incident.reportedAt || incident.created_at;

  // Handle location: check nested location object first (frontend style), then flat (backend style fallback)
  const lat = incident.location?.lat ?? incident.location?.latitude ?? (incident as any).latitude;
  const lng = incident.location?.lng ?? incident.location?.longitude ?? (incident as any).longitude;

  // New State for Address
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    if (lat && lng) {
      if (incident.location?.address && !incident.location.address.startsWith("Lat:")) {
        setAddress(incident.location.address);
      } else {
        import("@/services/geocodingService").then(({ reverseGeocode }) => {
          reverseGeocode(lat, lng).then((addr) => {
            if (isMounted) setAddress(addr);
          });
        });
      }
    }
    return () => { isMounted = false; };
  }, [lat, lng, incident.location?.address]);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left border-2 border-foreground bg-card transition-all duration-200 hover:bg-secondary",
        !compact &&
        "hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-sm",
        incident.severity.toLowerCase() === "critical" &&
        incident.status === "active" &&
        "border-severity-critical"
      )}
    >
      <div className={cn("p-4", compact && "p-3")}>
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "font-bold truncate",
                  compact ? "text-sm" : "text-base"
                )}
              >
                {incident.type || incident.category}
              </span>

              <SeverityBadge
                severity={incident.severity}
                pulse={incident.status === "active"}
              />

              <StatusBadge status={incident.status} />
            </div>

            {/* DESCRIPTION */}
            {!compact && incident.description && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {incident.description}
              </p>
            )}
          </div>

          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            #{incident.id}
          </span>
        </div>

        {/* FOOTER */}
        <div
          className={cn(
            "flex items-center gap-4 text-sm text-muted-foreground",
            compact ? "mt-2" : "mt-3"
          )}
        >
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[180px]" title={address}>
              {address || formatLocation(lat, lng)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimeAgo(dateToUse)}</span>
          </div>

          {incident.assignedResources &&
            incident.assignedResources.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{incident.assignedResources.length}</span>
              </div>
            )}
        </div>
      </div>
    </button>
  );
}
