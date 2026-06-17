# HowInsight 접근 승인 설정

현재 구현은 GitHub Pages 정적 사이트를 유지하면서 Supabase Auth와 관리자 승인을 붙이는 방식입니다.

## 1. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 만듭니다.
2. Project Settings → API에서 다음 값을 복사합니다.
   - Project URL
   - anon public key
3. `assets/auth-config.js`에 붙여 넣습니다.

```js
supabaseUrl: 'https://xxxx.supabase.co',
supabaseAnonKey: 'eyJ...',
adminEmails: ['관리자이메일@example.com'],
```

## 2. 테이블과 RLS 생성

Supabase SQL Editor에서 `supabase_schema.sql` 전체를 실행합니다.

마지막 줄의 예시 insert를 관리자 이메일로 바꿔 한 번 실행합니다.

```sql
insert into public.admin_users (email)
values ('관리자이메일@example.com')
on conflict (email) do nothing;
```

## 3. Auth redirect URL 설정

Supabase Authentication → URL Configuration에서 다음을 설정합니다.

- Site URL: `https://howinsight.com`
- Redirect URLs:
  - `https://howinsight.com/*`
  - `http://localhost:*/*` 로컬 테스트용, 선택

## 4. 사용자 흐름

1. 사용자가 강의 페이지에 들어옵니다.
2. 이메일과 X 닉네임을 입력합니다.
3. 이메일 magic link를 눌러 로그인합니다.
4. 승인 전에는 대기 화면이 나옵니다.
5. 관리자는 `/admin.html`에서 신청자를 승인합니다.
6. 승인된 이메일은 강의 페이지를 볼 수 있습니다.

## 5. 현재 안전장치

`assets/auth-config.js`의 Supabase 값이 비어 있으면 사이트는 공개 상태로 동작합니다. 설정 전 배포로 강의가 갑자기 막히지 않게 하기 위한 장치입니다.

값을 채우고 배포하면 접근 제한이 활성화됩니다.
