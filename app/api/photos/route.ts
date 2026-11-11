import {
  fullPath,
  getAdminClient,
  isValidCode,
  thumbPath,
  UUID_RE,
} from "@/lib/supabaseAdmin";
import { BUCKET } from "@/lib/supabase";

/**
 * Step 2 of an upload: after the phone has uploaded both files, record the
 * photo in the table. Realtime then pushes it to every open gallery/slideshow.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!isValidCode(body?.code)) {
    return Response.json({ error: "Wrong party code" }, { status: 401 });
  }

  const id = typeof body?.id === "string" ? body.id : "";
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Bad photo id" }, { status: 400 });
  }

  const name =
    typeof body?.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 40)
      : null;

  const admin = getAdminClient();

  // Make sure the full image actually landed before listing it.
  const { data: exists } = await admin.storage
    .from(BUCKET)
    .exists(fullPath(id));
  if (!exists) {
    return Response.json({ error: "Upload not found" }, { status: 400 });
  }

  const { error } = await admin.from("photos").insert({
    id,
    path: fullPath(id),
    thumb_path: thumbPath(id),
    name,
  });

  if (error) {
    console.error("insert photo failed", error);
    return Response.json({ error: "Could not save photo" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
