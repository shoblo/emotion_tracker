-- Daily Check-in: initial schema
-- Run in Supabase SQL Editor (or via `supabase db push`).
-- Design: one family, 1-2 parents (read/write) + teachers (read-only, English fields only).

------------------------------------------------------------
-- 1. profiles (role per login)
------------------------------------------------------------
create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role         text not null default 'teacher' check (role in ('parent', 'teacher')),
  display_name text,
  created_at   timestamptz not null default now()
);

-- Role helpers. SECURITY DEFINER so policies can call them without recursing into profiles RLS.
create or replace function public.is_parent()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'parent');
$$;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and role = 'teacher');
$$;

-- New login -> profile. Least privilege: everyone is a teacher, EXCEPT the very first
-- account ever created, which becomes the parent. Promote a second parent manually (see README).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role, display_name)
  values (
    new.id,
    case when exists (select 1 from public.profiles) then 'teacher' else 'parent' end,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- 2. settings (single row)
------------------------------------------------------------
create table public.settings (
  id             boolean primary key default true check (id),   -- forces a single row
  child_nickname text not null default 'Child',
  updated_at     timestamptz not null default now()
);
insert into public.settings (id) values (true);

------------------------------------------------------------
-- 3. daily_entries
------------------------------------------------------------
create table public.daily_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id),
  entry_date          date not null unique,
  transcript_original text,                      -- parent only
  transcript_en       text,
  mood                text not null check (mood in ('green', 'yellow', 'red')),
  summary_en          text,
  picked_up_early     boolean not null default false,
  had_incident        boolean not null default false,
  had_meltdown        boolean not null default false,
  incident_details_en text,
  triggers            text[] not null default '{}',
  teacher_feedback_en text,
  mood_overridden     boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index daily_entries_date_idx on public.daily_entries (entry_date desc);

-- The colour rule lives in the database too, so it cannot be bypassed by a buggy client:
--   Red    = picked_up_early
--   Yellow = had_incident (a meltdown counts as an incident), not picked up
--   Green  = otherwise
-- Unless the parent manually overrode the colour (mood_overridden = true).
create or replace function public.apply_entry_rules()
returns trigger
language plpgsql
as $$
begin
  if new.had_meltdown then
    new.had_incident := true;
  end if;

  if not new.mood_overridden then
    new.mood := case
      when new.picked_up_early then 'red'
      when new.had_incident    then 'yellow'
      else 'green'
    end;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger daily_entries_rules
  before insert or update on public.daily_entries
  for each row execute function public.apply_entry_rules();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger settings_touch
  before update on public.settings
  for each row execute function public.touch_updated_at();

------------------------------------------------------------
-- 4. Row Level Security
------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.settings      enable row level security;
alter table public.daily_entries enable row level security;

-- profiles: everyone reads their own row; parents read and manage all
create policy profiles_select_own    on public.profiles for select to authenticated
  using (user_id = auth.uid() or public.is_parent());
create policy profiles_parent_update on public.profiles for update to authenticated
  using (public.is_parent()) with check (public.is_parent());

-- settings: parents and teachers read (it only holds the nickname); only parents write
create policy settings_select on public.settings for select to authenticated
  using (public.is_parent() or public.is_teacher());
create policy settings_update on public.settings for update to authenticated
  using (public.is_parent()) with check (public.is_parent());

-- daily_entries: parents only. Teachers have NO policy on the table, so they cannot
-- touch transcript_original; they read through the view below.
create policy entries_parent_select on public.daily_entries for select to authenticated
  using (public.is_parent());
create policy entries_parent_insert on public.daily_entries for insert to authenticated
  with check (public.is_parent());
create policy entries_parent_update on public.daily_entries for update to authenticated
  using (public.is_parent()) with check (public.is_parent());
create policy entries_parent_delete on public.daily_entries for delete to authenticated
  using (public.is_parent());

------------------------------------------------------------
-- 5. Teacher view (English fields only; no original transcript, no user_id)
------------------------------------------------------------
-- Runs with the view owner's rights (bypasses table RLS) and filters by role itself.
create or replace view public.teacher_entries as
select
  id,
  entry_date,
  mood,
  summary_en,
  transcript_en,
  picked_up_early,
  had_incident,
  had_meltdown,
  incident_details_en,
  triggers,
  teacher_feedback_en
from public.daily_entries
where public.is_parent() or public.is_teacher();

------------------------------------------------------------
-- 6. Grants: nothing for anonymous visitors
------------------------------------------------------------
revoke all on public.profiles, public.settings, public.daily_entries, public.teacher_entries from anon;
revoke all on public.teacher_entries from authenticated;
grant select on public.teacher_entries to authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.daily_entries to authenticated;

------------------------------------------------------------
-- 7. Keep-alive endpoint (called daily by Vercel Cron via PostgREST rpc)
------------------------------------------------------------
create or replace function public.ping()
returns timestamptz
language sql stable
as $$ select now(); $$;

grant execute on function public.ping() to anon, authenticated;
