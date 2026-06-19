# HowInsight 접근 승인 설정

현재 구현은 GitHub Pages 정적 사이트를 유지하면서 접근 코드와 X 아이디 승인 확인을 붙이는 방식입니다. 학습자는 이메일 인증 없이 접근 코드와 X 아이디를 입력합니다.

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
2. 접근 코드와 X 아이디를 입력합니다.
3. 접근 코드가 맞으면 X 아이디 신청/진입 기록이 Supabase에 남습니다.
4. X 아이디가 활성 구독자 명단 또는 승인 목록에 있으면 바로 강의가 열립니다.
5. 승인 전이면 대기 안내가 나오고, 관리자는 `/admin.html`에서 신청자를 확인해 승인합니다.
6. 승인된 X 아이디는 같은 브라우저에서 다시 입력하지 않아도 되며, 다른 기기에서는 접근 코드와 X 아이디를 다시 입력하면 됩니다.

## 5. 현재 활성화 상태와 안전장치

현재 `assets/auth-config.js`에는 HowInsight Supabase 프로젝트 URL, publishable anon key, 관리자 이메일이 들어가 있고 `accessGateEnabled: false`, `accessCodeGateEnabled: true`, `xHandleGateEnabled: true`로 설정되어 있습니다. 따라서 보호 대상 강의 페이지는 접근 코드와 X 아이디 확인 후 열립니다.

긴급하게 전체 공개로 되돌려야 하면 `accessCodeGateEnabled: false`, `xHandleGateEnabled: false`, `accessGateEnabled: false`로 바꾸고 다시 배포하면 됩니다. Supabase 값이 비어 있으면 X 아이디 승인 확인은 동작하지 않습니다.
