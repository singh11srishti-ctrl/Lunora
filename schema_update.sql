-- Run AFTER schema.sql (SQL Editor > New query > paste > Run)
create table cycle_settings (
  user_id uuid primary key references auth.users on delete cascade,
  last_start date, cycle_len int default 28, period_len int default 5
);
alter table cycle_settings enable row level security;
create policy "own cycle" on cycle_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  topic text not null, body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz default now()
);
create table post_likes (
  post_id uuid references posts on delete cascade, user_id uuid default auth.uid() references auth.users on delete cascade,
  primary key (post_id, user_id)
);
create table reports (
  id bigserial primary key, post_id uuid references posts on delete cascade, user_id uuid default auth.uid() references auth.users on delete cascade
);
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table reports enable row level security;
-- People can only touch their own rows. Everyone reads the feed through the view below, which hides user_id.
create policy "own posts" on posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own likes" on post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own reports" on reports for insert with check (auth.uid() = user_id);
create view feed as
  select p.id, p.topic, p.body, p.created_at, (p.user_id = auth.uid()) as mine,
    (select count(*) from post_likes l where l.post_id = p.id) as likes,
    exists (select 1 from post_likes l where l.post_id = p.id and l.user_id = auth.uid()) as liked
  from posts p;
grant select on feed to authenticated;
