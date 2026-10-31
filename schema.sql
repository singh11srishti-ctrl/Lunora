-- Run this once in Supabase: SQL Editor > New query > paste > Run
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text, age int, status text, diet text, level text, goals text[] default '{}'
);
create table logs (
  user_id uuid references auth.users on delete cascade,
  day date, mood int, skin int, sleep numeric, water int, weight numeric,
  period boolean default false, sugar boolean default false,
  primary key (user_id, day)
);
create table plan_progress (
  user_id uuid references auth.users on delete cascade,
  day date, done text[] default '{}',
  primary key (user_id, day)
);
alter table profiles enable row level security;
alter table logs enable row level security;
alter table plan_progress enable row level security;
create policy "own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own logs" on logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own plan" on plan_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
