import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

/** Server-only client with the service role key. Never import from client code. */
export function getAdminClient(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
      );
    }
    admin = createClient(url, key, { auth: { persistSession: false } });
  }
  return admin;
}

/** True when the code matches PARTY_CODE (or no code is configured). */
export function isValidCode(code: unknown): boolean {
  const expected = process.env.PARTY_CODE?.trim();
  if (!expected) return true;
  return typeof code === "string" && code.trim() === expected;
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const fullPath = (id: string) => `full/${id}.jpg`;
export const thumbPath = (id: string) => `thumbs/${id}.jpg`;
