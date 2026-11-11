"use client";

import { QRCodeSVG } from "qrcode.react";
import { useJoinUrl } from "@/lib/joinUrl";
import { partyTitle } from "@/lib/supabase";

/** Printable sign. Open /qr?code=YOURCODE and print (Cmd+P). */
export default function QrPage() {
  const joinUrl = useJoinUrl();

  return (
    <main className="grid min-h-dvh place-items-center bg-white p-8 text-center text-[#2b1d3a] print:p-0">
      <div className="max-w-md">
        <p className="text-5xl">📸</p>
        <h1 className="mt-4 text-4xl font-black">{partyTitle}</h1>
        <p className="mt-2 text-xl">
          Scan to open the photobooth.
          <br />
          Every photo goes into the party album.
        </p>
        <div className="mx-auto mt-8 w-fit rounded-3xl border-4 border-[#2b1d3a] p-5">
          {joinUrl ? (
            <QRCodeSVG value={joinUrl} size={280} />
          ) : (
            <div className="size-[280px]" />
          )}
        </div>
        <p className="mt-4 break-all font-mono text-sm text-[#8a7a99]">
          {joinUrl}
        </p>
        <p className="mt-6 text-sm text-[#8a7a99] print:hidden">
          Print this page (⌘P) and put it on the tables.
        </p>
      </div>
    </main>
  );
}
