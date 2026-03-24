"use strict";

import maxmind from "maxmind";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let reader;

export async function initGeoIP() {
  try {
    const dbPath =
      process.env.MAXMIND_DB_PATH ??
      path.join(__dirname, "geoip/GeoLite2-City.mmdb");
    reader = await maxmind.open(dbPath);
    console.log("MaxMind GeoIP2 loaded");
  } catch (err) {
    console.warn("GeoIP unavailable — geo features disabled:", err.message);
  }
}

export function lookupIP(ip) {
  if (!reader) return null;
  try {
    const result = reader.get(ip);
    if (!result) return null;
    return {
      country: result.country?.iso_code ?? null,
      city: result.city?.names?.en ?? null,
      lat: result.location?.latitude ?? null,
      lng: result.location?.longitude ?? null,
      timezone: result.location?.time_zone ?? null,
      isp: result.traits?.isp ?? null,
      isVPN: result.traits?.is_anonymous_vpn ?? false,
    };
  } catch {
    return null;
  }
}

export function getClientIP(request) {
  return (
    request.headers["cf-connecting-ip"] ?? 
    request.headers["x-forwarded-for"]?.split(",")[0].trim() ??
    request.ip
  );
}
