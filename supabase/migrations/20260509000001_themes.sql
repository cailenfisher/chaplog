-- =============================================================================
-- ChapLog — Theme System
-- =============================================================================
--
-- Adds a `themes` catalogue table and links it to VIP profiles via
-- `active_theme_id`.  Caretakers set the theme for a VIP; the VIP tile
-- view reads it at load time.
--
-- =============================================================================


-- =============================================================================
-- themes catalogue
-- =============================================================================

create table public.themes (
  id          text primary key,
  name        text not null,
  description text
);

comment on table public.themes is
  'Available UI themes for the VIP task interface.';

-- Seed built-in themes
insert into public.themes (id, name, description) values
  ('friendly', 'Friendly',
   'Warm gradient tiles with emoji icons and a bounce celebration on completion.'),
  ('lcars',    'LCARS',
   'Star Trek TNG-style interface: flat amber panels, black background, stardate readout.');


-- =============================================================================
-- Link active theme to VIP profiles
-- =============================================================================

alter table public.profiles
  add column active_theme_id text
    not null
    default 'friendly'
    references public.themes (id);

comment on column public.profiles.active_theme_id is
  'The UI theme displayed on this VIP''s tablet interface.';


-- =============================================================================
-- RLS: themes table is read-only for everyone (catalogue data)
-- =============================================================================

alter table public.themes enable row level security;

-- Any authenticated user can read the themes catalogue
create policy "themes_select_all"
  on public.themes for select
  using (auth.role() = 'authenticated');

-- Only service-role (server / migrations) can insert / update / delete
-- (no policy needed — default-deny blocks anon & authenticated writes)
