-- Testimonials table
create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete set null,
  rating       integer not null check (rating between 1 and 5),
  message      text    not null,
  role         text,
  company      text,
  approved     boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.testimonials enable row level security;

-- Users can read approved testimonials
create policy "testimonials_select" on public.testimonials
  for select using (approved = true);

-- Users can insert their own testimonials
create policy "testimonials_insert" on public.testimonials
  for insert with check (auth.uid() = user_id);

-- Admins can do everything (via service role key in edge functions)
