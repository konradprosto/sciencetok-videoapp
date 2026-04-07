create table comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  parent_id uuid references comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index idx_comments_video on comments(video_id);
create index idx_comments_parent on comments(parent_id);

-- RLS
alter table comments enable row level security;

create policy "Read comments" on comments
  for select using (true);

create policy "Write comment" on comments
  for insert with check (auth.uid() = user_id);

create policy "Delete own comment" on comments
  for delete using (auth.uid() = user_id);
