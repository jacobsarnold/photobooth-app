-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- 1. Table that tracks every uploaded photo
create table if not exists public.photos (
  id          uuid primary key,
  path        text not null,          -- full-size image path in the bucket
  thumb_path  text not null,          -- small thumbnail path in the bucket
  name        text,                   -- optional "taken by"
  created_at  timestamptz not null default now()
);

create index if not exists photos_created_at_idx on public.photos (created_at desc);

-- 2. Row level security: anyone can READ, nobody can write with the anon key.
--    Writes happen only from the Next.js API route using the service role key.
alter table public.photos enable row level security;

drop policy if exists "Anyone can view photos" on public.photos;
create policy "Anyone can view photos"
  on public.photos for select
  to anon, authenticated
  using (true);

-- 3. Realtime, so the gallery and slideshow update live
alter publication supabase_realtime add table public.photos;

-- 4. Storage bucket: public read, 5 MB limit, JPEG only.
--    Uploads go through signed upload URLs created by the server,
--    so no anon insert policy is needed on storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
