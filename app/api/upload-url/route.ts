import { randomUUID } from "node:crypto";
import {
  fullPath,
  getAdminClient,
  isValidCode,
  thumbPath,
} from "@/lib/supabaseAdmin";
import { BUCKET } from "@/lib/supabase";

/**
 * Step 1 of an upload: check the party code and hand back two signed upload
 * URLs (full image + thumbnail). The phone then uploads straight to Supabase,
 * so the image bytes never pass through Vercel.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isValidCode(body?.code)) {
    return Response.json({ error: "Wrong party code" }, { status: 401 });
  }

  const id = randomUUID();
  const bucket = getAdminClient().storage.from(BUCKET);
  const [full, thumb] = await Promise.all([
    bucket.createSignedUploadUrl(fullPath(id)),
    bucket.createSignedUploadUrl(thumbPath(id)),
  ]);

  if (full.error || thumb.error) {
    console.error("createSignedUploadUrl failed", full.error ?? thumb.error);
    return Response.json({ error: "Could not start upload" }, { status: 500 });
  }

  return Response.json({
    id,
    full: { path: full.data.path, token: full.data.token },
    thumb: { path: thumb.data.path, token: thumb.data.token },
  });
}
