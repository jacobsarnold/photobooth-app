"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fileToBitmap,
  makeThumb,
  renderFramed,
  toJpeg,
} from "@/lib/image";
import { load, readPartyCode, save } from "@/lib/storage";
import { partyTitle } from "@/lib/supabase";
import { uploadPhoto } from "@/lib/upload";

type Phase = "live" | "countdown" | "preview" | "uploading" | "done";
type Shot = { full: Blob; thumb: Blob; url: string };

const COUNTDOWN_FROM = 3;

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("live");
  const [count, setCount] = useState(COUNTDOWN_FROM);
  const [flash, setFlash] = useState(false);
  const [shot, setShot] = useState<Shot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [taken, setTaken] = useState(0);

  // Read saved name + party code once on load
  useEffect(() => {
    const t = setTimeout(() => {
      setName(load("guest-name"));
      setCode(readPartyCode());
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Start / restart the camera when the facing direction changes
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamError("This browser can't show a live camera.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1920 },
            height: { ideal: 1440 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
        }
        setCamError(null);
        setCamReady(true);
      } catch (e) {
        console.error(e);
        setCamError(
          "Couldn't open the live camera. Allow camera access in your browser settings, or use your phone's camera instead:",
        );
      }
    }

    setTimeout(() => setCamReady(false), 0);
    start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing]);

  const finishShot = useCallback(async (canvas: HTMLCanvasElement) => {
    const [full, thumb] = await Promise.all([
      toJpeg(canvas, 0.85),
      toJpeg(makeThumb(canvas), 0.75),
    ]);
    setShot({ full, thumb, url: URL.createObjectURL(full) });
    setPhase("preview");
  }, []);

  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
    const canvas = renderFramed(
      video,
      video.videoWidth,
      video.videoHeight,
      facing === "user",
    );
    await finishShot(canvas);
  }, [facing, finishShot]);

  // Countdown ticker
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      const t = setTimeout(() => void capture(), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count, capture]);

  function startCountdown() {
    setError(null);
    setCount(COUNTDOWN_FROM);
    setPhase("countdown");
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setError(null);
      const bmp = await fileToBitmap(file);
      await finishShot(renderFramed(bmp, bmp.width, bmp.height, false));
      bmp.close();
    } catch (err) {
      console.error(err);
      setError("Couldn't read that photo. Try a different one.");
    }
  }

  function retake() {
    if (shot) URL.revokeObjectURL(shot.url);
    setShot(null);
    setPhase("live");
  }

  async function upload() {
    if (!shot) return;
    setPhase("uploading");
    setError(null);
    try {
      save("guest-name", name.trim());
      await uploadPhoto({ code, name, full: shot.full, thumb: shot.thumb });
      setTaken((n) => n + 1);
      setPhase("done");
      setTimeout(() => {
        URL.revokeObjectURL(shot.url);
        setShot(null);
        setPhase("live");
      }, 1600);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(
        msg === "Wrong party code"
          ? "Wrong party code. Scan the QR code at the party again."
          : `${msg}. Check your connection and try again.`,
      );
      setPhase("preview");
    }
  }

  const showingShot = phase === "preview" || phase === "uploading" || phase === "done";

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-[#140b1f] text-white">
      {/* Top bar */}
      <header className="z-20 flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
        <h1 className="flex-1 truncate text-lg font-bold">
          📸 {partyTitle}
        </h1>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="w-32 rounded-full bg-white/10 px-3 py-1.5 text-sm placeholder:text-white/50 focus:bg-white/20 focus:outline-none"
        />
      </header>

      {/* Camera / preview */}
      <section className="relative mx-4 flex-1 overflow-hidden rounded-3xl bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`h-full w-full object-cover ${facing === "user" ? "-scale-x-100" : ""} ${showingShot ? "invisible" : ""}`}
        />

        {!camReady && !camError && !showingShot && (
          <div className="absolute inset-0 grid place-items-center text-white/60">
            Starting camera…
          </div>
        )}

        {camError && !showingShot && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div className="space-y-4">
              <p className="text-white/80">{camError}</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full bg-pink-500 px-6 py-3 font-semibold"
              >
                Take or choose a photo
              </button>
            </div>
          </div>
        )}

        {phase === "countdown" && count > 0 && (
          <div
            key={count}
            className="pointer-events-none absolute inset-0 grid place-items-center text-[10rem] font-black drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] animate-[pop_1s_ease-out]"
          >
            {count}
          </div>
        )}

        {showingShot && shot && (
          <div className="absolute inset-0 grid place-items-center bg-[#140b1f] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={shot.url}
              alt="Your photo"
              className="max-h-full max-w-full rounded-lg shadow-2xl animate-[drop_0.4s_ease-out]"
            />
          </div>
        )}

        {phase === "done" && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-3xl font-bold animate-[fade_0.2s]">
            Uploaded! 🎉
          </div>
        )}

        {flash && (
          <div className="pointer-events-none absolute inset-0 bg-white animate-[flash_0.35s_ease-out_forwards]" />
        )}
      </section>

      {error && (
        <p className="mx-4 mt-3 rounded-xl bg-red-500/20 px-4 py-2 text-center text-sm text-red-100">
          {error}
        </p>
      )}

      {/* Controls */}
      <footer className="z-20 flex items-center justify-between px-8 pt-5 pb-[max(env(safe-area-inset-bottom),20px)]">
        {showingShot ? (
          <>
            <button
              onClick={retake}
              disabled={phase !== "preview"}
              className="rounded-full bg-white/10 px-6 py-3 font-semibold disabled:opacity-40"
            >
              Retake
            </button>
            <button
              onClick={upload}
              disabled={phase !== "preview"}
              className="rounded-full bg-pink-500 px-8 py-3 font-bold shadow-lg shadow-pink-500/30 disabled:opacity-60"
            >
              {phase === "uploading" ? "Uploading…" : "Upload"}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="grid size-12 place-items-center rounded-full bg-white/10 text-xl"
              aria-label="Choose a photo from your library"
              title="Choose from library"
            >
              🖼️
            </button>
            <button
              onClick={startCountdown}
              disabled={!camReady || phase === "countdown"}
              aria-label="Take photo"
              className="size-20 rounded-full border-4 border-white bg-pink-500 shadow-lg shadow-pink-500/40 transition active:scale-90 disabled:opacity-40"
            />
            <button
              onClick={() =>
                setFacing((f) => (f === "user" ? "environment" : "user"))
              }
              disabled={phase === "countdown"}
              className="grid size-12 place-items-center rounded-full bg-white/10 text-xl"
              aria-label="Flip camera"
              title="Flip camera"
            >
              🔄
            </button>
          </>
        )}
      </footer>

      <Link
        href="/gallery"
        className="mx-auto mb-[max(env(safe-area-inset-bottom),12px)] -mt-2 text-sm text-white/60 underline-offset-4 hover:underline"
      >
        See everyone&apos;s photos{taken > 0 ? ` · you've added ${taken}` : ""} →
      </Link>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPickFile}
        className="hidden"
      />
    </main>
  );
}
