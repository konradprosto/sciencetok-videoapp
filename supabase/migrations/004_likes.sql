create table likes (
  user_id uuid references profiles(id) on delete cascade,
  video_id uuid references videos(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, video_id)
);

create index idx_likes_video on likes(video_id);

-- RLS
alter table likes enable row level security;

create policy "Read likes" on likes
  for select using (true);

create policy "Insert like" on likes
  for insert with check (auth.uid() = user_id);

create policy "Delete own like" on likes
  for delete using (auth.uid() = user_id);

-- Auto-update like_count on videos
create or replace function update_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update videos set like_count = like_count + 1 where id = NEW.video_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update videos set like_count = like_count - 1 where id = OLD.video_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on likes
  for each row execute function update_like_count();
