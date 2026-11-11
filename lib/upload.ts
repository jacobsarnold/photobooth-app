import { BUCKET, getBrowserClient } from "./supabase";

type Signed = { path: string; token: string };

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

export async function uploadPhoto(opts: {
  code: string;
  name: string;
  full: Blob;
  thumb: Blob;
}) {
  const { id, full, thumb } = (await postJson("/api/upload-url", {
    code: opts.code,
  })) as { id: string; full: Signed; thumb: Signed };

  const bucket = getBrowserClient().storage.from(BUCKET);
  const [a, b] = await Promise.all([
    bucket.uploadToSignedUrl(full.path, full.token, opts.full, {
      contentType: "image/jpeg",
    }),
    bucket.uploadToSignedUrl(thumb.path, thumb.token, opts.thumb, {
      contentType: "image/jpeg",
    }),
  ]);
  if (a.error || b.error) {
    throw new Error((a.error ?? b.error)?.message ?? "Upload failed");
  }

  await postJson("/api/photos", { code: opts.code, id, name: opts.name });
}
