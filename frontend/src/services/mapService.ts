const API_BASE = "http://localhost:5000";

export async function getNearbyMapData(
  lat: number,
  lng: number,
  radius = 10,
  token: string
) {
  const res = await fetch(
    `${API_BASE}/map/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch map data");
  }

  return res.json();
}
