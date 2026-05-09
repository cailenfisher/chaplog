-- =============================================================================
-- ChapLog — Development Seed Data
-- =============================================================================
-- Run automatically by `supabase db reset`.
-- Creates one caretaker, one VIP, links them, and seeds the default task list.
--
-- Credentials (local dev only):
--   Caretaker  caretaker@chaplog.local / password123
--   VIP        vip@chaplog.local       / password123
-- =============================================================================

-- We insert directly into auth.users and bypass the trigger by also inserting
-- into profiles manually, so we can control the UUIDs.

do $$
declare
  caretaker_id uuid := '00000000-0000-0000-0000-000000000001';
  vip_id       uuid := '00000000-0000-0000-0000-000000000002';
begin

  -- ── Auth users ─────────────────────────────────────────────────────────────
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at
  ) values
  (
    caretaker_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'caretaker@chaplog.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"role":"caretaker","display_name":"Dev Caretaker"}'::jsonb,
    now(), now()
  ),
  (
    vip_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'vip@chaplog.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"role":"vip","display_name":"Alex"}'::jsonb,
    now(), now()
  )
  on conflict (id) do nothing;

  -- ── Profiles ───────────────────────────────────────────────────────────────
  insert into public.profiles (id, role, display_name) values
    (caretaker_id, 'caretaker', 'Dev Caretaker'),
    (vip_id,       'vip',       'Alex')
  on conflict (id) do nothing;

  -- ── Caretaker ↔ VIP link ───────────────────────────────────────────────────
  insert into public.caretaker_vip (caretaker_id, vip_id)
  values (caretaker_id, vip_id)
  on conflict do nothing;

  -- ── Default tasks (mirrors src/lib/tasks.ts mock data) ────────────────────
  insert into public.tasks (
    vip_id, created_by, name, icon, importance,
    gradient_from, gradient_to, encouragements, sort_order
  ) values
  (
    vip_id, caretaker_id,
    'Morning Meds', '💊', 3,
    '#3730a3', '#6366f1',
    array[
      'Great job taking your morning meds! 🌟',
      'You''re so responsible! Keep it up! ✨',
      'Amazing! Your health matters so much! 💜'
    ],
    10
  ),
  (
    vip_id, caretaker_id,
    'Evening Meds', '🌙', 3,
    '#4c1d95', '#7c3aed',
    array[
      'Wonderful! Evening meds are all done! 🌙',
      'You did it! Have a peaceful night! 💫',
      'You''re a superstar! All done! 🎉'
    ],
    20
  ),
  (
    vip_id, caretaker_id,
    'Eat Dinner', '🍽️', 2,
    '#78350f', '#d97706',
    array[
      'Wonderful! Dinner is done! 🍽️✨',
      'Great job eating! You''re doing amazing! 🌟',
      'Nourishing your body — good job! 💛'
    ],
    30
  ),
  (
    vip_id, caretaker_id,
    'Wash Hands', '🧼', 1,
    '#164e63', '#0891b2',
    array[
      'Squeaky clean! Amazing job! 🧼✨',
      'Clean hands, happy day! 💧',
      'So healthy! You did great! 🌊'
    ],
    40
  ),
  (
    vip_id, caretaker_id,
    'Get Sunlight', '☀️', 1,
    '#7c2d12', '#ea580c',
    array[
      'Sunshine superstar! ☀️✨',
      'Fresh air and sunshine — you''re awesome! 🌿',
      'Vitamin D done! You rock! 🌞'
    ],
    50
  );

end $$;
