# Party Photobooth

Guests scan a QR code, take a photo on their phone, and it shows up instantly in a shared gallery and on a TV slideshow.

**Stack:** Next.js 16 (App Router) on Vercel · Supabase Storage + Postgres + Realtime

| Page | What it's for |
|---|---|
| `/` | Camera: 3-2-1 countdown, polaroid frame, retake/upload. Falls back to the phone's native camera or library. |
| `/gallery` | Live grid of every photo, tap to view or download. |
| `/slideshow?code=…` | Fullscreen for a TV/laptop. Cycles photos, jumps to new ones, shows a join QR. Double-click for fullscreen. |
| `/qr?code=…` | Printable sign with the QR code. |

## Setup (~20 min)

### 1. Supabase
1. Create a project (or use an existing one).
2. **SQL Editor → New query →** paste [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the `photos` table, read-only RLS, Realtime, and the `photos` storage bucket (public, 5 MB, JPEG only).
3. **Project Settings → API**: copy the Project URL, the anon/publishable key, and the service_role/secret key.

### 2. Local
```bash
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```
Open http://localhost:3000. Desktop browsers allow the camera on localhost. Phones need HTTPS, so test phones on the Vercel URL.

### 3. Vercel
1. Push to GitHub and import the repo in Vercel.
2. Add **all five** env vars from `.env.example` (Settings → Environment Variables).
   `NEXT_PUBLIC_*` values are baked in at build time, so **redeploy after changing them**.
3. Open `https://YOUR-APP.vercel.app/qr?code=YOUR_PARTY_CODE` and print it.

## How uploads work
1. The phone draws the photo into a frame on a canvas and makes a ~1700px JPEG plus a 480px thumbnail.
2. `POST /api/upload-url` checks `PARTY_CODE` and returns two **signed upload URLs** (made with the service role key on the server).
3. The phone uploads straight to Supabase Storage, so the bytes never go through Vercel.
4. `POST /api/photos` checks the file exists and inserts the row. Realtime pushes it to every open gallery and slideshow.

The anon key can only **read** (RLS). All writes go through the API routes.

## Before the party
- **Open your Supabase project a day or two before.** Free projects pause after about a week of inactivity.
- Do a test run on **an iPhone and an Android** using the Vercel URL. Delete the test photos afterwards (Storage + `photos` table).
- Run the slideshow on a laptop plugged into the TV, with sleep turned off.

## Getting all the photos afterwards
Supabase dashboard → Storage → `photos` → `full/` to download them. Or use the CLI:
```bash
npx supabase login
npx supabase link --project-ref YOUR_REF
npx supabase storage cp -r ss:///photos/full ./party-photos --experimental
```

## Customizing
- Frame text: `NEXT_PUBLIC_PARTY_TITLE`. Frame style: `renderFramed()` in [`lib/image.ts`](lib/image.ts).
- Countdown length: `COUNTDOWN_FROM` in [`app/page.tsx`](app/page.tsx).
- Slideshow speed: `SECONDS_PER_PHOTO` in [`app/slideshow/page.tsx`](app/slideshow/page.tsx).
