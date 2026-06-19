-- HowInsight / 무기견의 옵션 입문 접근 승인용 Supabase schema
-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.access_requests (
  email text primary key,
  x_handle text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source_path text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists public.approved_users (
  email text primary key,
  x_handle text not null default '',
  active boolean not null default true,
  approved_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.course_session_visibility (
  slug text primary key,
  title text not null,
  href text not null,
  sort_order integer not null,
  visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.x_subscribers (
  x_handle text primary key,
  active boolean not null default true,
  imported_at timestamptz not null default now()
);

create table if not exists public.x_access_visits (
  id bigserial primary key,
  x_handle text not null,
  source_path text,
  allowed boolean not null default false,
  status text not null default 'pending',
  user_agent text,
  visited_at timestamptz not null default now()
);

alter table public.access_requests enable row level security;
alter table public.approved_users enable row level security;
alter table public.admin_users enable row level security;
alter table public.course_session_visibility enable row level security;
alter table public.x_subscribers enable row level security;
alter table public.x_access_visits enable row level security;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where email = public.current_user_email()
  );
$$;

-- 신청자는 로그인 전에도 pending 신청 정보만 남길 수 있어야 합니다.
drop policy if exists "Anyone can request access" on public.access_requests;
drop policy if exists "Anyone can create pending access request" on public.access_requests;
create policy "Anyone can create pending access request"
on public.access_requests
for insert
to anon, authenticated
with check (
  email = lower(trim(email))
  and length(email) >= 3
  and x_handle = trim(x_handle)
  and length(x_handle) >= 2
  and status = 'pending'
  and approved_at is null
);

drop policy if exists "Authenticated users can update own request" on public.access_requests;
drop policy if exists "Authenticated users can update pending own request metadata" on public.access_requests;
create policy "Authenticated users can update pending own request metadata"
on public.access_requests
for update
to authenticated
using (
  email = public.current_user_email()
  and status = 'pending'
  and approved_at is null
)
with check (
  email = public.current_user_email()
  and email = lower(trim(email))
  and length(email) >= 3
  and x_handle = trim(x_handle)
  and length(x_handle) >= 2
  and status = 'pending'
  and approved_at is null
);

-- 관리자는 신청 목록을 보고 상태를 바꿀 수 있습니다.
drop policy if exists "Admins can read requests" on public.access_requests;
create policy "Admins can read requests"
on public.access_requests
for select
to authenticated
using (public.is_admin() or email = public.current_user_email());

drop policy if exists "Admins can update requests" on public.access_requests;
create policy "Admins can update requests"
on public.access_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 승인 여부는 본인 또는 관리자만 조회합니다.
drop policy if exists "Users can read own approval" on public.approved_users;
create policy "Users can read own approval"
on public.approved_users
for select
to authenticated
using (public.is_admin() or email = public.current_user_email());

drop policy if exists "Admins can manage approvals" on public.approved_users;
create policy "Admins can manage approvals"
on public.approved_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- admin_users는 관리자만 조회합니다. 최초 관리자 등록은 아래 insert를 한 번 실행하세요.
drop policy if exists "Admins can read admins" on public.admin_users;
create policy "Admins can read admins"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- 목차와 회차 페이지가 공개 여부를 읽을 수 있어야 합니다.
drop policy if exists "Anyone can read course session visibility" on public.course_session_visibility;
create policy "Anyone can read course session visibility"
on public.course_session_visibility
for select
to anon, authenticated
using (true);

-- 관리자는 공개 회차 설정을 바꿀 수 있습니다.
drop policy if exists "Admins can manage course session visibility" on public.course_session_visibility;
create policy "Admins can manage course session visibility"
on public.course_session_visibility
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 관리자는 X 활성 구독자 명단을 조회하고 동기화할 수 있습니다.
drop policy if exists "Admins can manage x subscribers" on public.x_subscribers;
create policy "Admins can manage x subscribers"
on public.x_subscribers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 관리자는 X 아이디 기반 강의 진입 기록을 확인할 수 있습니다.
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

insert into public.course_session_visibility (slug, title, href, sort_order, visible)
values
  ('prologue', '당신은 왜 옵션을 배우고 싶어하는가?', 'prologue.html', 0, true),
  ('session-01', '옵션은 무엇을 사고파는 상품인가?', 'sessions/session-01.html', 1, true),
  ('session-02', '콜옵션과 풋옵션, 방향보다 먼저 권리로 이해하기', 'sessions/session-02.html', 2, true),
  ('session-03', '옵션 매수자와 매도자, 프리미엄을 둘러싼 권리와 의무', 'sessions/session-03.html', 3, true),
  ('session-04', '만기 손익그래프, 옵션은 그림으로 이해해야 한다', 'sessions/session-04.html', 4, true),
  ('session-05', '내가격, 등가격, 외가격', 'sessions/session-05.html', 5, true),
  ('session-06', '프리미엄의 두 층, 내재가치와 시간가치', 'sessions/session-06.html', 6, true),
  ('session-07', '시간가치, 만기가 길수록 왜 더 비싼가', 'sessions/session-07.html', 7, true),
  ('session-08', '변동성, 옵션 가격을 비싸게 만드는 흔들림의 가격', 'sessions/session-08.html', 8, true),
  ('session-09', '방향을 맞혀도 손실이 나는 이유', 'sessions/session-09.html', 9, true),
  ('session-10', '그릭스란 무엇인가', 'sessions/session-10.html', 10, true),
  ('session-11', '델타 1편, 방향성과 변화율', 'sessions/session-11.html', 11, true),
  ('session-12', '델타 2편, 확률과 헷지비율', 'sessions/session-12.html', 12, true),
  ('session-13', '감마, 델타의 변화율과 옵션의 비선형성', 'sessions/session-13.html', 13, true),
  ('session-14', '세타, 시간은 옵션가격을 어떻게 갉아먹는가', 'sessions/session-14.html', 14, true),
  ('session-15', '베가, 변동성의 가격', 'sessions/session-15.html', 15, true),
  ('session-16', '로, 금리와 배당은 옵션에 어떻게 반영되는가', 'sessions/session-16.html', 16, true),
  ('session-17', '옵션 매수의 본질, 감마를 사며 세타를 지불한다', 'sessions/session-17.html', 17, true),
  ('session-18', '옵션 매도의 본질, 세타를 받으며 감마 리스크를 진다', 'sessions/session-18.html', 18, true),
  ('session-19', '외가격 옵션의 유혹과 위험', 'sessions/session-19.html', 19, true),
  ('session-20', '내가격 옵션과 주식 대체 효과', 'sessions/session-20.html', 20, true),
  ('session-21', '커버드콜, 수익을 앞당겨 받는 대신 상승 일부를 넘긴다', 'sessions/session-21.html', 21, true),
  ('session-22', '보호적 풋, 포트폴리오 보험의 기본형', 'sessions/session-22.html', 22, true),
  ('session-23', '스프레드 전략, 한쪽 옵션으로 다른 리스크를 줄인다', 'sessions/session-23.html', 23, true),
  ('session-24', '스트래들, 스트랭글, 방향보다 큰 움직임을 사는 전략', 'sessions/session-24.html', 24, true),
  ('session-25', '전략 이름보다 포지션 그릭스를 보라', 'sessions/session-25.html', 25, true),
  ('session-26', '델타헷지, 방향 리스크를 지우는 동적 작업', 'sessions/session-26.html', 26, true),
  ('session-27', '감마와 동적헷징, 왜 큰 움직임이 헷지 수량을 바꾸는가', 'sessions/session-27.html', 27, true),
  ('session-28', '마켓메이커, 마켓감마, 감마 스퀴즈', 'sessions/session-28.html', 28, true),
  ('session-29', 'VIX, 스큐, 변동성 시장 읽기', 'sessions/session-29.html', 29, true),
  ('session-30', '개인투자자의 옵션 사용법과 체크리스트', 'sessions/session-30.html', 30, true),
  ('epilogue', '강의를 이해하고 나서의 투자방향', 'epilogue.html', 31, true)
on conflict (slug) do nothing;

-- TODO: 아래 이메일을 형의 관리자 이메일로 바꾼 뒤 한 번 실행하세요.
-- insert into public.admin_users (email) values ('your-email@example.com') on conflict (email) do nothing;
