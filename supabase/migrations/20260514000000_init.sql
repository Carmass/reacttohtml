-- ═══════════════════════════════════════════════════════════
-- React to HTML Compiler — Schema inicial
-- ═══════════════════════════════════════════════════════════

-- ── PROFILES ────────────────────────────────────────────────
create table public.profiles (
  id                    uuid primary key references auth.users on delete cascade,
  name                  text,
  role                  text not null default 'user' check (role in ('user', 'admin')),
  subscription_plan     text not null default 'Free',
  subscription_status   text not null default 'active',
  stripe_customer_id    text,
  daily_usage           int not null default 0,
  last_usage_date       date,
  daily_limit_override  int,
  credits               int not null default 0,
  referral_code         text unique,
  created_at            timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users see own profile"    on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin sees all"           on public.profiles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  ref_code text;
begin
  ref_code := lower(substring(gen_random_uuid()::text, 1, 8));
  insert into public.profiles (id, name, referral_code)
  values (new.id, new.raw_user_meta_data->>'name', ref_code);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- Function to increment usage atomically
create or replace function public.increment_daily_usage(uid uuid, today date)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set daily_usage    = case when last_usage_date = today then daily_usage + 1 else 1 end,
      last_usage_date = today
  where id = uid;
end;
$$;

-- ── PLANS ───────────────────────────────────────────────────
create table public.plans (
  id               uuid primary key default gen_random_uuid(),
  name             text not null unique,
  price            numeric not null default 0,
  daily_limit      int not null default 3,
  stripe_price_id  text,
  features         jsonb default '[]',
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy "Everyone reads plans" on public.plans for select using (is_active = true);
create policy "Admin manages plans" on public.plans for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Seed default plans
insert into public.plans (name, price, daily_limit, features) values
  ('Free',     0,  3,  '["3 compilações/dia","Download ZIP","Suporte comunidade"]'),
  ('Starter',  9,  10, '["10 compilações/dia","Projetos salvos","E-mail de notificação"]'),
  ('Pro',      29, 50, '["50 compilações/dia","Deploy automático","GitHub Pages","FTP/SFTP"]'),
  ('Business', 79, -1, '["Compilações ilimitadas","Deploy em lote","Suporte prioritário","API access"]');

-- ── BUILD HISTORY ────────────────────────────────────────────
create table public.build_history (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles on delete cascade,
  project_name       text not null,
  project_id         uuid,
  original_file_url  text,
  compiled_file_url  text,
  status             text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  file_size          bigint,
  error_message      text,
  github_run_id      text,
  build_duration     int,
  build_steps        jsonb,
  logs               text,
  app_id             text,
  ai_tool            text,
  created_at         timestamptz not null default now()
);
alter table public.build_history enable row level security;
create policy "Users see own builds" on public.build_history for select using (auth.uid() = user_id);
create policy "Users insert own builds" on public.build_history for insert with check (auth.uid() = user_id);
create policy "Users update own builds" on public.build_history for update using (auth.uid() = user_id);
create policy "Users delete own builds" on public.build_history for delete using (auth.uid() = user_id);
create policy "Admin sees all builds" on public.build_history for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── PROJECTS ────────────────────────────────────────────────
create table public.projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references public.profiles on delete cascade,
  name                 text not null,
  deploy_protocol      text default 'ftp' check (deploy_protocol in ('ftp','sftp','github')),
  ftp_host             text,
  ftp_port             int default 21,
  ftp_username         text,
  ftp_password         text,
  ftp_remote_path      text default '/public_html',
  auto_deploy          boolean default false,
  github_repo          text,
  github_token         text,
  github_pages_enabled boolean default false,
  deploy_branch        text default 'build-output',
  last_build_id        uuid references public.build_history,
  created_at           timestamptz not null default now()
);
alter table public.projects enable row level security;
create policy "Users manage own projects" on public.projects for all using (auth.uid() = user_id);

-- ── DEPLOYMENTS ──────────────────────────────────────────────
create table public.deployments (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid references public.projects on delete cascade,
  build_id         uuid references public.build_history,
  status           text not null default 'queued' check (status in ('queued','pushing','success','failed')),
  commit_sha       text,
  repository_url   text,
  commit_url       text,
  github_pages_url text,
  deployment_logs  jsonb default '[]',
  created_at       timestamptz not null default now()
);
alter table public.deployments enable row level security;
create policy "Users see own deployments" on public.deployments for select using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);
create policy "Users insert deployments" on public.deployments for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
);

-- ── NOTIFICATIONS ────────────────────────────────────────────
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles on delete cascade,
  title      text not null,
  message    text,
  icon       text default '🔔',
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications for update using (auth.uid() = user_id);
create policy "Service inserts notifications" on public.notifications for insert with check (true);

