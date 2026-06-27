-- SiteSafe — Row Level Security, helper functions and new-user trigger.

-- ── Helper functions (security definer) ──────────────────────────────────────
create or replace function public.current_role() returns user_role
  language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false)
$$;

create or replace function public.is_trainer() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('trainer','admin') from profiles where id = auth.uid()), false)
$$;

create or replace function public.my_org() returns uuid
  language sql stable security definer set search_path = public as $$
  select organisation_id from profiles where id = auth.uid()
$$;

-- ── New-user trigger: create a profile row on signup ─────────────────────────
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'delegate')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Enable RLS ───────────────────────────────────────────────────────────────
alter table organisations   enable row level security;
alter table profiles        enable row level security;
alter table scenarios       enable row level security;
alter table stages          enable row level security;
alter table decisions       enable row level security;
alter table game_sessions   enable row level security;
alter table session_choices enable row level security;
alter table cpp_drafts      enable row level security;

-- ── Profiles ─────────────────────────────────────────────────────────────────
create policy profiles_self_select on profiles for select
  using (id = auth.uid() or is_admin() or (is_trainer() and organisation_id = my_org()));
create policy profiles_self_update on profiles for update
  using (id = auth.uid() or is_admin());

-- ── Organisations ────────────────────────────────────────────────────────────
create policy orgs_select on organisations for select
  using (is_admin() or id = my_org());

-- ── Content (scenarios / stages / decisions) ────────────────────────────────
create policy scenarios_read on scenarios for select
  using (is_published or is_admin());
create policy scenarios_admin_write on scenarios for all
  using (is_admin()) with check (is_admin());

create policy stages_read on stages for select
  using (is_admin() or exists (select 1 from scenarios s where s.id = scenario_id and s.is_published));
create policy stages_admin_write on stages for all
  using (is_admin()) with check (is_admin());

create policy decisions_read on decisions for select
  using (is_admin() or exists (
    select 1 from stages st join scenarios s on s.id = st.scenario_id
    where st.id = stage_id and s.is_published));
create policy decisions_admin_write on decisions for all
  using (is_admin()) with check (is_admin());

-- ── Game sessions ────────────────────────────────────────────────────────────
create policy sessions_owner_all on game_sessions for all
  using (delegate_id = auth.uid())
  with check (delegate_id = auth.uid());
create policy sessions_trainer_read on game_sessions for select
  using (is_admin() or (is_trainer() and exists (
    select 1 from profiles p where p.id = delegate_id and p.organisation_id = my_org())));

-- ── Session choices ──────────────────────────────────────────────────────────
create policy choices_owner_all on session_choices for all
  using (exists (select 1 from game_sessions gs where gs.id = session_id and gs.delegate_id = auth.uid()))
  with check (exists (select 1 from game_sessions gs where gs.id = session_id and gs.delegate_id = auth.uid()));
create policy choices_trainer_read on session_choices for select
  using (is_admin() or (is_trainer() and exists (
    select 1 from game_sessions gs join profiles p on p.id = gs.delegate_id
    where gs.id = session_id and p.organisation_id = my_org())));

-- ── CPP drafts ───────────────────────────────────────────────────────────────
create policy cpp_owner_all on cpp_drafts for all
  using (exists (select 1 from game_sessions gs where gs.id = session_id and gs.delegate_id = auth.uid()))
  with check (exists (select 1 from game_sessions gs where gs.id = session_id and gs.delegate_id = auth.uid()));
create policy cpp_trainer_read on cpp_drafts for select
  using (is_admin() or (is_trainer() and exists (
    select 1 from game_sessions gs join profiles p on p.id = gs.delegate_id
    where gs.id = session_id and p.organisation_id = my_org())));
