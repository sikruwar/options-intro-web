window.HOWINSIGHT_AUTH_CONFIG = {
  // Supabase Project Settings > API에서 복사해 넣으면 접근 제한이 활성화됩니다.
  // 비워두면 현재처럼 공개 사이트로 동작합니다. 배포 후 Supabase 세팅 전 사이트가 막히지 않게 하기 위한 안전장치입니다.
  supabaseUrl: 'https://jrswfxwnsiuxiwmczzkc.supabase.co',
  supabaseAnonKey: 'sb_publishable_kAQeK3DeGd6xoMwc3-BCDw_JdUQatc6',

  // 로그인 후 돌아올 기본 주소입니다. 커스텀 도메인을 유지합니다.
  siteUrl: 'https://howinsight.com',

  // 관리자 페이지 접근을 허용할 이메일. Supabase SQL의 admin_users에도 같은 이메일을 넣어야 합니다.
  adminEmails: [
    'sniffshiba@gmail.com'
  ],

  // 이메일 magic link 게이트입니다. 현재 운영은 기기 이동이 쉬운 접근 코드 + X 아이디 방식입니다.
  accessGateEnabled: false,

  // X 아이디를 입력받아 Supabase의 활성 구독자/승인 목록과 대조합니다.
  // 매칭되면 입장시키고 관리자 페이지에 신청/진입 기록을 남깁니다.
  xHandleGateEnabled: true,
  xHandleStorageKey: 'howinsight-options-x-access-v1',

  // 구독자에게 안내한 접근 코드와 X 아이디를 함께 입력하면 보호 페이지 접근을 확인합니다.
  // 같은 브라우저에서는 localStorage에 통과 상태가 저장되어 다시 입력하지 않아도 됩니다.
  accessCodeGateEnabled: true,
  accessCodes: [
    'OPTION-OPEN-05',
    'OPTION-OPEN-25'
  ],
  accessCodeStorageKey: 'howinsight-options-access-v1',

  // 보호 대상 페이지. index.html과 admin.html은 별도 처리합니다.
  protectedPathPattern: /\/(prologue|epilogue)\.html$|\/sessions\/session-\d+\.html$/,

  // 현재 정적 배포본 기준으로 구독자에게 열어둘 마지막 회차입니다.
  // Supabase 공개 회차 테이블이 오래된 경우에도 이 숫자까지는 목차와 직접 링크에서 열립니다.
  publishedThroughSession: 25,

  // 사이트명/문구
  courseTitle: '무기견의 옵션 입문',
  brandLabel: '무기견 @sniffshiba'
};
