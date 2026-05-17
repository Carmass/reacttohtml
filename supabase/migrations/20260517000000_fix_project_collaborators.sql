-- ═══════════════════════════════════════════════════════════════════
-- Fix: project_collaborators schema + projects campos extras
-- ═══════════════════════════════════════════════════════════════════

-- ── PROJECT_COLLABORATORS: renomear role → permission ──────────────
alter table public.project_collaborators
  rename column role to permission;

-- Recriar constraint com nome e valores corretos
alter table public.project_collaborators
  drop constraint if exists project_collaborators_role_check;
alter table public.project_collaborators
  add constraint project_collaborators_permission_check
  check (permission in ('view','download','full','viewer','editor','admin'));

-- Adicionar 'revoked' ao conjunto de status permitidos
alter table public.project_collaborators
  drop constraint if exists project_collaborators_status_check;
alter table public.project_collaborators
  add constraint project_collaborators_status_check
  check (status in ('pending','active','declined','revoked'));

-- Adicionar colunas usadas pelo front-end (CollaboratorsPanel.jsx)
alter table public.project_collaborators
  add column if not exists invite_token       text,
  add column if not exists owner_email        text,
  add column if not exists project_name       text,
  add column if not exists collaborator_name  text;

-- ── PROJECTS: colunas usadas em ProjectDetails.jsx ─────────────────
alter table public.projects
  add column if not exists hosting_provider  text,
  add column if not exists selected_ai_tool  text;
