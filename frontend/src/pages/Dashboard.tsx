import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { InteractiveMap } from '@/components/map/InteractiveMap';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { IncidentDetailPanel } from '@/components/incidents/IncidentDetailPanel';
import { IncidentReportForm } from '@/components/incidents/IncidentReportForm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { getIncident, getResources } from '@/services/incidentService';
import { Incident, IncidentSeverity, IncidentStatus, Resource, ResourceStatus } from '@/types';
import { socket } from '@/lib/socket';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | number | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Helper: Calculate distance in KM
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
      ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  // 1. Get User Location (only for Community to filter)
  useEffect(() => {
    if (user?.role === 'community' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to NYC or leave null
        }
      );
    }
  }, [user?.role]);


  // 2. Fetch Incidents & Resources & Socket Setup
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Incidents
        const incidentData = await getIncident(token);
        if (incidentData && incidentData.incidents) {
          const mappedIncidents: Incident[] = incidentData.incidents.map((item: any) => ({
            id: item.id,
            type: item.category,
            severity: item.severity.toLowerCase() as IncidentSeverity,
            status: item.status.toLowerCase() as IncidentStatus,
            location: {
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude),
              address: `Lat: ${parseFloat(item.latitude).toFixed(4)}, Lng: ${parseFloat(item.longitude).toFixed(4)}`
            },
            description: item.description,
            reportedBy: item.reported_by,
            reporterId: item.reporter_id,
            reportedAt: new Date(item.created_at),
            assignedResources: item.assignedResources
          }));
          setIncidents(mappedIncidents);
        }

        // Fetch Resources
        const resourceData = await getResources(token);
        if (Array.isArray(resourceData)) {
          const mappedResources: Resource[] = resourceData.map((item: any) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            status: item.status as ResourceStatus,
            location: {
              lat: parseFloat(item.latitude),
              lng: parseFloat(item.longitude)
            },
            agencyId: item.agency_id  // Map backend agency_id to frontend agencyId
          }));
          setResources(mappedResources);
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();

    // SOCKET.IO CONNECTION
    if (token) {
      socket.auth = { token }; // if backend supports auth handshake
      socket.connect();

      socket.on('incident:new', (newIncident: any) => {
        console.log("New Incident Socket Event:", newIncident);
        const mapped: Incident = {
          id: newIncident.id,
          type: newIncident.category,
          severity: newIncident.severity.toLowerCase(),
          status: newIncident.status.toLowerCase(),
          location: {
            lat: parseFloat(newIncident.latitude),
            lng: parseFloat(newIncident.longitude),
            address: `Lat: ${parseFloat(newIncident.latitude).toFixed(4)}, Lng: ${parseFloat(newIncident.longitude).toFixed(4)}`
          },
          description: newIncident.description,
          reportedBy: newIncident.reported_by,
          reporterId: newIncident.reporter_id,
          reportedAt: new Date(newIncident.created_at),
          assignedResources: []
        };
        setIncidents(prev => [mapped, ...prev]);
      });

      socket.on('incident:updated', (updated: any) => {
        if (!updated) return; // Safety check
        console.log("Incident Updated Socket Event:", updated);
        setIncidents(prev => prev.map(i => {
          if (i.id === updated.id) {
            return {
              ...i,
              status: updated.status.toLowerCase(),
              assignedResources: Array.isArray(updated.assignedResources) ? updated.assignedResources : []
            }
          }
          return i;
        }));
      });

      // Handle resource updates (from resources.js and incident.js)
      const handleResourceUpdate = (updated: any) => {
        if (!updated) return;
        console.log("Resource Updated Socket Event:", updated);
        setResources(prev => prev.map(r => r.id === updated.id ? {
          ...r,
          status: updated.status,
          // Update location if it changed
          location: (updated.latitude && updated.longitude) ? {
            lat: parseFloat(updated.latitude),
            lng: parseFloat(updated.longitude)
          } : r.location
        } : r));
      };

      socket.on('resource:updated', handleResourceUpdate); // form resources.js
      socket.on('resource:assigned', handleResourceUpdate); // from incident.js

      socket.on('resource:new', (newResource: any) => {
        if (!newResource) return;
        const mapped: Resource = {
          id: newResource.id,
          name: newResource.name,
          type: newResource.type,
          status: newResource.status,
          location: {
            lat: parseFloat(newResource.latitude),
            lng: parseFloat(newResource.longitude)
          }
        };
        setResources(prev => [...prev, mapped]);
      });
    }

    return () => {
      socket.off('incident:new');
      socket.off('incident:updated');
      socket.off('resource:new');
      socket.off('resource:updated');
      socket.off('resource:assigned');
      socket.disconnect();
    };
  }, [token]);

  // Open detail panel when an incident is selected
  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncidentId(incident.id);
    setIsDetailPanelOpen(true);
  };

  /* ===================== FILTERING LOGIC ===================== */
  // Base Filter: exclude resolved incidents for everyone on the Dashboard
  let filteredIncidents = incidents.filter(i => i.status !== 'resolved');

  let autoFocusIncidentId: string | number | undefined = undefined;

  // RULE 1: Community sees incidents if:
  // (a) They reported it (reporterId match)
  // (b) OR it's within 1km of their current location
  if (user?.role === 'community') {
    if (userLocation) {
      filteredIncidents = filteredIncidents.filter(i => {
        // Own incident?
        if (i.reporterId === user.id) return true;

        // Nearby incident?
        const dist = getDistanceFromLatLonInKm(
          userLocation.lat, userLocation.lng,
          i.location.lat, i.location.lng
        );
        return dist <= 1; // 1 KM Radius
      });
    } else {
      // If no location, show ONLY own incidents to be safe
      filteredIncidents = filteredIncidents.filter(i => i.reporterId === user.id);
    }
  }

  // RULE 2: Agency sees only incidents with resources assigned from their agency
  if (user?.role === 'agency') {
    console.log('🔍 AGENCY FILTER DEBUG');
    console.log('Current User ID:', user.id);
    console.log('Total Incidents:', incidents.length);
    console.log('Total Resources:', resources.length);

    // Filter incidents to only show those with assigned resources from this agency
    filteredIncidents = filteredIncidents.filter(incident => {
      console.log(`\n📋 Checking Incident #${incident.id}:`, incident);
      console.log('  - Assigned Resources:', incident.assignedResources);

      // If incident has no assigned resources, don't show it
      if (!incident.assignedResources || incident.assignedResources.length === 0) {
        console.log('  ❌ No assigned resources');
        return false;
      }

      // Check if any of the assigned resources belong to this agency
      const hasAgencyResource = incident.assignedResources.some(resourceId => {
        const resource = resources.find(r => r.id === resourceId);
        console.log(`  🔎 Checking Resource #${resourceId}:`, resource);
        if (resource) {
          console.log(`    - Resource agencyId: ${resource.agencyId} (type: ${typeof resource.agencyId})`);
          console.log(`    - User ID: ${user.id} (type: ${typeof user.id})`);
          console.log(`    - Match: ${resource.agencyId === user.id}`);
        }
        // Match resource's agencyId with user's id (assuming user.id represents the agency)
        return resource && resource.agencyId === user.id;
      });

      console.log(`  ✅ Has Agency Resource: ${hasAgencyResource}`);
      return hasAgencyResource;
    });

    console.log('🎯 Filtered Incidents Count:', filteredIncidents.length);

    // Auto-zoom to the first active/pending incident with agency's resources
    const assigned = filteredIncidents.find(i => i.status === 'active' || i.status === 'pending');
    if (assigned) {
      autoFocusIncidentId = assigned.id;
    }
  }

  // RULE 3: Coordinator sees all, but auto-focus on most critical/recent active incident
  if (user?.role === 'coordinator') {
    const activeIncidents = filteredIncidents.filter(i => i.status === 'active');

    if (activeIncidents.length > 0) {
      // Prioritize: Critical > High > Medium > Low
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

      activeIncidents.sort((a, b) => {
        const sA = severityOrder[a.severity] || 99;
        const sB = severityOrder[b.severity] || 99;
        return sA - sB; // Ascending (0 is highest priority)
      });
      autoFocusIncidentId = activeIncidents[0].id;
    } else if (filteredIncidents.length > 0) {
      // If no active, just show most recent
      autoFocusIncidentId = filteredIncidents[0].id;
    }
  }

  const activeIncidents = filteredIncidents.filter((i) => i.status === 'active');
  const criticalCount = activeIncidents.filter((i) => i.severity === 'High').length;

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId) || null;

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Main map area */}
        <div className="flex-1 relative">
          <InteractiveMap
            incidents={filteredIncidents}
            resources={user?.role === 'agency' ? resources.filter(r => r.agencyId === user.id) : resources}
            onIncidentClick={handleIncidentSelect}
            selectedIncidentId={selectedIncidentId ?? undefined}
            userRole={user?.role}
            autoFocusIncidentId={autoFocusIncidentId}
            userLocation={userLocation}
          />

          {/* Stats overlay */}
          <div className="absolute top-16 left-4 z-10 flex flex-col gap-2 animate-fade-in pointer-events-none">
            <div className="border-2 border-foreground bg-card px-4 py-3 shadow-md pointer-events-auto">
              <span className="font-mono text-xs text-muted-foreground">ACTIVE INCIDENTS</span>
              <div className="text-2xl font-bold">{activeIncidents.length}</div>
            </div>
            {criticalCount > 0 && (
              <div className="border-2 border-severity-critical bg-card px-4 py-3 shadow-md pulse-critical pointer-events-auto">
                <span className="font-mono text-xs text-severity-critical">CRITICAL / HIGH</span>
                <div className="text-2xl font-bold text-severity-critical">{criticalCount}</div>
              </div>
            )}
            {user?.role === 'community' && !userLocation && (
              <div className="border-2 border-yellow-500 bg-card px-4 py-2 shadow-md">
                <span className="text-xs font-bold text-yellow-600">Waiting for location...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Incident list */}
        <aside className="w-96 border-l-2 border-foreground bg-card flex flex-col">
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3">
            <div>
              <h2 className="font-bold">Nearby Incidents</h2>
              <p className="text-xs text-muted-foreground">
                Real-time incident feed
              </p>
            </div>
            {user?.role === 'community' && (
              <Button
                size="sm"
                onClick={() => setIsReportDialogOpen(true)}
                className="border-2 border-foreground"
              >
                <Plus className="h-4 w-4 mr-1" />
                Report
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y-2 divide-border animate-stagger-in">
              {filteredIncidents.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No incidents found in your area.</div>
              ) : (
                filteredIncidents
                  .sort((a, b) => {
                    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    // Prioritize active incidents
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (a.status !== 'active' && b.status === 'active') return 1;
                    // Then by severity
                    return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99);
                  })
                  .map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onClick={() => handleIncidentSelect(incident)}
                      compact
                    />
                  ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <IncidentDetailPanel
        incident={selectedIncident}
        resources={resources}
        open={isDetailPanelOpen}
        onOpenChange={setIsDetailPanelOpen}
      />

      {/* Report Incident Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="border-2 border-foreground bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Report New Incident</DialogTitle>
          </DialogHeader>
          <IncidentReportForm
            onSuccess={() => setIsReportDialogOpen(false)}
            onCancel={() => setIsReportDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}