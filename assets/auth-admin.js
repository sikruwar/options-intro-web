(() => {
  const config = window.HOWINSIGHT_AUTH_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const adminEmails = (config.adminEmails || []).map((email) => String(email).trim().toLowerCase());
  let supabaseClient = null;

  const $ = (id) => document.getElementById(id);
  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
  const normalizeXHandle = (handle) => {
    const raw = String(handle || '').trim();
    if (!raw) return '';
    return raw.startsWith('@') ? raw : `@${raw}`;
  };

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

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function setStatus(text) {
    const el = $('admin-status');
    if (el) el.textContent = text;
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

  async function getClient() {
    if (supabaseClient) return supabaseClient;
    const sdk = await loadSupabase();
    supabaseClient = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return supabaseClient;
  }

  async function requireAdmin() {
    if (!isConfigured) {
      setStatus('assets/auth-config.js에 Supabase URL과 anon key를 넣으면 관리자 기능이 활성화됩니다.');
      $('admin-app')?.classList.add('is-disabled');
      return null;
    }
    const supabase = await getClient();
    const { data } = await supabase.auth.getSession();
    const email = normalizeEmail(data?.session?.user?.email);
    if (!email) {
      renderLogin();
      return null;
    }
    if (adminEmails.length && !adminEmails.includes(email)) {
      setStatus(`${email}은 관리자 목록에 없습니다. auth-config.js와 Supabase admin_users를 확인하세요.`);
      $('admin-app')?.classList.add('is-disabled');
      return null;
    }
    return { supabase, email };
  }

  function renderLogin() {
    const login = $('admin-login');
    if (!login) return;
    login.innerHTML = `
      <form id="admin-login-form" class="admin-card">
        <h2>관리자 로그인</h2>
        <p>관리자 이메일로 magic link를 받아 로그인합니다.</p>
        <label>이메일</label>
        <input name="email" type="email" placeholder="admin@example.com" required>
        <button type="submit">로그인 링크 받기</button>
      </form>
    `;
    $('admin-login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = normalizeEmail(event.currentTarget.email.value);
      try {
        const supabase = await getClient();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.href }
        });
        if (error) throw error;
        setStatus('로그인 링크를 보냈습니다. 메일에서 링크를 눌러주세요.');
      } catch (error) {
        setStatus(error.message);
      }
    });
  }

  function rowTemplate(req) {
    const requested = req.requested_at ? new Date(req.requested_at).toLocaleString('ko-KR') : '-';
    const status = req.status || 'pending';
    const email = escapeHtml(req.email);
    const xHandle = escapeHtml(req.x_handle || '-');
    const rowClass = status === 'approved' ? ' is-approved' : status === 'rejected' ? ' is-rejected' : '';
    const actions = status === 'approved'
      ? `<span class="request-status approved">승인됨</span><button data-action="revoke" data-email="${email}" class="danger">접근불가</button>`
      : status === 'rejected'
        ? `<button data-action="approve" data-email="${email}" data-x="${xHandle === '-' ? '' : xHandle}">재승인</button><span class="request-status rejected">접근불가</span>`
        : `<button data-action="approve" data-email="${email}" data-x="${xHandle === '-' ? '' : xHandle}">승인</button><button data-action="reject" data-email="${email}" class="danger">거절</button>`;
    return `
      <div class="request-row${rowClass}" data-email="${email}">
        <div>
          <strong>${email}</strong>
          <span>${xHandle}</span>
          <small>${requested} · ${status}</small>
        </div>
        <div class="request-actions">${actions}</div>
      </div>
    `;
  }

  async function loadRequests(supabase) {
    const { data, error } = await supabase
      .from('access_requests')
      .select('email, x_handle, status, requested_at')
      .order('requested_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    const list = $('request-list');
    if (!list) return;
    list.innerHTML = data?.length ? data.map(rowTemplate).join('') : '<p class="muted">신청자가 아직 없습니다.</p>';
  }

  async function approve(supabase, email, xHandle) {
    const normalized = normalizeEmail(email);
    const { error: upsertError } = await supabase.from('approved_users').upsert({
      email: normalized,
      x_handle: normalizeXHandle(xHandle),
      active: true,
      approved_at: new Date().toISOString()
    }, { onConflict: 'email' });
    if (upsertError) throw upsertError;
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('email', normalized);
    if (updateError) throw updateError;
  }

  async function reject(supabase, email) {
    const normalized = normalizeEmail(email);
    const { error } = await supabase
      .from('access_requests')
      .update({ status: 'rejected' })
      .eq('email', normalized);
    if (error) throw error;
    await supabase.from('approved_users').update({ active: false }).eq('email', normalized);
  }


  function mergeVisibilityRows(rows = []) {
    const bySlug = new Map(rows.map((row) => [row.slug, row]));
    return DEFAULT_COURSE_SESSIONS.map((item) => {
      const row = bySlug.get(item.slug);
      return { ...item, visible: row ? row.visible !== false : true };
    });
  }

  function visibilityRowTemplate(item) {
    return `
      <label class="session-visibility-row">
        <input type="checkbox" data-session-visible="${escapeHtml(item.slug)}" ${item.visible ? 'checked' : ''}>
        <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.slug)} · ${escapeHtml(item.href)}</small></span>
        <span class="visibility-pill">${item.visible ? 'OPEN' : 'LOCKED'}</span>
      </label>
    `;
  }

  async function loadSessionVisibility(supabase) {
    const list = $('session-visibility-list');
    if (!list) return;
    list.innerHTML = mergeVisibilityRows([]).map(visibilityRowTemplate).join('');
    const { data, error } = await supabase
      .from('course_session_visibility')
      .select('slug, visible')
      .order('sort_order', { ascending: true });
    if (error) {
      console.warn('[HowInsight Admin] course_session_visibility table unavailable:', error.message);
      return;
    }
    const rows = mergeVisibilityRows(data || []);
    list.innerHTML = rows.map(visibilityRowTemplate).join('');
  }

  async function saveSessionVisibility(supabase) {
    const inputs = Array.from(document.querySelectorAll('[data-session-visible]'));
    const visibleBySlug = new Map(inputs.map((input) => [input.dataset.sessionVisible, input.checked]));
    const payload = DEFAULT_COURSE_SESSIONS.map((item) => ({
      slug: item.slug,
      title: item.title,
      href: item.href,
      sort_order: item.sort_order,
      visible: visibleBySlug.get(item.slug) !== false,
      updated_at: new Date().toISOString()
    }));
    const { error } = await supabase
      .from('course_session_visibility')
      .upsert(payload, { onConflict: 'slug' });
    if (error) throw error;
    await loadSessionVisibility(supabase);
  }

  function setVisibilityPreset(mode) {
    document.querySelectorAll('[data-session-visible]').forEach((input) => {
      const slug = input.dataset.sessionVisible;
      if (mode === 'all') input.checked = true;
      else if (mode === 'none') input.checked = false;
      else if (mode === 'through20') input.checked = slug === 'prologue' || (slug.startsWith('session-') && Number(slug.replace('session-', '')) <= 20);
      const pill = input.closest('.session-visibility-row')?.querySelector('.visibility-pill');
      if (pill) pill.textContent = input.checked ? 'OPEN' : 'LOCKED';
    });
  }

  async function boot() {
    setStatus('관리자 권한을 확인하는 중입니다.');
    const context = await requireAdmin();
    if (!context) return;
    const { supabase, email } = context;
    $('admin-email').textContent = email;
    $('admin-app')?.classList.remove('is-disabled');
    setStatus('신청 목록을 불러왔습니다.');
    await loadRequests(supabase);
    await loadSessionVisibility(supabase);

    $('request-list')?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      button.disabled = true;
      try {
        if (button.dataset.action === 'approve') {
          await approve(supabase, button.dataset.email, button.dataset.x);
          const row = button.closest('.request-row');
          if (row) {
            row.classList.add('is-approved');
            row.classList.remove('is-rejected');
            const small = row.querySelector('small');
            if (small) small.textContent = `${new Date().toLocaleString('ko-KR')} · approved`;
            const actions = row.querySelector('.request-actions');
            if (actions) actions.innerHTML = `<span class="request-status approved">승인됨</span><button data-action="revoke" data-email="${button.dataset.email}" class="danger">접근불가</button>`;
          }
          setStatus(`${button.dataset.email} 승인 완료. 승인 계정 목록에 반영됐습니다.`);
        } else {
          await reject(supabase, button.dataset.email);
          const row = button.closest('.request-row');
          if (row) {
            row.classList.add('is-rejected');
            row.classList.remove('is-approved');
            const small = row.querySelector('small');
            if (small) small.textContent = `${new Date().toLocaleString('ko-KR')} · rejected`;
            const actions = row.querySelector('.request-actions');
            if (actions) actions.innerHTML = `<button data-action="approve" data-email="${button.dataset.email}" data-x="${button.dataset.x || ''}">재승인</button><span class="request-status rejected">접근불가</span>`;
          }
          setStatus(`${button.dataset.email} 접근을 비활성화했습니다.`);
        }
        await loadRequests(supabase);
      } catch (error) {
        setStatus(error.message);
      } finally {
        button.disabled = false;
      }
    });

    $('refresh-requests')?.addEventListener('click', async () => {
      await loadRequests(supabase);
      setStatus('새로고침 완료');
    });
    $('refresh-visibility')?.addEventListener('click', async () => {
      await loadSessionVisibility(supabase);
      setStatus('공개 회차 설정을 불러왔습니다.');
    });
    $('save-visibility')?.addEventListener('click', async (event) => {
      event.currentTarget.disabled = true;
      try {
        await saveSessionVisibility(supabase);
        setStatus('공개 회차 설정을 저장했습니다.');
      } catch (error) {
        console.warn('[HowInsight Admin] session visibility save failed:', error.message);
        setStatus('공개 회차 설정을 저장하지 못했습니다. 잠시 뒤 다시 시도해주세요.');
      } finally {
        event.currentTarget.disabled = false;
      }
    });
    $('select-visible-through-20')?.addEventListener('click', () => setVisibilityPreset('through20'));
    $('select-all-sessions')?.addEventListener('click', () => setVisibilityPreset('all'));
    $('select-none-sessions')?.addEventListener('click', () => setVisibilityPreset('none'));
    $('admin-sign-out')?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      location.reload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
