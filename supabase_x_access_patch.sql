-- X 아이디 기반 강의 접근 확인/기록 패치
-- Supabase SQL Editor에서 한 번 실행한 뒤 assets/auth-config.js의 xHandleGateEnabled를 true로 바꾸세요.

create table if not exists public.x_access_visits (
  id bigserial primary key,
  x_handle text not null,
  source_path text,
  allowed boolean not null default false,
  status text not null default 'pending',
  user_agent text,
  visited_at timestamptz not null default now()
);

alter table public.x_access_visits enable row level security;

drop policy if exists "Admins can read x access visits" on public.x_access_visits;
create policy "Admins can read x access visits"
on public.x_access_visits
for select
to authenticated
using (public.is_admin());

create or replace function public.normalize_x_handle(raw_handle text)
returns text
language sql
immutable
as $$
  select case
    when length(trim(coalesce(raw_handle, ''))) = 0 then ''
    when left(trim(coalesce(raw_handle, '')), 1) = '@' then lower(trim(coalesce(raw_handle, '')))
    else '@' || lower(trim(coalesce(raw_handle, '')))
  end;
$$;

create or replace function public.x_handle_synthetic_email(handle text)
returns text
language sql
immutable
as $$
  select regexp_replace(replace(public.normalize_x_handle(handle), '@', ''), '[^a-z0-9_]', '', 'g') || '@x.howinsight.local';
$$;

create or replace function public.request_x_course_access(raw_x_handle text, source_path text default null, user_agent_text text default null)
returns table (
  allowed boolean,
  x_handle text,
  status text,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  handle text := public.normalize_x_handle(raw_x_handle);
  synthetic_email text := public.x_handle_synthetic_email(raw_x_handle);
  subscriber_active boolean := false;
  approved_active boolean := false;
  request_status text := 'pending';
begin
  if handle = '' or length(handle) < 2 then
    return query select false, handle, 'invalid'::text, 'X 아이디를 입력해주세요.'::text;
    return;
  end if;

  select exists (
    select 1 from public.x_subscribers
    where lower(x_handle) = handle and active = true
  ) into subscriber_active;

  select exists (
    select 1 from public.approved_users
    where lower(x_handle) = handle and active = true
  ) into approved_active;

  if subscriber_active or approved_active then
    request_status := 'approved';
  end if;

  insert into public.access_requests (email, x_handle, status, source_path, requested_at, approved_at)
  values (
    synthetic_email,
    handle,
    request_status,
    source_path,
    now(),
    case when request_status = 'approved' then now() else null end
  )
  on conflict (email) do update
  set
    x_handle = excluded.x_handle,
    status = case
      when public.access_requests.status = 'approved' then 'approved'
      when excluded.status = 'approved' then 'approved'
      else public.access_requests.status
    end,
    source_path = excluded.source_path,
    requested_at = now(),
    approved_at = case
      when public.access_requests.status = 'approved' or excluded.status = 'approved'
      then coalesce(public.access_requests.approved_at, now())
      else public.access_requests.approved_at
    end;

  if request_status = 'approved' then
    insert into public.approved_users (email, x_handle, active, approved_at)
    values (synthetic_email, handle, true, now())
    on conflict (email) do update
    set x_handle = excluded.x_handle, active = true, approved_at = coalesce(public.approved_users.approved_at, now());
  end if;

  insert into public.x_access_visits (x_handle, source_path, allowed, status, user_agent)
  values (handle, source_path, request_status = 'approved', request_status, left(coalesce(user_agent_text, ''), 500));

  if request_status = 'approved' then
    return query select true, handle, request_status, '승인된 X 아이디입니다.'::text;
  else
    return query select false, handle, request_status, '승인 대기 상태입니다. 관리자가 X 아이디를 확인한 뒤 접근 권한을 열 수 있습니다.'::text;
  end if;
end;
$$;

grant execute on function public.request_x_course_access(text, text, text) to anon, authenticated;
