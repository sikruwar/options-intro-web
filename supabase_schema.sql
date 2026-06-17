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

alter table public.access_requests enable row level security;
alter table public.approved_users enable row level security;
alter table public.admin_users enable row level security;

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

-- 신청자는 로그인 전에도 신청 정보를 남길 수 있어야 합니다.
drop policy if exists "Anyone can request access" on public.access_requests;
create policy "Anyone can request access"
on public.access_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can update own request" on public.access_requests;
create policy "Authenticated users can update own request"
on public.access_requests
for update
to authenticated
using (email = public.current_user_email())
with check (email = public.current_user_email());

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

-- TODO: 아래 이메일을 형의 관리자 이메일로 바꾼 뒤 한 번 실행하세요.
-- insert into public.admin_users (email) values ('your-email@example.com') on conflict (email) do nothing;
