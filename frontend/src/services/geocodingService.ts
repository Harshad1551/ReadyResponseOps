
// Simple in-memory cache to store address results for coordinates
const addressCache: Record<string, string> = {};

interface NominatimResponse {
    display_name: string;
    address: {
        road?: string;
        suburb?: string;
        city?: string;
        state?: string;
        country?: string;
        postcode?: string;
        [key: string]: string | undefined;
    };
}

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Round to 4 decimal places to increase cache hit rate (precision ~11m)
    const latKey = lat.toFixed(4);
    const lngKey = lng.toFixed(4);
    const cacheKey = `${latKey},${lngKey}`;

    if (addressCache[cacheKey]) {
        return addressCache[cacheKey];
    }

    try {
        // Determine user locale or default to 'en'
        const language = navigator.language || 'en';

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=${language}`,
            {
                headers: {
                    'User-Agent': 'CrisisResponseApp/1.0' // Best practice for OSM
                }
            }
        );

        if (!response.ok) {
            throw new Error('Geocoding failed');
        }

        const data: NominatimResponse = await response.json();

        // Construct a concise address
        // Priority: road, suburb/neighborhood, city, state
        let addressParts = [];

        if (data.address.road) addressParts.push(data.address.road);
        if (data.address.suburb) addressParts.push(data.address.suburb);
        else if (data.address.residential) addressParts.push(data.address.residential);

        if (data.address.city || data.address.town || data.address.village) {
            addressParts.push(data.address.city || data.address.town || data.address.village);
        }

        // If we have very little info, fall back to display_name (which is long)
        let formattedAddress = addressParts.join(', ');

        // If empty or too short, use a truncated display_name
        if (!formattedAddress || formattedAddress.length < 5) {
            formattedAddress = data.display_name.split(',').slice(0, 3).join(',');
        }

        addressCache[cacheKey] = formattedAddress;
        return formattedAddress;
    } catch (error) {
        console.error("Geocoding error:", error);
        return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`; // Fallback
    }
};
