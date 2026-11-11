"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { partyTitle, publicUrl, type Photo } from "@/lib/supabase";
import { usePhotos } from "@/lib/usePhotos";

export default function GalleryPage() {
  const { photos, loading, error } = usePhotos();
  const [open, setOpen] = useState<Photo | null>(null);

  // Close lightbox with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-[max(env(safe-area-inset-top),16px)] pb-16">
      <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-3 bg-[#140b1f]/90 px-4 py-3 backdrop-blur">
        <div className="flex-1">
          <h1 className="text-xl font-bold">{partyTitle}</h1>
          <p className="text-sm text-white/60">
            {loading ? "Loading…" : `${photos.length} photo${photos.length === 1 ? "" : "s"} · updates live`}
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full bg-pink-500 px-4 py-2 text-sm font-semibold"
        >
          📸 Take one
        </Link>
      </header>

      {error && (
        <p className="rounded-xl bg-red-500/20 px-4 py-3 text-red-100">
          Couldn&apos;t load photos: {error}
        </p>
      )}

      {!loading && !error && photos.length === 0 && (
        <p className="py-24 text-center text-white/60">
          No photos yet. Be the first! 🎈
        </p>
      )}

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => (
          <li key={p.id} className="animate-[drop_0.4s_ease-out]">
            <button
              onClick={() => setOpen(p)}
              className="block w-full overflow-hidden rounded-lg bg-white/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicUrl(p.thumb_path)}
                alt={p.name ? `Photo by ${p.name}` : "Party photo"}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
            </button>
            {p.name && (
              <p className="mt-1 truncate px-1 text-xs text-white/60">
                {p.name}
              </p>
            )}
          </li>
        ))}
      </ul>

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 animate-[fade_0.15s]"
          onClick={() => setOpen(null)}
        >
          <div className="flex items-center justify-between pb-3 pt-[env(safe-area-inset-top)]">
            <span className="text-sm text-white/70">
              {open.name ?? ""}{" "}
              {new Date(open.created_at).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <div className="flex gap-2">
              <a
                href={`${publicUrl(open.path)}?download=party-${open.id.slice(0, 8)}.jpg`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                Download
              </a>
              <button
                onClick={() => setOpen(null)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
          <div className="grid flex-1 place-items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={publicUrl(open.path)}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}
