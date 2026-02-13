import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet marker issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = { lat: number; lng: number };

export default function TrackingTest() {
  // MANUAL INPUTS
  const [ambulanceStart, setAmbulanceStart] = useState<LatLng>({
    lat: 18.5204, // Pune
    lng: 73.8567,
  });

  const [incident, setIncident] = useState<LatLng>({
    lat: 19.2183, // Thane
    lng: 72.9781,
  });

  // ROUTING
  const [route, setRoute] = useState<LatLng[]>([]);
  const [ambulancePos, setAmbulancePos] = useState<LatLng | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  // Fetch road route from OSRM
  const fetchRoute = async () => {
    const url = `https://router.project-osrm.org/route/v1/driving/${ambulanceStart.lng},${ambulanceStart.lat};${incident.lng},${incident.lat}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    const coords = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ lat, lng })
    );

    setRoute(coords);
    setAmbulancePos(coords[0]);
    setEta(Math.round(data.routes[0].duration / 60)); // minutes
  };

  // Animate ambulance along road
  useEffect(() => {
    if (!route.length) return;

    let index = 0;
    const interval = setInterval(() => {
      index++;
      if (index >= route.length) {
        clearInterval(interval);
        return;
      }
      setAmbulancePos(route[index]);
    }, 300); // speed control

    return () => clearInterval(interval);
  }, [route]);

  return (
    <div style={{ padding: 12 }}>
      <h2>🚑 Road-Based Ambulance Tracking</h2>

      {/* INPUTS */}
      <h4>🚑 Ambulance Start</h4>
      <input
        type="number"
        step="0.0001"
        value={ambulanceStart.lat}
        onChange={(e) =>
          setAmbulanceStart({ ...ambulanceStart, lat: +e.target.value })
        }
      />
      <input
        type="number"
        step="0.0001"
        value={ambulanceStart.lng}
        onChange={(e) =>
          setAmbulanceStart({ ...ambulanceStart, lng: +e.target.value })
        }
      />

      <h4>📍 Incident Location</h4>
      <input
        type="number"
        step="0.0001"
        value={incident.lat}
        onChange={(e) =>
          setIncident({ ...incident, lat: +e.target.value })
        }
      />
      <input
        type="number"
        step="0.0001"
        value={incident.lng}
        onChange={(e) =>
          setIncident({ ...incident, lng: +e.target.value })
        }
      />

      <br />
      <button onClick={fetchRoute} style={{ marginTop: 10 }}>
        🚦 Start Road Tracking
      </button>

      {eta && <p>⏱️ Estimated Time: {eta} minutes</p>}

      {/* MAP */}
      <div style={{ height: "65vh", marginTop: 10 }}>
        <MapContainer
          center={ambulanceStart}
          zoom={7}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={incident}>
            <Popup>📍 Incident</Popup>
          </Marker>

          {ambulancePos && (
            <Marker position={ambulancePos}>
              <Popup>🚑 Ambulance</Popup>
            </Marker>
          )}

          {route.length > 0 && (
            <Polyline positions={route} color="blue" />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
