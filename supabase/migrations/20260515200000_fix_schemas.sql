-- ═══════════════════════════════════════════════════════════════
-- Fix: schemas para notifications, projects e collaborators
-- ═══════════════════════════════════════════════════════════════

-- ── NOTIFICATIONS: adicionar colunas faltando ────────────────
alter table public.notifications
  add column if not exists type   text default 'system',
  add column if not exists status text default 'info',
  add column if not exists link   text;

-- ── PROJECTS: adicionar colunas faltando ─────────────────────
alter table public.projects
  add column if not exists description text,
  add column if not exists is_favorite boolean default false,
  add column if not exists tags        text[] default '{}',
  add column if not exists website_url text,
  add column if not exists updated_at  timestamptz default now();

-- ── PROJECT_COLLABORATORS ─────────────────────────────────────
create table if not exists public.project_collaborators (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references public.projects on delete cascade,
  owner_id            uuid references public.profiles on delete cascade,
  collaborator_id     uuid references public.profiles on delete set null,
  collaborator_email  text not null,
  role                text not null default 'viewer' check (role in ('viewer','editor','admin')),
  status              text not null default 'pending' check (status in ('pending','active','declined')),
  invited_at          timestamptz not null default now(),
  created_at          timestamptz not null default now()
);
alter table public.project_collaborators enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'project_collaborators' and policyname = 'Project owner manages collaborators') then
    create policy "Project owner manages collaborators"
      on public.project_collaborators for all
      using (auth.uid() = owner_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'project_collaborators' and policyname = 'Collaborators see own invites') then
    create policy "Collaborators see own invites"
      on public.project_collaborators for select
      using (collaborator_email = (select email from auth.users where id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where tablename = 'project_collaborators' and policyname = 'Collaborators update own status') then
    create policy "Collaborators update own status"
      on public.project_collaborators for update
      using (collaborator_email = (select email from auth.users where id = auth.uid()));
  end if;
end $$;

-- ── SUPPORT_TICKETS ──────────────────────────────────────────
create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles on delete cascade,
  subject    text not null,
  message    text not null,
  status     text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority   text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  category   text default 'general',
  response   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);
alter table public.support_tickets enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'support_tickets' and policyname = 'Users manage own tickets') then
    create policy "Users manage own tickets" on public.support_tickets for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'support_tickets' and policyname = 'Admin manages all tickets') then
    create policy "Admin manages all tickets" on public.support_tickets for all using (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    );
  end if;
end $$;
