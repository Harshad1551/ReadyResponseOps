export function normalizeLatLng(raw: any) {
  if (!raw) return null;

  let lat = raw.lat ?? raw.latitude;
  let lng = raw.lng ?? raw.longitude;

  if (typeof lat !== "number" || typeof lng !== "number") return null;

  // 🔥 fix scaled coordinates
  if (Math.abs(lat) > 90) lat = lat / 1_000_000;
  if (Math.abs(lng) > 180) lng = lng / 1_000_000;
  console.log(lat)
  console.log(lng)

  return { lat, lng };
}
