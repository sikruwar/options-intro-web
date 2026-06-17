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

  // 최종 배포 전까지 접근 신청/승인 게이트를 잠시 비활성화합니다.
  // 다시 활성화할 때 true로 바꾸면 기존 Supabase 설정을 그대로 사용합니다.
  accessGateEnabled: false,

  // 보호 대상 페이지. index.html과 admin.html은 별도 처리합니다.
  protectedPathPattern: /\/(prologue|epilogue)\.html$|\/sessions\/session-\d+\.html$/,

  // 사이트명/문구
  courseTitle: '무기견의 옵션 입문',
  brandLabel: '무기견 @sniffshiba'
};
