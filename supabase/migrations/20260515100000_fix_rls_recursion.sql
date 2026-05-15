-- Fix: infinite recursion in profiles RLS policies.
-- Admin policies were doing: SELECT from profiles INSIDE a policy ON profiles → recursion.
-- Solution: SECURITY DEFINER function bypasses RLS when checking admin role.

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── profiles ──────────────────────────────────────────────────────────────
drop policy if exists "Admin sees all" on public.profiles;
create policy "Admin sees all" on public.profiles for all using (public.is_admin());

-- ── plans ─────────────────────────────────────────────────────────────────
drop policy if exists "Admin manages plans" on public.plans;
create policy "Admin manages plans" on public.plans for all using (public.is_admin());

-- ── build_history ──────────────────────────────────────────────────────────
drop policy if exists "Admin sees all builds" on public.build_history;
create policy "Admin sees all builds" on public.build_history for all using (public.is_admin());

-- Regular users: missing SELECT / INSERT / UPDATE policies
drop policy if exists "Users see own builds" on public.build_history;
create policy "Users see own builds" on public.build_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own builds" on public.build_history;
create policy "Users insert own builds" on public.build_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own builds" on public.build_history;
create policy "Users update own builds" on public.build_history for update
  using (auth.uid() = user_id);

-- ── projects ───────────────────────────────────────────────────────────────
drop policy if exists "Admin manages projects" on public.projects;
create policy "Admin manages projects" on public.projects for all using (public.is_admin());

-- ── referrals ──────────────────────────────────────────────────────────────
drop policy if exists "Admin manages referrals" on public.referrals;
create policy "Admin manages referrals" on public.referrals for all using (public.is_admin());

-- ── admin_settings ─────────────────────────────────────────────────────────
drop policy if exists "Admin manages settings" on public.admin_settings;
create policy "Admin manages settings" on public.admin_settings for all using (public.is_admin());

-- ── categories ─────────────────────────────────────────────────────────────
drop policy if exists "Admin manages categories" on public.categories;
create policy "Admin manages categories" on public.categories for all using (public.is_admin());

-- ── tags ───────────────────────────────────────────────────────────────────
drop policy if exists "Admin manages tags" on public.tags;
create policy "Admin manages tags" on public.tags for all using (public.is_admin());

-- ── posts ──────────────────────────────────────────────────────────────────
drop policy if exists "Admin manages all posts" on public.posts;
create policy "Admin manages all posts" on public.posts for all using (public.is_admin());

-- ── comments ───────────────────────────────────────────────────────────────
drop policy if exists "Admin manages comments" on public.comments;
create policy "Admin manages comments" on public.comments for all using (public.is_admin());

-- ── media ──────────────────────────────────────────────────────────────────
drop policy if exists "Admin manages all media" on public.media;
create policy "Admin manages all media" on public.media for all using (public.is_admin());

-- ── newsletter_subscribers ─────────────────────────────────────────────────
drop policy if exists "Admin manages subscribers" on public.newsletter_subscribers;
create policy "Admin manages subscribers" on public.newsletter_subscribers for all using (public.is_admin());

-- ── invoices ───────────────────────────────────────────────────────────────
drop policy if exists "Admin manages invoices" on public.invoices;
create policy "Admin manages invoices" on public.invoices for all using (public.is_admin());