-- ── REFERRALS ────────────────────────────────────────────────
create table public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid references public.profiles,
  referred_id   uuid references public.profiles,
  status        text not null default 'pending' check (status in ('pending','valid','rewarded','invalid')),
  fraud_score   int not null default 0,
  fraud_reasons jsonb default '[]',
  created_at    timestamptz not null default now()
);
alter table public.referrals enable row level security;
create policy "Users see own referrals" on public.referrals for select using (
  auth.uid() = referrer_id or auth.uid() = referred_id
);
create policy "Admin manages referrals" on public.referrals for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── ADMIN SETTINGS ───────────────────────────────────────────
create table public.admin_settings (
  id                  uuid primary key default gen_random_uuid(),
  form_webhook_url    text default '',
  maintenance_mode    boolean default false,
  max_file_size_mb    int default 50,
  updated_at          timestamptz default now()
);
alter table public.admin_settings enable row level security;
create policy "Admin manages settings" on public.admin_settings for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
-- Insert default
insert into public.admin_settings (id) values (gen_random_uuid());

-- ── BLOG: CATEGORIES ────────────────────────────────────────
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "Everyone reads categories" on public.categories for select using (true);
create policy "Admin manages categories" on public.categories for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── BLOG: TAGS ──────────────────────────────────────────────
create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
create policy "Everyone reads tags" on public.tags for select using (true);
create policy "Admin manages tags" on public.tags for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── BLOG: POSTS ─────────────────────────────────────────────
create table public.posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid references public.profiles,
  category_id    uuid references public.categories,
  title          text not null,
  slug           text not null unique,
  content        text,
  excerpt        text,
  cover_image    text,
  status         text not null default 'draft' check (status in ('draft','published','scheduled')),
  scheduled_date timestamptz,
  meta_title     text,
  meta_description text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "Everyone reads published posts" on public.posts for select using (status = 'published' or auth.uid() = author_id);
create policy "Author manages own posts" on public.posts for all using (auth.uid() = author_id);
create policy "Admin manages all posts" on public.posts for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── BLOG: COMMENTS ──────────────────────────────────────────
create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.posts on delete cascade,
  author_name  text not null,
  author_email text,
  content      text not null,
  approved     boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "Everyone reads approved comments" on public.comments for select using (approved = true);
create policy "Anyone can insert comments" on public.comments for insert with check (true);
create policy "Admin manages comments" on public.comments for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── BLOG: MEDIA ─────────────────────────────────────────────
create table public.media (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  url        text not null,
  mime_type  text,
  size       bigint,
  user_id    uuid references public.profiles,
  created_at timestamptz not null default now()
);
alter table public.media enable row level security;
create policy "Users manage own media" on public.media for all using (auth.uid() = user_id);
create policy "Admin manages all media" on public.media for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── NEWSLETTER SUBSCRIBERS ───────────────────────────────────
create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "Anyone subscribes" on public.newsletter_subscribers for insert with check (true);
create policy "Admin manages subscribers" on public.newsletter_subscribers for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── INVOICES ─────────────────────────────────────────────────
create table public.invoices (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references public.profiles,
  stripe_invoice_id  text,
  amount             numeric not null,
  currency           text default 'usd',
  status             text default 'paid',
  invoice_url        text,
  created_at         timestamptz not null default now()
);
alter table public.invoices enable row level security;
create policy "Users see own invoices" on public.invoices for select using (auth.uid() = user_id);
create policy "Admin manages invoices" on public.invoices for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ── STORAGE BUCKETS ──────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('builds', 'builds', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;

create policy "Auth users upload to builds" on storage.objects for insert with check (bucket_id = 'builds' and auth.role() = 'authenticated');
create policy "Auth users read own builds" on storage.objects for select using (bucket_id = 'builds' and auth.role() = 'authenticated');
create policy "Auth users upload media" on storage.objects for insert with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "Everyone reads media" on storage.objects for select using (bucket_id = 'media');

-- ── PG_CRON (automações) ─────────────────────────────────────
-- Habilite a extensão pg_cron no Supabase Dashboard → Database → Extensions → pg_cron
-- Depois execute:
-- select cron.schedule('recover-stuck-builds',  '*/15 * * * *', $$select net.http_post(current_setting('app.supabase_url')||'/functions/v1/recover-stuck-builds','{}','application/json',array['Authorization: Bearer '||current_setting('app.service_role_key')])$$);
-- select cron.schedule('process-deployments',   '*/15 * * * *', $$select net.http_post(current_setting('app.supabase_url')||'/functions/v1/process-deployments','{}','application/json',array['Authorization: Bearer '||current_setting('app.service_role_key')])$$);
-- select cron.schedule('publish-scheduled-posts','*/15 * * * *', $$select net.http_post(current_setting('app.supabase_url')||'/functions/v1/publish-scheduled-posts','{}','application/json',array['Authorization: Bearer '||current_setting('app.service_role_key')])$$);
