-- =============================================================================
-- Allow caretakers to update their linked VIPs' profiles
-- (display_name and active_theme_id from the caretaker portal)
-- =============================================================================

create policy "profiles: caretaker updates their VIPs"
  on public.profiles for update
  using (public.is_caretaker_of(id))
  with check (public.is_caretaker_of(id));
