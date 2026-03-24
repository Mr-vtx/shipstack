"use strict";

import { lookupIP, getClientIP } from "../config/geoip.js";

export async function geoMiddleware(request) {
  const ip = getClientIP(request);
  const geo = lookupIP(ip);

  request.geo = geo ?? {
    country: request.headers["cf-ipcountry"] ?? null,
    city: null,
    lat: null,
    lng: null,
    timezone: null,
    isVPN: false,
  };

  request.clientIP = ip;
}
