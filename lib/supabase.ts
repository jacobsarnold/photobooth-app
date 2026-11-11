import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET = "photos";

export type Photo = {
  id: string;
  path: string;
  thumb_path: string;
  name: string | null;
  created_at: string;
};

let browserClient: SupabaseClient | null = null;

/** Browser client using the public anon key (read-only thanks to RLS). */
export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }
    browserClient = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

export function publicUrl(path: string): string {
  return getBrowserClient().storage.from(BUCKET).getPublicUrl(path).data
    .publicUrl;
}

export const partyTitle =
  process.env.NEXT_PUBLIC_PARTY_TITLE?.trim() || "Party Photobooth";
