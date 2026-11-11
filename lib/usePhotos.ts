"use client";

import { useEffect, useState } from "react";
import { getBrowserClient, type Photo } from "./supabase";

/** All photos, newest first, kept live with Supabase Realtime. */
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = getBrowserClient();
    let cancelled = false;

    const addPhoto = (p: Photo) =>
      setPhotos((prev) =>
        prev.some((x) => x.id === p.id) ? prev : [p, ...prev],
      );

    const channel = sb
      .channel("photos-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "photos" },
        (payload) => addPhoto(payload.new as Photo),
      )
      .subscribe();

    sb.from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else
          setPhotos((prev) => {
            // keep anything realtime delivered while we were loading
            const ids = new Set(data.map((p) => p.id));
            return [...prev.filter((p) => !ids.has(p.id)), ...data];
          });
        setLoading(false);
      });

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, []);

  return { photos, loading, error };
}
