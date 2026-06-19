(() => {
  const config = window.HOWINSIGHT_AUTH_CONFIG || {};
  const accessGateEnabled = config.accessGateEnabled !== false;
  const isConfigured = accessGateEnabled && Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const path = window.location.pathname;
  const shouldProtect = config.protectedPathPattern instanceof RegExp
    ? config.protectedPathPattern.test(path)
    : /\/(prologue|epilogue)\.html$|\/sessions\/session-\d+\.html$/.test(path);

  if (!shouldProtect || !accessGateEnabled) return;

  if (!isConfigured) {
    console.warn('[HowInsight Auth] Supabase config is empty. Course remains public until assets/auth-config.js is configured.');
    return;
  }

  const state = { supabase: null, session: null };

  function css() {
    if (document.getElementById('hi-auth-style')) return;
    const style = document.createElement('style');
    style.id = 'hi-auth-style';
    style.textContent = `
      .hi-auth-lock { position: fixed; inset: 0; z-index: 9999; background: rgba(11,13,12,.96); color: #f1eee5; display: grid; place-items: center; padding: 24px; font-family: 'Noto Sans KR', system-ui, sans-serif; }
      .hi-auth-card { width: min(480px, 100%); border: 1px solid #44483d; border-radius: 20px; background: linear-gradient(135deg,#151715,#1d211d); box-shadow: 0 24px 80px rgba(0,0,0,.42); padding: 28px; }
      .hi-auth-brand { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: .12em; color: #f5b14c; text-transform: uppercase; margin-bottom: 12px; }
      .hi-auth-card h2 { font-size: 24px; line-height: 1.28; margin: 0 0 10px; }
      .hi-auth-card p { margin: 0 0 16px; color: #a49b8b; line-height: 1.7; font-size: 14px; }
      .hi-auth-card label { display:block; font-size:12px; color:#a49b8b; margin: 14px 0 7px; }
      .hi-auth-card input { width:100%; box-sizing:border-box; border:1px solid #44483d; border-radius:12px; background:#0b0d0c; color:#f1eee5; min-height:46px; padding:0 14px; font:inherit; }
      .hi-auth-card input:focus { outline: 2px solid rgba(245,177,76,.35); border-color:#f5b14c; }
      .hi-auth-card button { width:100%; min-height:48px; margin-top:18px; border:0; border-radius:999px; background:#f5b14c; color:#11130f; font-weight:900; cursor:pointer; }
      .hi-auth-card button:disabled { opacity:.55; cursor:wait; }
      .hi-consent { display:flex !important; align-items:flex-start; gap:9px; color:#a49b8b !important; line-height:1.6; }
      .hi-consent input { width:auto !important; min-height:auto !important; margin-top:4px; accent-color:#f5b14c; }
      .hi-consent a { color:#f5b14c; text-decoration:underline; text-underline-offset:2px; }
      .hi-auth-small { font-size:12px !important; color:#746f65 !important; margin-top:14px !important; }
      .hi-auth-message { border:1px solid #2d302a; border-radius:12px; padding:12px 14px; background:#0b0d0c; color:#d8d1c3 !important; margin-top:14px !important; }
      .hi-auth-row { display:flex; gap:10px; align-items:center; justify-content:space-between; margin-top:12px; }
      .hi-auth-link { color:#f5b14c; background:none; border:0; width:auto; min-height:0; padding:0; margin:0; font:inherit; cursor:pointer; }
      .hi-approved-badge { position:fixed; right:18px; bottom:18px; z-index:80; display:flex; align-items:center; gap:10px; max-width:min(420px,calc(100vw - 32px)); padding:10px 13px; border:1px solid rgba(245,177,76,.35); border-radius:999px; background:rgba(11,13,12,.86); color:#f1eee5; box-shadow:0 12px 32px rgba(0,0,0,.24); backdrop-filter:blur(12px); font-family:'Noto Sans KR',system-ui,sans-serif; }
      .hi-approved-badge span { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#a49b8b; font-size:12px; }
      .hi-approved-badge strong { color:#f5b14c; font-weight:800; }
      .hi-approved-badge button { width:auto; min-height:0; margin:0; padding:0; border:0; background:transparent; color:#746f65; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; }
      .hi-approved-badge button:hover { color:#f5b14c; }
      @media (max-width:640px){ .hi-auth-card { padding:24px 20px; border-radius:16px; } .hi-auth-card h2 { font-size:21px; } .hi-approved-badge { left:12px; right:12px; bottom:12px; border-radius:16px; justify-content:space-between; } }
    `;
    document.head.appendChild(style);
  }

  function overlay(inner) {
    css();
    let root = document.getElementById('hi-auth-lock');
    if (!root) {
      root = document.createElement('div');
      root.id = 'hi-auth-lock';
      root.className = 'hi-auth-lock';
      document.body.appendChild(root);
    }
    root.innerHTML = `<div class="hi-auth-card">${inner}</div>`;
    document.documentElement.style.overflow = 'hidden';
  }

  function unlock(approval) {
    const root = document.getElementById('hi-auth-lock');
    if (root) root.remove();
    document.documentElement.style.overflow = '';
    renderApprovedBadge(approval);
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizeXHandle(handle) {
    const raw = String(handle || '').trim();
    if (!raw) return '';
    return raw.startsWith('@') ? raw : `@${raw}`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
  }

  function statusMessage(text) {
    const el = document.getElementById('hi-auth-message');
    if (el) el.textContent = text;
  }

  function authErrorMessage(error) {
    const message = String(error?.message || error || '');
    if (/rate limit|too many|email rate/i.test(message)) {
      return '인증 메일 요청이 잠시 제한됐습니다. 같은 메일함에 최신 로그인 링크가 있으면 그 링크를 눌러주세요. 메일이 없다면 1~2분 뒤 다시 요청하면 됩니다.';
    }
    return `처리 중 문제가 생겼습니다: ${message}`;
  }

  function otpCooldownKey(email) {
    return `howinsight-auth-otp-sent-at:${normalizeEmail(email)}`;
  }

  function secondsUntilOtpRetry(email) {
    const sentAt = Number(localStorage.getItem(otpCooldownKey(email)) || 0);
    if (!sentAt) return 0;
    const waitSeconds = 20;
    return Math.max(0, waitSeconds - Math.floor((Date.now() - sentAt) / 1000));
  }

  function authUrlError() {
    const params = new URLSearchParams(`${window.location.search || ''}&${(window.location.hash || '').replace(/^#/, '')}`);
    const code = params.get('error_code') || params.get('error');
    const description = params.get('error_description') || params.get('error');
    if (!code && !description) return '';
    if (/expired|invalid|otp|token|access_denied/i.test(`${code} ${description}`)) {
      return '인증 링크가 만료됐거나 이미 사용된 링크입니다. 같은 메일함에 최신 링크가 있으면 그 링크를 누르고, 없다면 잠시 뒤 인증 링크를 다시 받아주세요.';
    }
    return `인증 링크 처리 중 문제가 생겼습니다: ${description || code}`;
  }

  function cleanAuthUrlError() {
    if (!authUrlError()) return;
    history.replaceState(null, document.title, window.location.pathname + window.location.search.replace(/[?&](error|error_code|error_description)=[^&]*/g, ''));
  }

  function hasAuthCallbackParams() {
    const params = new URLSearchParams(`${window.location.search || ''}&${(window.location.hash || '').replace(/^#/, '')}`);
    return ['code', 'access_token', 'refresh_token', 'token_hash', 'type'].some((key) => params.has(key));
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
    if (state.supabase) return state.supabase;
    const sdk = await loadSupabase();
    state.supabase = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return state.supabase;
  }

  async function upsertRequest(email, xHandle) {
    const supabase = await getClient();
    const payload = {
      email: normalizeEmail(email),
      x_handle: normalizeXHandle(xHandle),
      status: 'pending',
      approved_at: null,
      source_path: path,
      requested_at: new Date().toISOString()
    };

    const { data: sessionData } = await supabase.auth.getSession();
    const sessionEmail = normalizeEmail(sessionData?.session?.user?.email);

    if (sessionEmail && sessionEmail === payload.email) {
      const { error } = await supabase.from('access_requests').upsert(payload, { onConflict: 'email' });
      if (error) throw error;
      return;
    }

    const { error } = await supabase.from('access_requests').insert(payload);
    if (error && error.code !== '23505') throw error;
  }

  async function getApproval(email) {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('approved_users')
      .select('email, x_handle, active')
      .eq('email', normalizeEmail(email))
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return data?.active ? data : null;
  }

  async function waitForSession(supabase) {
    const attempts = hasAuthCallbackParams() ? 18 : 3;
    for (let i = 0; i < attempts; i += 1) {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user?.email) return data.session;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const { data } = await supabase.auth.getSession();
    return data?.session || null;
  }

  function renderApprovedBadge(approval) {
    if (!approval?.email) return;
    css();
    const existing = document.getElementById('hi-approved-badge');
    if (existing) existing.remove();
    const root = document.createElement('div');
    root.id = 'hi-approved-badge';
    root.className = 'hi-approved-badge';
    const email = escapeHtml(approval.email);
    const handle = approval.x_handle ? ` · ${escapeHtml(approval.x_handle)}` : '';
    root.innerHTML = `<span>승인 계정 <strong>${email}</strong>${handle}</span><button type="button" id="hi-approved-sign-out">로그아웃</button>`;
    document.body.appendChild(root);
    document.getElementById('hi-approved-sign-out')?.addEventListener('click', async () => {
      const supabase = await getClient();
      await supabase.auth.signOut();
      root.remove();
      renderLogin();
    });
  }

  async function renderPending(user) {
    const email = normalizeEmail(user?.email);
    overlay(`
      <div class="hi-auth-brand">${config.brandLabel || 'HowInsight'}</div>
      <h2>승인 대기 중입니다</h2>
      <p>${email} 계정은 아직 강의 접근 승인이 완료되지 않았습니다. 신청 시 입력한 이메일과 X 아이디를 확인한 뒤 승인됩니다.</p>
      <form id="hi-request-form">
        <label for="hi-x">X 아이디</label>
        <input id="hi-x" name="x_handle" type="text" placeholder="@sniffshiba" autocomplete="nickname" required>
        <button type="submit">신청 정보 업데이트</button>
      </form>
      <p id="hi-auth-message" class="hi-auth-message">승인 전에는 이 화면이 표시됩니다.</p>
      <div class="hi-auth-row"><span class="hi-auth-small">로그인 이메일: ${email}</span><button class="hi-auth-link" id="hi-sign-out">로그아웃</button></div>
    `);
    document.getElementById('hi-request-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const btn = event.currentTarget.querySelector('button');
      btn.disabled = true;
      try {
        await upsertRequest(email, event.currentTarget.x_handle.value);
        statusMessage('신청 정보가 저장됐습니다. 승인 후 같은 이메일로 다시 접속하면 강의를 볼 수 있습니다.');
      } catch (error) {
        statusMessage(`저장 중 문제가 생겼습니다: ${error.message}`);
      } finally {
        btn.disabled = false;
      }
    });
    document.getElementById('hi-sign-out')?.addEventListener('click', async () => {
      const supabase = await getClient();
      await supabase.auth.signOut();
      renderLogin();
    });
  }

  function renderLogin() {
    overlay(`
      <div class="hi-auth-brand">${config.brandLabel || 'HowInsight'}</div>
      <h2>${config.courseTitle || '강의'} 접근 신청</h2>
      <p>승인된 이메일만 강의를 볼 수 있습니다. 이메일과 X 아이디를 남기면 구독 여부 확인 후 접근 권한이 열립니다.</p>
      <form id="hi-login-form">
        <label for="hi-email">이메일</label>
        <input id="hi-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required>
        <label for="hi-x">X 아이디</label>
        <input id="hi-x" name="x_handle" type="text" placeholder="@sniffshiba" autocomplete="nickname" required>
        <label class="hi-consent" for="hi-privacy-consent">
          <input id="hi-privacy-consent" name="privacy_consent" type="checkbox" required>
          <span>강의 접근 승인과 구독 여부 확인을 위해 이메일과 X 아이디를 수집·이용하는 데 동의합니다. <a href="privacy.html" target="_blank" rel="noopener">개인정보처리방침</a></span>
        </label>
        <button type="submit">이메일 인증 링크 받기</button>
      </form>
      <p id="hi-auth-message" class="hi-auth-message">입력한 이메일로 로그인 링크가 전송됩니다. 승인 전에는 대기 화면이 표시됩니다.</p>
      <p class="hi-auth-small">X 아이디는 프로필 주소에 표시되는 @아이디입니다. 예: @sniffshiba</p>
    `);
    document.getElementById('hi-login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const btn = form.querySelector('button');
      const email = normalizeEmail(form.email.value);
      const xHandle = normalizeXHandle(form.x_handle.value);
      btn.disabled = true;
      try {
        const retryAfter = secondsUntilOtpRetry(email);
        if (retryAfter > 0) {
          statusMessage(`로그인 링크를 방금 보냈습니다. 같은 메일함의 최신 링크를 먼저 눌러주세요. 새 링크 요청은 약 ${retryAfter}초 뒤에 다시 가능합니다.`);
          return;
        }
        const existingApproval = await getApproval(email).catch(() => null);
        if (!existingApproval) await upsertRequest(email, xHandle);
        const supabase = await getClient();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.href }
        });
        if (error) throw error;
        localStorage.setItem(otpCooldownKey(email), String(Date.now()));
        statusMessage(existingApproval
          ? '승인된 이메일입니다. 메일함의 최신 로그인 링크를 누르면 바로 강의로 들어갑니다.'
          : '인증 링크를 보냈습니다. 메일함에서 링크를 누르면 승인 상태를 확인합니다.');
      } catch (error) {
        statusMessage(authErrorMessage(error));
      } finally {
        btn.disabled = false;
      }
    });
  }

  async function boot() {
    overlay(`
      <div class="hi-auth-brand">${config.brandLabel || 'HowInsight'}</div>
      <h2>접근 권한 확인 중입니다</h2>
      <p>이메일 인증과 승인 상태를 확인하고 있습니다.</p>
    `);
    try {
      const linkError = authUrlError();
      if (linkError) {
        renderLogin();
        statusMessage(linkError);
        cleanAuthUrlError();
        return;
      }
      const supabase = await getClient();
      state.session = await waitForSession(supabase);
      const user = state.session?.user;
      if (!user?.email) return renderLogin();
      const approval = await getApproval(user.email);
      if (approval) return unlock(approval);
      return renderPending(user);
    } catch (error) {
      overlay(`
        <div class="hi-auth-brand">${config.brandLabel || 'HowInsight'}</div>
        <h2>접근 확인에 실패했습니다</h2>
        <p class="hi-auth-message">${error.message}</p>
        <button onclick="location.reload()">다시 시도</button>
      `);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
