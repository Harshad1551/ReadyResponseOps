import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function TestMap() {
  const rawIncident = {
    latitude: 19447357,
    longitude: 73.0062,
  };

  const lat = rawIncident.latitude / 1_000_000;
  const lng = rawIncident.longitude;

  console.log("Normalized:", lat, lng);

  return (
    <div style={{ height: "100vh" }}>
      <MapContainer
        center={{ lat, lng }}
        zoom={12}
        style={{ height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={{ lat, lng }} />
      </MapContainer>
    </div>
  );
}
