import { useEffect, useState } from "react";
import { Plus, Filter, Map, List } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { IncidentCard } from "@/components/incidents/IncidentCard";
import { IncidentReportForm } from "@/components/incidents/IncidentReportForm";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getIncident } from "@/services/incidentService";
import { IncidentDetailPanel } from "@/components/incidents/IncidentDetailPanel";
import { getResources } from "@/services/resourceService";
import { io } from "socket.io-client";

export default function IncidentsPage() {
  const { user, token, loading } = useAuth();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]); // ✅ real resources state
  const [view, setView] = useState<"list" | "map">("list");
  const [severityFilter, setSeverityFilter] = useState<string | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const API_BASE = import.meta.env.VITE_API_URL;
  const socket = io(API_BASE, {
    transports: ["websocket"],
  });
  /* ===================== FETCH INCIDENTS ===================== */
  const loadIncidents = async () => {
    try {
      const [incidentRes, resourceRes] = await Promise.all([
        getIncident(token),
        getResources(token),
      ]);

      setIncidents(incidentRes.incidents || []);
      setResources(resourceRes || []);
    } catch (err) {
      console.error("Failed to load incidents", err);
    }
  };

  useEffect(() => {
    if (loading || !token) return;
    loadIncidents();
  }, [token, loading]);

  useEffect(() => {
    socket.on("incident:new", (incident) => {
      if (!incident) return;
      setIncidents((prev) => [incident, ...prev.filter(Boolean)]);
    });

    socket.on("incident:updated", (updatedIncident) => {
      if (!updatedIncident) return;

      setIncidents((prev) =>
        prev.map((i) => {
          if (!i) return i;
          return i.id === updatedIncident.id ? updatedIncident : i;
        })
      );

      setSelectedIncident((prev) => {
        if (!prev) return prev;
        return prev.id === updatedIncident.id ? updatedIncident : prev;
      });
    });

    socket.on("resource:new", (newResource) => {
      if (!newResource) return;
      setResources((prev) => {
        if (prev.some((r) => r?.id === newResource.id)) return prev;
        return [newResource, ...prev.filter(Boolean)];
      });
    });

    socket.on("resource:assigned", (updatedResource) => {
      if (!updatedResource) return;
      setResources((prev) =>
        prev.map((r) => {
          if (!r) return r;
          return r.id === updatedResource.id ? updatedResource : r;
        })
      );
    });

    socket.on("resource:update", (updatedResource) => {
      if (!updatedResource) return;
      setResources((prev) =>
        prev.map((r) => {
          if (!r) return r;
          return r.id === updatedResource.id ? updatedResource : r;
        })
      );
    });

    return () => {
      socket.off("incident:new");
      socket.off("incident:updated");
      socket.off("resource:new");
      socket.off("resource:assigned");
      socket.off("resource:update");
    };
  }, []);
  /* ===================== STATUS UPDATE ===================== */
  const handleIncidentStatusChange = (
    incidentId: string,
    newStatus: string
  ) => {
    // Update selected incident
    setSelectedIncident((prev) =>
      prev ? { ...prev, status: newStatus } : prev
    );

    // Update incident list
    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === incidentId
          ? { ...incident, status: newStatus }
          : incident
      )
    );
  };

  /* ===================== FILTER LOGIC ===================== */
  const filteredIncidents = incidents.filter((incident) => {
    if (severityFilter !== "all" && incident.severity !== severityFilter)
      return false;
    if (statusFilter !== "all" && incident.status !== statusFilter)
      return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
            <p className="text-sm text-muted-foreground">
              View and manage emergency incidents
            </p>
          </div>

          {user?.role === "community" && (
            <Button
              onClick={() => setIsReportDialogOpen(true)}
              className="border-2 border-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-2 border-foreground bg-card p-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4" />

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] border-2 border-foreground">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-2 border-foreground">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <span className="ml-4 text-sm">
              {filteredIncidents.length} incidents
            </span>
          </div>

          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="border-2 border-foreground">
              <TabsTrigger value="list">
                <List className="h-4 w-4 mr-1" /> List
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {view === "list" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => setSelectedIncident(incident)}
              />
            ))}
          </div>
        ) : (
          <div className="h-[600px]">
            <InteractiveMap
              incidents={filteredIncidents}
              resources={user?.role === 'agency' ? resources.filter(r => r.agencyId === user.id) : resources}
              onIncidentClick={setSelectedIncident}
              selectedIncidentId={selectedIncident?.id}
            />
          </div>
        )}
      </div>

      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>

          <IncidentReportForm
            onCancel={() => setIsReportDialogOpen(false)}
            onSuccess={() => {
              loadIncidents();
              setIsReportDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Incident Detail */}
      <IncidentDetailPanel
        incident={selectedIncident}
        resources={resources}
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
        onStatusChange={handleIncidentStatusChange}
      />
    </DashboardLayout>
  );
}
