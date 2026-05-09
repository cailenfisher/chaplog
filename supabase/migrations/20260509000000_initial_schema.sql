-- =============================================================================
-- ChapLog — Initial Schema
-- =============================================================================
--
-- Entities
-- ─────────────────────────────────────────────────────────────────────────────
--  profiles          One row per auth user.  role = 'caretaker' | 'vip'
--  caretaker_vip     Many-to-many: a caretaker may manage several VIPs
--  tasks             Recurring task definitions owned by (and displayed to) a VIP
--  task_completions  Immutable audit log — one row per task per calendar day
--
-- Design notes
-- ─────────────────────────────────────────────────────────────────────────────
--  • All tasks recur daily; future recurrence types can be added via a column.
--  • A unique constraint on (task_id, vip_id, completion_date) prevents
--    double-logging the same task on the same day.
--  • RLS is enforced on every table.  Two helper functions (my_role,
--    is_caretaker_of) avoid repeating subqueries across every policy.
--  • The caretaker_report view is a denormalised read model for reporting.
--  • Pass `role` and `display_name` in supabase.auth.signUp options.data
--    so the on_auth_user_created trigger can populate the profiles row.
--
-- =============================================================================


-- =============================================================================
-- Extensions
-- =============================================================================

create extension if not exists "uuid-ossp";


-- =============================================================================
-- Enums
-- =============================================================================

create type public.user_role as enum ('caretaker', 'vip');


-- =============================================================================
-- Tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- profiles — one row per auth.users row
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid             primary key references auth.users (id) on delete cascade,
  role         public.user_role not null,
  display_name text             not null,
  avatar_url   text,
  created_at   timestamptz      not null default now(),
  updated_at   timestamptz      not null default now()
);

comment on table  public.profiles              is 'App-level user data; extends auth.users via the same UUID.';
comment on column public.profiles.role         is '"caretaker" can CRUD tasks and read reports; "vip" sees the tile dashboard and logs completions.';
comment on column public.profiles.display_name is 'Friendly name shown on the dashboard and in caretaker reports.';


-- -----------------------------------------------------------------------------
-- caretaker_vip — caretaker ↔ VIP relationships
-- -----------------------------------------------------------------------------
create table public.caretaker_vip (
  id           uuid        primary key default gen_random_uuid(),
  caretaker_id uuid        not null references public.profiles (id) on delete cascade,
  vip_id       uuid        not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),

  unique (caretaker_id, vip_id)
);

comment on table public.caretaker_vip is 'Maps each caretaker to the VIP(s) they manage. One row per pair.';


-- -----------------------------------------------------------------------------
-- tasks — recurring task definitions
-- -----------------------------------------------------------------------------
create table public.tasks (
  id             uuid        primary key default gen_random_uuid(),
  vip_id         uuid        not null references public.profiles (id) on delete cascade,
  created_by     uuid        not null references public.profiles (id),
  name           text        not null,
  icon           text        not null default '✓',
  -- 1 = small tile (col×1 row×1)
  -- 2 = wide tile  (col×2 row×1)
  -- 3 = large tile (col×2 row×2) — highest priority
  importance     smallint    not null default 1 check (importance between 1 and 3),
  gradient_from  text        not null default '#3730a3',
  gradient_to    text        not null default '#6366f1',
  encouragements text[]      not null default '{}',
  is_active      boolean     not null default true,
  sort_order     integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table  public.tasks            is 'Recurring task definitions shown on the VIP tile dashboard.';
comment on column public.tasks.importance is '1–3 controls tile size; higher = more prominent on screen.';
comment on column public.tasks.sort_order is 'Ascending sort order within the grid (lower = earlier placement).';


-- -----------------------------------------------------------------------------
-- task_completions — completion audit log (caretaker report source)
-- -----------------------------------------------------------------------------
create table public.task_completions (
  id                  uuid        primary key default gen_random_uuid(),
  task_id             uuid        not null references public.tasks (id) on delete cascade,
  vip_id              uuid        not null references public.profiles (id) on delete cascade,
  -- Calendar date used for daily de-duplication and report grouping.
  -- Stored in database timezone; set explicitly if the app uses a local date.
  completion_date     date        not null default current_date,
  completed_at        timestamptz not null default now(),
  encouragement_shown text,
  -- Caretaker can add a note after the fact (e.g. "seemed tired today")
  notes               text,
  created_at          timestamptz not null default now(),

  -- One log entry per task per VIP per day
  unique (task_id, vip_id, completion_date)
);

comment on table  public.task_completions                  is 'Immutable log of every task completion; source of truth for caretaker reports.';
comment on column public.task_completions.completion_date  is 'Calendar date the task counts for. Used for daily de-duplication.';
comment on column public.task_completions.encouragement_shown is 'The specific encouragement message the VIP saw when they completed the task.';
comment on column public.task_completions.notes            is 'Optional caretaker annotation added after the fact; not visible to the VIP.';


-- =============================================================================
-- Views
-- =============================================================================

-- Denormalised read model for caretaker reports.
-- security_invoker = true means the view runs as the calling user,
-- so underlying RLS policies on task_completions, tasks, and profiles apply.
create view public.caretaker_report
  with (security_invoker = true) as
select
  tc.id,
  tc.completion_date,
  tc.completed_at,
  tc.encouragement_shown,
  tc.notes,
  t.name         as task_name,
  t.icon         as task_icon,
  t.importance   as task_importance,
  p.display_name as vip_name,
  p.id           as vip_id
from  public.task_completions tc
join  public.tasks             t  on t.id = tc.task_id
join  public.profiles          p  on p.id = tc.vip_id;

comment on view public.caretaker_report is
  'Denormalised completion log for caretaker reporting. Inherits RLS from base tables.';


-- =============================================================================
-- Functions & Triggers
-- =============================================================================

-- -----------------------------------------------------------------------------
-- set_updated_at — keep updated_at current on any row change
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- handle_new_user — create a profile row when a user signs up
--
-- Call supabase.auth.signUp with:
--   options: { data: { role: 'caretaker' | 'vip', display_name: '...' } }
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    coalesce(
      (new.raw_user_meta_data ->> 'role')::public.user_role,
      'vip'               -- default to vip if role is missing
    ),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- RLS helper functions
-- =============================================================================
-- These run as the definer (service role) to avoid infinite recursion and to
-- keep individual policy expressions short.

create or replace function public.my_role()
returns public.user_role
language sql stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_caretaker_of(target_vip_id uuid)
returns boolean
language sql stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from   public.caretaker_vip
    where  caretaker_id = auth.uid()
    and    vip_id       = target_vip_id
  );
