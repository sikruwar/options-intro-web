(() => {
  const config = window.HOWINSIGHT_AUTH_CONFIG || {};
  const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  const path = window.location.pathname;
  const shouldProtect = config.protectedPathPattern instanceof RegExp
    ? config.protectedPathPattern.test(path)
    : /\/(prologue|epilogue)\.html$|\/sessions\/session-\d+\.html$/.test(path);

  if (!shouldProtect) return;

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
      .hi-auth-small { font-size:12px !important; color:#746f65 !important; margin-top:14px !important; }
      .hi-auth-message { border:1px solid #2d302a; border-radius:12px; padding:12px 14px; background:#0b0d0c; color:#d8d1c3 !important; margin-top:14px !important; }
      .hi-auth-row { display:flex; gap:10px; align-items:center; justify-content:space-between; margin-top:12px; }
      .hi-auth-link { color:#f5b14c; background:none; border:0; width:auto; min-height:0; padding:0; margin:0; font:inherit; cursor:pointer; }
      @media (max-width:640px){ .hi-auth-card { padding:24px 20px; border-radius:16px; } .hi-auth-card h2 { font-size:21px; } }
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

  function unlock() {
    const root = document.getElementById('hi-auth-lock');
    if (root) root.remove();
    document.documentElement.style.overflow = '';
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizeXHandle(handle) {
    const raw = String(handle || '').trim();
    if (!raw) return '';
    return raw.startsWith('@') ? raw : `@${raw}`;
  }

  function statusMessage(text) {
    const el = document.getElementById('hi-auth-message');
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
    if (state.supabase) return state.supabase;
    const sdk = await loadSupabase();
    state.supabase = sdk.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    return state.supabase;
  }

  async function upsertRequest(email, xHandle, status = 'pending') {
    const supabase = await getClient();
    const payload = {
      email: normalizeEmail(email),
      x_handle: normalizeXHandle(xHandle),
      status,
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

  async function isApproved(email) {
    const supabase = await getClient();
    const { data, error } = await supabase
      .from('approved_users')
      .select('email, active')
      .eq('email', normalizeEmail(email))
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data?.active);
  }

  async function renderPending(user) {
    const email = normalizeEmail(user?.email);
    overlay(`
      <div class="hi-auth-brand">${config.brandLabel || 'HowInsight'}</div>
      <h2>승인 대기 중입니다</h2>
      <p>${email} 계정은 아직 강의 접근 승인이 완료되지 않았습니다. 신청 시 입력한 X 닉네임과 이메일을 확인한 뒤 승인됩니다.</p>
      <form id="hi-request-form">
        <label for="hi-x">X 닉네임</label>
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
        await upsertRequest(email, event.currentTarget.x_handle.value, 'pending');
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
      <p>승인된 이메일만 강의를 볼 수 있습니다. 이메일과 X 닉네임을 남기면 관리자 확인 후 접근 권한이 열립니다.</p>
      <form id="hi-login-form">
        <label for="hi-email">이메일</label>
        <input id="hi-email" name="email" type="email" placeholder="you@example.com" autocomplete="email" required>
        <label for="hi-x">X 닉네임</label>
        <input id="hi-x" name="x_handle" type="text" placeholder="@sniffshiba" autocomplete="nickname" required>
        <button type="submit">이메일 인증 링크 받기</button>
      </form>
      <p id="hi-auth-message" class="hi-auth-message">입력한 이메일로 로그인 링크가 전송됩니다. 승인 전에는 대기 화면이 표시됩니다.</p>
      <p class="hi-auth-small">강의 접근 관리를 위한 정보만 저장합니다. X 닉네임은 승인 확인용입니다.</p>
    `);
    document.getElementById('hi-login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const btn = form.querySelector('button');
      const email = normalizeEmail(form.email.value);
      const xHandle = normalizeXHandle(form.x_handle.value);
      btn.disabled = true;
      try {
        await upsertRequest(email, xHandle, 'pending');
        const supabase = await getClient();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.href }
        });
        if (error) throw error;
        statusMessage('인증 링크를 보냈습니다. 메일함에서 링크를 누르면 승인 상태를 확인합니다.');
      } catch (error) {
        statusMessage(`처리 중 문제가 생겼습니다: ${error.message}`);
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
      const supabase = await getClient();
      const { data } = await supabase.auth.getSession();
      state.session = data?.session || null;
      const user = state.session?.user;
      if (!user?.email) return renderLogin();
      if (await isApproved(user.email)) return unlock();
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
