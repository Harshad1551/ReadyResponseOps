// Open Source Routing Machine (OSRM) - Free public API
const OSRM_BASE = 'http://router.project-osrm.org/route/v1';

export interface RouteData {
    coordinates: [number, number][]; // LatLng array for Polyline
    duration: number; // Seconds
    distance: number; // Meters
}

export const routingService = {
    getRoute: async (
        start: { lat: number; lng: number },
        end: { lat: number; lng: number }
    ): Promise<RouteData | null> => {
        try {
            // OSRM expects {lon},{lat}
            const startCoord = `${start.lng},${start.lat}`;
            const endCoord = `${end.lng},${end.lat}`;

            const url = `${OSRM_BASE}/driving/${startCoord};${endCoord}?overview=full&geometries=geojson`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
                console.error('OSRM Error:', data);
                return null;
            }

            const route = data.routes[0];

            // Convert GeoJSON [lon, lat] to Leaflet [lat, lon]
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

            return {
                coordinates,
                duration: route.duration,
                distance: route.distance
            };
        } catch (error) {
            console.error('Routing Service Error:', error);
            return null;
        }
    },

    formatDuration: (seconds: number): string => {
        if (seconds < 60) return '< 1 min';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    }
};
