// Tiny localStorage helpers that never throw (private mode, blocked storage).

export function load(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/**
 * Reads ?code= from the URL (from the QR code) and remembers it,
 * so guests only need to scan once.
 */
export function readPartyCode(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("code");
  if (fromUrl) {
    save("party-code", fromUrl);
    return fromUrl;
  }
  return load("party-code");
}
