(() => {
  const config = window.HOWINSIGHT_AUTH_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const DEFAULT_COURSE_SESSIONS = [
  {
    "slug": "prologue",
    "title": "당신은 왜 옵션을 배우고 싶어하는가?",
    "href": "prologue.html",
    "sort_order": 0
  },
  {
    "slug": "session-01",
    "title": "옵션은 무엇을 사고파는 상품인가?",
    "href": "sessions/session-01.html",
    "sort_order": 1
  },
  {
    "slug": "session-02",
    "title": "콜옵션과 풋옵션, 방향보다 먼저 권리로 이해하기",
    "href": "sessions/session-02.html",
    "sort_order": 2
  },
  {
    "slug": "session-03",
    "title": "옵션 매수자와 매도자, 프리미엄을 둘러싼 권리와 의무",
    "href": "sessions/session-03.html",
    "sort_order": 3
  },
  {
    "slug": "session-04",
    "title": "만기 손익그래프, 옵션은 그림으로 이해해야 한다",
    "href": "sessions/session-04.html",
    "sort_order": 4
  },
  {
    "slug": "session-05",
    "title": "내가격, 등가격, 외가격",
    "href": "sessions/session-05.html",
    "sort_order": 5
  },
  {
    "slug": "session-06",
    "title": "프리미엄의 두 층, 내재가치와 시간가치",
    "href": "sessions/session-06.html",
    "sort_order": 6
  },
  {
    "slug": "session-07",
    "title": "시간가치, 만기가 길수록 왜 더 비싼가",
    "href": "sessions/session-07.html",
    "sort_order": 7
  },
  {
    "slug": "session-08",
    "title": "변동성, 옵션 가격을 비싸게 만드는 흔들림의 가격",
    "href": "sessions/session-08.html",
    "sort_order": 8
  },
  {
    "slug": "session-09",
    "title": "방향을 맞혀도 손실이 나는 이유",
    "href": "sessions/session-09.html",
    "sort_order": 9
  },
  {
    "slug": "session-10",
    "title": "그릭스란 무엇인가",
    "href": "sessions/session-10.html",
    "sort_order": 10
  },
  {
    "slug": "session-11",
    "title": "델타 1편, 방향성과 변화율",
    "href": "sessions/session-11.html",
    "sort_order": 11
  },
  {
    "slug": "session-12",
    "title": "델타 2편, 확률과 헷지비율",
    "href": "sessions/session-12.html",
    "sort_order": 12
  },
  {
    "slug": "session-13",
    "title": "감마, 델타의 변화율과 옵션의 비선형성",
    "href": "sessions/session-13.html",
    "sort_order": 13
  },
  {
    "slug": "session-14",
    "title": "세타, 시간은 옵션가격을 어떻게 갉아먹는가",
    "href": "sessions/session-14.html",
    "sort_order": 14
  },
  {
    "slug": "session-15",
    "title": "베가, 변동성의 가격",
    "href": "sessions/session-15.html",
    "sort_order": 15
  },
  {
    "slug": "session-16",
    "title": "로, 금리와 배당은 옵션에 어떻게 반영되는가",
    "href": "sessions/session-16.html",
    "sort_order": 16
  },
  {
    "slug": "session-17",
    "title": "옵션 매수의 본질, 감마를 사며 세타를 지불한다",
    "href": "sessions/session-17.html",
    "sort_order": 17
  },
  {
    "slug": "session-18",
    "title": "옵션 매도의 본질, 세타를 받으며 감마 리스크를 진다",
    "href": "sessions/session-18.html",
    "sort_order": 18
  },
  {
    "slug": "session-19",
    "title": "외가격 옵션의 유혹과 위험",
    "href": "sessions/session-19.html",
    "sort_order": 19
  },
  {
    "slug": "session-20",
    "title": "내가격 옵션과 주식 대체 효과",
    "href": "sessions/session-20.html",
    "sort_order": 20
  },
  {
    "slug": "session-21",
    "title": "커버드콜, 수익을 앞당겨 받는 대신 상승 일부를 넘긴다",
    "href": "sessions/session-21.html",
    "sort_order": 21
  },
  {
    "slug": "session-22",
    "title": "보호적 풋, 포트폴리오 보험의 기본형",
    "href": "sessions/session-22.html",
    "sort_order": 22
  },
  {
    "slug": "session-23",
    "title": "스프레드 전략, 한쪽 옵션으로 다른 리스크를 줄인다",
    "href": "sessions/session-23.html",
    "sort_order": 23
  },
  {
    "slug": "session-24",
    "title": "스트래들, 스트랭글, 방향보다 큰 움직임을 사는 전략",
    "href": "sessions/session-24.html",
    "sort_order": 24
  },
  {
    "slug": "session-25",
    "title": "전략 이름보다 포지션 그릭스를 보라",
    "href": "sessions/session-25.html",
    "sort_order": 25
  },
  {
    "slug": "session-26",
    "title": "델타헷지, 방향 리스크를 지우는 동적 작업",
    "href": "sessions/session-26.html",
    "sort_order": 26
  },
  {
    "slug": "session-27",
    "title": "감마와 동적헷징, 왜 큰 움직임이 헷지 수량을 바꾸는가",
    "href": "sessions/session-27.html",
    "sort_order": 27
  },
  {
    "slug": "session-28",
    "title": "마켓메이커, 마켓감마, 감마 스퀴즈",
    "href": "sessions/session-28.html",
    "sort_order": 28
  },
  {
    "slug": "session-29",
    "title": "VIX, 스큐, 변동성 시장 읽기",
    "href": "sessions/session-29.html",
    "sort_order": 29
  },
  {
    "slug": "session-30",
    "title": "개인투자자의 옵션 사용법과 체크리스트",
    "href": "sessions/session-30.html",
    "sort_order": 30
  },
  {
    "slug": "epilogue",
    "title": "강의를 이해하고 나서의 투자방향",
    "href": "epilogue.html",
    "sort_order": 31
  }
];
  window.HOWINSIGHT_COURSE_SESSIONS = DEFAULT_COURSE_SESSIONS;

  if (!isConfigured) return;

  function currentSlug() {
    const path = window.location.pathname;
    if (/\/prologue\.html$/.test(path)) return 'prologue';
    if (/\/epilogue\.html$/.test(path)) return 'epilogue';
    const match = path.match(/\/sessions\/(session-\d{2})\.html$/);
    return match ? match[1] : '';
  }

  function ensureStyle() {
    if (document.getElementById('hi-course-visibility-style')) return;
    const style = document.createElement('style');
    style.id = 'hi-course-visibility-style';
    style.textContent = `
      .hi-session-locked { opacity:.48; }
      .hi-session-locked .rt-title { color:var(--text-dim) !important; cursor:not-allowed; }
      .hi-session-lock-note { display:inline-block; margin-left:8px; font-family:'JetBrains Mono',monospace; font-size:10px; color:var(--text-dim); }
      .hi-course-lock { position:fixed; inset:0; z-index:9998; display:grid; place-items:center; padding:24px; background:rgba(11,13,12,.96); color:#f1eee5; font-family:'Noto Sans KR',system-ui,sans-serif; }
      .hi-course-lock-card { width:min(520px,100%); border:1px solid #44483d; border-radius:20px; background:linear-gradient(135deg,#151715,#1d211d); box-shadow:0 24px 80px rgba(0,0,0,.42); padding:28px; }
      .hi-course-lock-brand { font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.12em; color:#f5b14c; text-transform:uppercase; margin-bottom:12px; }
      .hi-course-lock-card h2 { margin:0 0 10px; font-size:24px; line-height:1.28; }
      .hi-course-lock-card p { margin:0 0 16px; color:#a49b8b; line-height:1.7; font-size:14px; }
      .hi-course-lock-card a { display:inline-flex; align-items:center; justify-content:center; min-height:44px; padding:0 16px; border-radius:999px; background:#f5b14c; color:#11130f; font-weight:900; text-decoration:none; }
    `;
    document.head.appendChild(style);
  }

  function loadSupabase() {
    return new Promise((resolve, reject) => {
      if (window.supabase?.createClient) return resolve(window.supabase);
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => resolve(window.supabase);
      script.onerror = () => reject(new Error('Supabase SDK를 불러오지 못했습니다.'));
      document.head.appendChild(script);
    });
  }

  async function fetchVisibility() {
    const sdk = await loadSupabase();
    const client = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const { data, error } = await client
      .from('course_session_visibility')
      .select('slug, visible')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  function visibilityMap(rows) {
    const publishedThrough = Number(config.publishedThroughSession || 0);
    const isStaticallyPublished = (slug) => {
      if (slug === 'prologue') return true;
      const match = String(slug).match(/^session-(\d{2})$/);
      return match ? Number(match[1]) <= publishedThrough : false;
    };
    const map = new Map(DEFAULT_COURSE_SESSIONS.map((item) => [item.slug, isStaticallyPublished(item.slug)]));
    rows.forEach((row) => {
      if (isStaticallyPublished(row.slug)) {
        map.set(row.slug, true);
        return;
      }
      map.set(row.slug, row.visible === true);
    });
    return map;
  }

  function applyIndex(map) {
    ensureStyle();
    DEFAULT_COURSE_SESSIONS.forEach((item) => {
      const visible = map.get(item.slug) === true;
      const link = document.querySelector(`a[href="${item.href}"], a[href="./${item.href}"]`);
      if (!link) return;
      const row = link.closest('tr');
      const status = row?.querySelector('.rt-status');
      if (visible) {
        row?.classList.remove('hi-session-locked');
        if (!link.getAttribute('href') && link.dataset.lockedHref) link.setAttribute('href', link.dataset.lockedHref);
        link.removeAttribute('aria-disabled');
        link.querySelector('.hi-session-lock-note')?.remove();
        if (status) { status.textContent = '공개'; status.classList.remove('pending'); status.classList.add('open'); }
        return;
      }
      row?.classList.add('hi-session-locked');
      if (link.getAttribute('href')) link.dataset.lockedHref = link.getAttribute('href');
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      if (!link.querySelector('.hi-session-lock-note')) link.insertAdjacentHTML('beforeend', '<span class="hi-session-lock-note">LOCKED</span>');
      if (status) { status.textContent = '비공개'; status.classList.remove('open'); status.classList.add('pending'); }
    });
  }

  function blockPage(slug) {
    ensureStyle();
    const item = DEFAULT_COURSE_SESSIONS.find((entry) => entry.slug === slug);
    const root = document.createElement('div');
    root.id = 'hi-course-lock';
    root.className = 'hi-course-lock';
    root.innerHTML = `
      <div class="hi-course-lock-card">
        <div class="hi-course-lock-brand">${config.brandLabel || 'HowInsight'}</div>
        <h2>아직 공개되지 않은 회차입니다</h2>
        <p>${item?.title || '이 회차'}는 현재 관리자 설정에서 비공개 상태입니다. 공개된 회차는 목차에서 확인할 수 있습니다.</p>
        <a href="${slug.startsWith('session-') ? '../index.html' : 'index.html'}">목차로 돌아가기</a>
      </div>
    `;
    document.body.appendChild(root);
    document.documentElement.style.overflow = 'hidden';
  }

  async function boot() {
    try {
      const rows = await fetchVisibility();
      const map = visibilityMap(rows);
      if (/\/index\.html$|\/$/.test(window.location.pathname)) applyIndex(map);
      const slug = currentSlug();
      if (slug && map.get(slug) !== true) blockPage(slug);
    } catch (error) {
      console.warn('[HowInsight Course Visibility] 공개 회차 설정을 불러오지 못했습니다. 목차는 기본 비공개 표기로 둡니다.', error?.message || error);
      if (/\/index\.html$|\/$/.test(window.location.pathname)) applyIndex(visibilityMap([]));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
