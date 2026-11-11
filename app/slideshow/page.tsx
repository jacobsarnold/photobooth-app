"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useJoinUrl } from "@/lib/joinUrl";
import { partyTitle, publicUrl } from "@/lib/supabase";
import { usePhotos } from "@/lib/usePhotos";

const SECONDS_PER_PHOTO = 6;

/**
 * Fullscreen slideshow for a TV/laptop. Cycles through every photo, and jumps
 * to brand-new ones as soon as they're uploaded.
 */
export default function SlideshowPage() {
  const { photos } = usePhotos();
  const joinUrl = useJoinUrl();

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const seen = useRef<Set<string> | null>(null);
  const queue = useRef<string[]>([]);
  const photosRef = useRef(photos);

  // Track newly arrived photos so they get shown next
  useEffect(() => {
    photosRef.current = photos;
    if (photos.length === 0) return;
    if (seen.current === null) {
      // first load: everything already there is "old"
      seen.current = new Set(photos.map((p) => p.id));
      return;
    }
    for (const p of photos) {
      if (!seen.current.has(p.id)) {
        seen.current.add(p.id);
        queue.current.push(p.id);
      }
    }
  }, [photos]);

  // Advance the slideshow
  useEffect(() => {
    function next() {
      const list = photosRef.current;
      if (list.length === 0) return;
      const fresh = queue.current.shift();
      if (fresh) {
        setCurrentId(fresh);
        setIsNew(true);
        return;
      }
      setIsNew(false);
      setCurrentId((cur) => {
        // list is newest-first; walk it oldest -> newest, then loop
        const idx = list.findIndex((p) => p.id === cur);
        const nextIdx = idx <= 0 ? list.length - 1 : idx - 1;
        return list[nextIdx].id;
      });
    }
    const first = setTimeout(next, 300);
    const interval = setInterval(next, SECONDS_PER_PHOTO * 1000);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  // Preload the photo after the current one
  useEffect(() => {
    const idx = photos.findIndex((p) => p.id === currentId);
    const upcoming = photos[idx <= 0 ? photos.length - 1 : idx - 1];
    if (upcoming) new Image().src = publicUrl(upcoming.path);
  }, [currentId, photos]);

  const current = photos.find((p) => p.id === currentId);

  return (
    <main
      className="relative h-dvh w-full cursor-none overflow-hidden bg-black"
      onDoubleClick={() => document.documentElement.requestFullscreen?.()}
    >
      {current ? (
        <>
          {/* blurred backdrop fills letterbox space */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={`bg-${current.id}`}
            src={publicUrl(current.thumb_path)}
            alt=""
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
          <div className="absolute inset-0 grid place-items-center p-8 pb-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={current.id}
              src={publicUrl(current.path)}
              alt=""
              style={{ animation: `fade 0.8s ease-out, kenburns ${SECONDS_PER_PHOTO}s linear` }}
              className="max-h-full max-w-full rounded-xl shadow-2xl"
            />
          </div>
          {(isNew || current.name) && (
            <div className="absolute bottom-8 left-8 rounded-full bg-black/60 px-5 py-2 text-xl backdrop-blur">
              {isNew && <span className="mr-2 font-bold text-pink-400">NEW</span>}
              {current.name && <>📸 {current.name}</>}
            </div>
          )}
        </>
      ) : (
        <div className="grid h-full place-items-center text-center">
          <div>
            <h1 className="text-6xl font-black">{partyTitle}</h1>
            <p className="mt-4 text-2xl text-white/60">
              Scan the code to add the first photo →
            </p>
          </div>
        </div>
      )}

      {joinUrl && (
        <div className="absolute right-8 bottom-8 rounded-2xl bg-white p-3 text-center shadow-2xl">
          <QRCodeSVG value={joinUrl} size={150} />
          <p className="mt-1 text-sm font-semibold text-black">
            Scan to add yours
          </p>
        </div>
      )}
    </main>
  );
}
