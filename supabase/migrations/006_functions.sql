-- Increment view count atomically
create or replace function increment_view_count(video_id_input uuid)
returns void as $$
begin
  update videos set view_count = view_count + 1 where id = video_id_input;
end;
$$ language plpgsql security definer;

-- Enable realtime for comments table
alter publication supabase_realtime add table comments;
