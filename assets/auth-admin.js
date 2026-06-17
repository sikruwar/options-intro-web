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
    return `
      <div class="request-row" data-email="${req.email}">
        <div>
          <strong>${req.email}</strong>
          <span>${req.x_handle || '-'}</span>
          <small>${requested} · ${req.status || 'pending'}</small>
        </div>
        <div class="request-actions">
          <button data-action="approve" data-email="${req.email}" data-x="${req.x_handle || ''}">승인</button>
          <button data-action="reject" data-email="${req.email}">거절</button>
        </div>
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

  async function boot() {
    setStatus('관리자 권한을 확인하는 중입니다.');
    const context = await requireAdmin();
    if (!context) return;
    const { supabase, email } = context;
    $('admin-email').textContent = email;
    $('admin-app')?.classList.remove('is-disabled');
    setStatus('신청 목록을 불러왔습니다.');
    await loadRequests(supabase);

    $('request-list')?.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      button.disabled = true;
      try {
        if (button.dataset.action === 'approve') {
          await approve(supabase, button.dataset.email, button.dataset.x);
          setStatus(`${button.dataset.email} 승인 완료`);
        } else {
          await reject(supabase, button.dataset.email);
          setStatus(`${button.dataset.email} 거절 처리 완료`);
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
    $('admin-sign-out')?.addEventListener('click', async () => {
      await supabase.auth.signOut();
      location.reload();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
