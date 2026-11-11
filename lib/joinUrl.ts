"use client";

import { useEffect, useState } from "react";
import { readPartyCode } from "./storage";

/**
 * The link guests scan: this site's root plus ?code=.
 * Open /slideshow?code=YOURCODE or /qr?code=YOURCODE so the QR includes it.
 */
export function useJoinUrl() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      const code = readPartyCode();
      const u = new URL("/", window.location.origin);
      if (code) u.searchParams.set("code", code);
      setUrl(u.toString());
    }, 0);
    return () => clearTimeout(t);
  }, []);
  return url;
}