$$;


-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.caretaker_vip    enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_completions enable row level security;


-- profiles ────────────────────────────────────────────────────────────────────

-- Every user can read and update their own profile.
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using     (id = auth.uid())
  with check (id = auth.uid());

-- Caretakers can read the profiles of their VIPs (for display in reports).
create policy "profiles: caretaker reads their VIPs"
  on public.profiles for select
  using (public.is_caretaker_of(id));


-- caretaker_vip ───────────────────────────────────────────────────────────────

create policy "caretaker_vip: caretaker reads own links"
  on public.caretaker_vip for select
  using (caretaker_id = auth.uid());

create policy "caretaker_vip: vip reads own links"
  on public.caretaker_vip for select
  using (vip_id = auth.uid());


-- tasks ───────────────────────────────────────────────────────────────────────

-- VIPs see only their own active tasks (the dashboard query).
create policy "tasks: vip reads own active tasks"
  on public.tasks for select
  using (vip_id = auth.uid() and is_active);

-- Caretakers can read all tasks (active or not) for their VIPs.
create policy "tasks: caretaker reads their VIPs tasks"
  on public.tasks for select
  using (public.is_caretaker_of(vip_id));

create policy "tasks: caretaker inserts for their VIPs"
  on public.tasks for insert
  with check (
    public.my_role()           = 'caretaker'
    and public.is_caretaker_of(vip_id)
    and created_by             = auth.uid()
  );

create policy "tasks: caretaker updates for their VIPs"
  on public.tasks for update
  using     (public.is_caretaker_of(vip_id))
  with check (public.is_caretaker_of(vip_id));

create policy "tasks: caretaker deletes for their VIPs"
  on public.tasks for delete
  using (public.is_caretaker_of(vip_id));


-- task_completions ────────────────────────────────────────────────────────────

-- VIPs log their own completions.
create policy "task_completions: vip inserts own"
  on public.task_completions for insert
  with check (
    vip_id           = auth.uid()
    and public.my_role() = 'vip'
  );

-- VIPs can read their own history (for today's completed state on page load).
create policy "task_completions: vip reads own"
  on public.task_completions for select
  using (vip_id = auth.uid());

-- Caretakers read the full log for their VIPs.
create policy "task_completions: caretaker reads their VIPs"
  on public.task_completions for select
  using (public.is_caretaker_of(vip_id));

-- Caretakers can add / edit the notes field only (no other columns).
-- The app must enforce that only `notes` is sent in the update payload.
create policy "task_completions: caretaker annotates notes"
  on public.task_completions for update
  using     (public.is_caretaker_of(vip_id))
  with check (public.is_caretaker_of(vip_id));


-- =============================================================================
-- Indexes
-- =============================================================================

-- VIP dashboard load: active tasks for a given VIP in display order
create index idx_tasks_vip_active
  on public.tasks (vip_id, sort_order)
  where is_active;

-- Caretaker report + today's completion check (most recent dates first)
create index idx_completions_vip_date
  on public.task_completions (vip_id, completion_date desc);

-- Per-task history (e.g. streak calculation)
create index idx_completions_task_date
  on public.task_completions (task_id, completion_date desc);

-- Relationship lookups (finding a caretaker's VIPs, or a VIP's caretakers)
create index idx_caretaker_vip_vip
  on public.caretaker_vip (vip_id);
