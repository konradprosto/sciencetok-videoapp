create table videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  mux_asset_id text unique,
  mux_upload_id text unique,
  mux_playback_id text,
  status text default 'processing' check (status in ('processing', 'ready', 'error')),
  duration float,
  thumbnail_url text,
  view_count int default 0,
  like_count int default 0,
  created_at timestamptz default now()
);

create index idx_videos_user on videos(user_id);
create index idx_videos_status on videos(status) where status = 'ready';
create index idx_videos_created on videos(created_at desc);

-- RLS
alter table videos enable row level security;

create policy "Public ready videos" on videos
  for select using (status = 'ready');

create policy "Own videos" on videos
  for select using (auth.uid() = user_id);

create policy "Insert video" on videos
  for insert with check (auth.uid() = user_id);

create policy "Update own video" on videos
  for update using (auth.uid() = user_id);

create policy "Delete own video" on videos
  for delete using (auth.uid() = user_id);

-- Service role can update any video (for webhooks)
create policy "Service update" on videos
  for update using (true)
  with check (true);
