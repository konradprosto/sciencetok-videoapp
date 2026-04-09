create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null not null,
  reporter_email text not null,
  reporter_username text,
  message text not null,
  page_path text,
  screenshot_path text,
  user_agent text,
  status text not null default 'open' check (status in ('open', 'in_review', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bug_reports_status_created_at
  on bug_reports(status, created_at desc);

create index if not exists idx_bug_reports_reporter_created_at
  on bug_reports(reporter_id, created_at desc);

create or replace function set_bug_reports_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists bug_reports_set_updated_at on bug_reports;

create trigger bug_reports_set_updated_at
  before update on bug_reports
  for each row execute function set_bug_reports_updated_at();

alter table bug_reports enable row level security;

create policy "Insert own bug reports" on bug_reports
  for insert with check (auth.uid() = reporter_id);

create policy "Read own bug reports" on bug_reports
  for select using (auth.uid() = reporter_id);

insert into storage.buckets (id, name, public)
values ('bug-reports', 'bug-reports', false)
on conflict (id) do nothing;
