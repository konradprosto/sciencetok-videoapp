create table views (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id),
  session_id text,
  created_at timestamptz default now()
);

create index idx_views_video on views(video_id);
create index idx_views_dedup on views(video_id, session_id);

-- RLS
alter table views enable row level security;

create policy "Insert view" on views
  for insert with check (true);

create policy "Read own views" on views
  for select using (auth.uid() = user_id);
