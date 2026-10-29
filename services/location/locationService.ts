import type { StoredLocation } from "@/types/settings";

export async function getCurrentLocation(): Promise<StoredLocation | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 12000,
      });
    });

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    let city = "Unknown";
    let country = "";

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`,
        { headers: { Accept: "application/json" } },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          address?: { city?: string; town?: string; village?: string; country?: string };
        };
        city = data.address?.city ?? data.address?.town ?? data.address?.village ?? city;
        country = data.address?.country ?? "";
      }
    } catch {
      // reverse geocode is optional
    }

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      city,
      country,
      timezone,
      source: "gps",
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function formatLocationLabel(location: StoredLocation): string {
  if (location.country) return `${location.city}, ${location.country}`;
  return location.city;
}
