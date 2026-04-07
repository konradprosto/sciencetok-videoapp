alter table comments
  add column if not exists like_count int default 0;

create table if not exists comment_likes (
  user_id uuid references profiles(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, comment_id)
);

create index if not exists idx_comment_likes_comment on comment_likes(comment_id);

alter table comment_likes enable row level security;

create policy "Read comment likes" on comment_likes
  for select using (true);

create policy "Insert own comment like" on comment_likes
  for insert with check (auth.uid() = user_id);

create policy "Delete own comment like" on comment_likes
  for delete using (auth.uid() = user_id);

create or replace function update_comment_like_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update comments set like_count = like_count + 1 where id = NEW.comment_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update comments set like_count = greatest(like_count - 1, 0) where id = OLD.comment_id;
    return OLD;
  end if;
end;
$$ language plpgsql security definer;

drop trigger if exists on_comment_like_change on comment_likes;

create trigger on_comment_like_change
  after insert or delete on comment_likes
  for each row execute function update_comment_like_count();

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('comment_reply', 'comment_like')),
  comment_id uuid references comments(id) on delete cascade not null,
  video_id uuid references videos(id) on delete cascade not null,
  read_at timestamptz,
  created_at timestamptz default now(),
  unique (actor_id, type, comment_id)
);

create index if not exists idx_notifications_recipient_created
  on notifications(recipient_id, created_at desc);

create index if not exists idx_notifications_recipient_unread
  on notifications(recipient_id, read_at, created_at desc);

alter table notifications enable row level security;

create policy "Read own notifications" on notifications
  for select using (auth.uid() = recipient_id);

create policy "Insert own notifications" on notifications
  for insert with check (auth.uid() = actor_id);

create policy "Update own notifications" on notifications
  for update using (auth.uid() = recipient_id);
