import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Incident, Resource } from '@/types';
import { AlertTriangle, Truck, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import { routingService } from '@/services/routingService';
import { socket } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

interface InteractiveMapProps {
  incidents: Incident[];
  resources: Resource[];
  onIncidentClick?: (incident: Incident) => void;
  selectedIncidentId?: string | number;
  autoFocusIncidentId?: string | number;
  userRole?: string;
  userLocation?: { lat: number; lng: number } | null;
}

// Fix for missing types/mismatch
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;
const PolylineAny = Polyline as any;

// Custom Icons
const createIcon = (color: string, icon: React.ReactNode, isResource = false) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div class="flex items-center justify-center w-8 h-8 rounded-md border-2 border-white shadow-md ${color} ${isResource ? 'animate-bounce-slight' : ''}">
      ${renderToString(icon as React.ReactElement)}
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const severityColors = {
  critical: 'bg-red-600',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
  resolved: 'bg-gray-400',
};

// Map Controller for auto-zoom and initial view
function MapController({
  center,
  zoom
}: {
  center?: [number, number];
  zoom?: number
}) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, {
        duration: 2, // Smooth animation
      });
    }
  }, [center, zoom, map]);

  return null;
}

export function InteractiveMap({
  incidents,
  resources,
  onIncidentClick,
  selectedIncidentId,
  autoFocusIncidentId,
  userLocation,
  userRole
}: InteractiveMapProps) {
  const { user } = useAuth();

  // Tracking State
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Live Data State (overrides props for tracked resource)
  const [trackedResourceLocation, setTrackedResourceLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [trackedResourceId, setTrackedResourceId] = useState<string | number | null>(null);

  // Default values
  const defaultCenter: [number, number] = [40.7128, -74.0060]; // NYC fallback
  const defaultZoom = 13;

  // Determine center based on role or selection
  let mapCenter = defaultCenter;
  let mapZoom = defaultZoom;

  const activeIncident = incidents.find(i => i.id === (selectedIncidentId || autoFocusIncidentId));

  // 1️⃣ LISTEN FOR SOCKET UPDATES (Community View)
  useEffect(() => {
    if (activeIncident) {
      // Join incident room
      socket.emit('join', { incidentId: activeIncident.id });

      const handleLocationUpdate = (data: any) => {
        // data: { resourceId, location: {lat, lng}, eta }
        console.log("📍 Live Update Received:", data);
        setTrackedResourceLocation(data.location);
        setTrackedResourceId(data.resourceId);
        setEta(data.eta);
      };

      socket.on('resource:location_updated', handleLocationUpdate);

      return () => {
        socket.off('resource:location_updated', handleLocationUpdate);
      }
    }
  }, [activeIncident]);

  // 2️⃣ CALCULATE ROUTE (Agency & Initial View)
  useEffect(() => {
    const fetchRoute = async () => {
      // Find assigned resource for this incident
      // Use incident.assignedResources array if available, otherwise check resource.incidentId
      const assignedResource = resources.find(r => {
        const isEngaged = r.status === 'Engaged';
        const isAssignedToThis = activeIncident?.assignedResources?.some(id => String(id) === String(r.id));
        // @ts-ignore
        const hasIncidentId = r.incident_id === activeIncident?.id || r.incidentId === activeIncident?.id;

        return isEngaged && (isAssignedToThis || hasIncidentId);
      });

      console.log('🛣️ Computing Route:', {
        incidentId: activeIncident?.id,
        foundResource: assignedResource,
        incidentLoc: activeIncident?.location,
        resourceLoc: assignedResource?.location
      });

      if (activeIncident?.location?.lat && assignedResource?.location?.lat) {
        // use live location if available, else static
        const start = trackedResourceId === assignedResource.id && trackedResourceLocation
          ? trackedResourceLocation
          : { lat: assignedResource.location.lat!, lng: assignedResource.location.lng! };

        const end = { lat: activeIncident.location.lat!, lng: activeIncident.location.lng! };

        const routeData = await routingService.getRoute(start, end);

        if (routeData) {
          setRouteCoordinates(routeData.coordinates);
          setEta(routingService.formatDuration(routeData.duration));

          // If we are starting simulation, we use this route
        }
      } else {
        setRouteCoordinates([]);
        setEta(null);
      }
    };

    fetchRoute();
  }, [activeIncident, resources, trackedResourceLocation]);

  // 3️⃣ REAL GPS TRACKING (Agency Only)
  const [watchId, setWatchId] = useState<number | null>(null);

  const startLiveTracking = () => {
    if (!activeIncident || !navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    // Find the resource the agency owns that is assigned here
    // @ts-ignore
    const myResource = resources.find(r => r.status === 'Engaged' && (r.agencyId === user?.id || r.agency_id === user?.id));
    if (!myResource) {
      console.error("No resource found for tracking");
      return;
    }

    setIsSimulating(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };

        console.log("📍 GPS Update:", location);

        // 1. Calculate REAL ETA and Route from CURRENT location to INCIDENT
        const end = { lat: activeIncident.location.lat!, lng: activeIncident.location.lng! };
        const routeData = await routingService.getRoute(location, end);

        let currentEta = "Calculating...";
        if (routeData) {
          // Update local route line to show remaining path
          setRouteCoordinates(routeData.coordinates);
          currentEta = routingService.formatDuration(routeData.duration);
        }

        // 2. Emit Socket Update
        socket.emit('resource:update_location', {
          resourceId: myResource.id,
          incidentId: activeIncident.id,
          location,
          eta: currentEta
        });

        // 3. Update Local State
        setTrackedResourceLocation(location);
        setTrackedResourceId(myResource.id);
        setEta(currentEta);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        alert("Error getting location: " + error.message);
        stopLiveTracking();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    setWatchId(id);
  };

  const stopLiveTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsSimulating(false);
  };


  // --- View Logic ---
  if (activeIncident?.location?.lat) {
    mapCenter = [activeIncident.location.lat, activeIncident.location.lng];
    mapZoom = 15;
  } else if (userLocation) {
    mapCenter = [userLocation.lat, userLocation.lng];
  }


  return (
    <div className="relative h-full w-full overflow-hidden border-2 border-foreground bg-secondary">

      {/* Map Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[50] flex items-center justify-between border-b-2 border-foreground bg-card px-4 py-2 opacity-95">
        <span className="font-mono text-xs tracking-wider text-muted-foreground">
          LIVE SITUATIONAL MAP
        </span>
        <div className="flex items-center gap-4">
          {/* ETA Badge */}
          {eta && (
            <div className="flex items-center gap-2 bg-foreground text-background px-2 py-0.5 rounded-sm animate-pulse">
              <Navigation className="h-3 w-3" />
              <span className="font-mono text-xs font-bold">ETA: {eta}</span>
            </div>
          )}
        </div>
      </div>


      <MapContainerAny
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <TileLayerAny
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={mapCenter} zoom={mapZoom} />

        {/* Route Line */}
        {routeCoordinates.length > 0 && (
          <PolylineAny
            positions={routeCoordinates}
            color="#2563eb" // Blue
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}


        {/* Incident Markers */}
        {incidents.map((incident) => {
          if (!incident.location?.lat || !incident.location?.lng) return null;
          // @ts-ignore
          const severityClass = severityColors[incident.status === 'resolved' ? 'resolved' : incident.severity.toLowerCase()] || 'bg-gray-500';

          return (
            <MarkerAny
              key={incident.id}
              position={[incident.location.lat, incident.location.lng]}
              icon={createIcon(severityClass, <AlertTriangle className="h-4 w-4 text-white" />)}
              eventHandlers={{
                click: () => onIncidentClick?.(incident),
              }}
            >
              <Popup>
                <div className="text-sm font-bold">{incident.type || incident.category}</div>
                <div className="text-xs mb-2">{incident.status}</div>
                {userRole === 'agency' && (
                  <Button
                    className="w-full text-xs h-6 mt-1"
                    // @ts-ignore
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Start Tracking Clicked for:", incident.id);
                      // We need to trigger simulation for THIS incident.
                      // Since logic relies on activeIncident, making sure this sets it or calls handler is key.
                      // But the button handles simulation logic which uses `activeIncident`.
                      // We can call `startSimulation` if activeIncident matches, or set it up.
                      if (activeIncident?.id !== incident.id) {
                        onIncidentClick?.(incident);
                      }
                      // Small timeout to allow state update if needed, but ideally we call a function that takes incidentId
                      setTimeout(() => {
                        if (isSimulating) stopLiveTracking();
                        else startLiveTracking();
                      }, 100);
                    }}
                    disabled={activeIncident?.id !== incident.id || routeCoordinates.length === 0}
                    variant={isSimulating && activeIncident?.id === incident.id ? "destructive" : "default"}
                  >
                    {isSimulating && activeIncident?.id === incident.id ? "Stop Tracking" : "Start Live Tracking"}
                  </Button>
                )}
              </Popup>
            </MarkerAny>
          );
        })}

        {/* Resource Markers */}
        {resources.map((resource) => {
          // If this resource is being tracked, use the live location
          const isTracked = resource.id === trackedResourceId;
          const location = isTracked && trackedResourceLocation ? trackedResourceLocation : resource.location;

          if (!location?.lat || !location?.lng) return null;
          // @ts-ignore
          if (resource.status !== 'Available' && !isTracked && activeIncident?.id !== resource.incidentId && activeIncident?.id !== resource.incident_id) return null; // Hide other engaged resources to reduce clutter

          return (
            <MarkerAny
              key={resource.id}
              position={[location.lat, location.lng]}
              icon={createIcon('bg-blue-600', <Truck className="h-4 w-4 text-white" />, isTracked)}
            >
              <Popup>
                <div className="text-sm font-bold">{resource.name}</div>
                <div className="text-xs">{resource.type}</div>
                {isTracked && <div className="text-xs font-mono mt-1 text-green-600">LIVE TRACKING</div>}
              </Popup>
            </MarkerAny>
          )
        })}

      </MapContainerAny>
    </div>
  );
}