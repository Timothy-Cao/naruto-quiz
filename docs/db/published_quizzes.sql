-- User-published quizzes. Run once in the Supabase SQL editor of the shared
-- project. Non-sensitive (anyone can read), but writes are scoped to the
-- authenticated user's own rows via auth.email().
--
-- Non-admin "1 quiz per user" is enforced app-side, not by RLS — the schema
-- could allow many rows per publisher_email; the app prevents it.
-- Admin moderation: use Supabase dashboard SQL editor to delete rows directly.

create table if not exists public.naruto_quiz_published_quizzes (
  slug             text       primary key,
  publisher_email  text       not null,
  publisher_name   text,
  quiz_json        jsonb      not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_nqpq_publisher
  on public.naruto_quiz_published_quizzes (publisher_email);

create or replace function public.naruto_quiz_published_quizzes_touch()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists naruto_quiz_published_quizzes_touch
  on public.naruto_quiz_published_quizzes;

create trigger naruto_quiz_published_quizzes_touch
  before update on public.naruto_quiz_published_quizzes
  for each row execute function public.naruto_quiz_published_quizzes_touch();

alter table public.naruto_quiz_published_quizzes enable row level security;

drop policy if exists "nqpq_select"      on public.naruto_quiz_published_quizzes;
drop policy if exists "nqpq_insert_own"  on public.naruto_quiz_published_quizzes;
drop policy if exists "nqpq_update_own"  on public.naruto_quiz_published_quizzes;
drop policy if exists "nqpq_delete_own"  on public.naruto_quiz_published_quizzes;

-- Public read: anyone can see published quizzes (this is a quiz site).
create policy "nqpq_select"
  on public.naruto_quiz_published_quizzes for select using (true);

-- Authenticated users can insert/update/delete only rows where the
-- publisher_email matches their JWT email claim.
create policy "nqpq_insert_own"
  on public.naruto_quiz_published_quizzes for insert
  with check (auth.email() is not null and auth.email() = publisher_email);

create policy "nqpq_update_own"
  on public.naruto_quiz_published_quizzes for update
  using (auth.email() = publisher_email)
  with check (auth.email() = publisher_email);

create policy "nqpq_delete_own"
  on public.naruto_quiz_published_quizzes for delete
  using (auth.email() = publisher_email);
