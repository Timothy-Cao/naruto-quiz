-- Per-question difficulty ratings, one per device.
--
-- Run this once in the Supabase SQL editor of the shared project (the same
-- one used for auth). Table is prefixed `naruto_quiz_` so it doesn't collide
-- with other apps sharing this Supabase project.
--
-- Public-write, public-read. Data is non-sensitive; device_id is an
-- anonymous UUID generated and stored in localStorage. Rating spam is
-- bounded by the PRIMARY KEY (one row per device per question — re-rates
-- update the existing row via upsert).

create table if not exists public.naruto_quiz_question_ratings (
  device_id   uuid       not null,
  quiz_slug   text       not null,
  question_id text       not null,
  rating      smallint   not null check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (device_id, quiz_slug, question_id)
);

create index if not exists idx_naruto_quiz_question_ratings_quiz
  on public.naruto_quiz_question_ratings (quiz_slug, question_id);

-- Touch updated_at on UPDATE.
create or replace function public.naruto_quiz_question_ratings_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists naruto_quiz_question_ratings_touch
  on public.naruto_quiz_question_ratings;

create trigger naruto_quiz_question_ratings_touch
  before update on public.naruto_quiz_question_ratings
  for each row execute function public.naruto_quiz_question_ratings_touch();

-- RLS
alter table public.naruto_quiz_question_ratings enable row level security;

-- Permissive policies. The PRIMARY KEY enforces dedupe; the loose write
-- policy is acceptable for a hobby site. Tighten to JWT-based ownership
-- if abuse appears.
drop policy if exists "naruto_quiz_ratings_read"   on public.naruto_quiz_question_ratings;
drop policy if exists "naruto_quiz_ratings_insert" on public.naruto_quiz_question_ratings;
drop policy if exists "naruto_quiz_ratings_update" on public.naruto_quiz_question_ratings;

create policy "naruto_quiz_ratings_read"
  on public.naruto_quiz_question_ratings for select using (true);

create policy "naruto_quiz_ratings_insert"
  on public.naruto_quiz_question_ratings for insert with check (true);

create policy "naruto_quiz_ratings_update"
  on public.naruto_quiz_question_ratings for update using (true) with check (true);
