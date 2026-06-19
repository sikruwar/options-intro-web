from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT.parent
PROTECTED = [ROOT / 'prologue.html', ROOT / 'sessions' / 'session-01.html', ROOT / 'sessions' / 'session-05.html']


def test_auth_assets_exist():
    assert (ROOT / 'assets' / 'auth-config.js').exists()
    assert (ROOT / 'assets' / 'auth-gate.js').exists()
    assert (ROOT / 'assets' / 'auth-admin.js').exists()
    assert (ROOT / 'supabase_schema.sql').exists()
    assert (ROOT / 'references.html').exists()


def test_email_gate_is_disabled_and_access_code_gate_is_enabled():
    config = (ROOT / 'assets' / 'auth-config.js').read_text(encoding='utf-8')
    gate = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'accessGateEnabled: false' in config
    assert 'accessCodeGateEnabled: true' in config
    assert 'OPTION-OPEN-05' in config
    assert 'accessCodeStorageKey' in config
    assert 'accessGateEnabled' in gate
    assert 'accessCodeGateEnabled' in gate
    assert 'emailGateEnabled || accessCodeGateEnabled' in gate


def test_access_code_gate_ui_exists():
    js = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'renderAccessCodeGate' in js
    assert '강의 접근 코드 입력' in js
    assert '강의 들어가기' in js
    assert '접근 코드가 맞지 않습니다' in js
    assert 'method: \'access_code\'' in js
    assert 'localStorage.setItem(accessCodeStorageKey()' in js


def test_protected_pages_load_gate_after_config():
    for path in PROTECTED:
        html = path.read_text(encoding='utf-8')
        assert 'assets/auth-config.js' in html or '../assets/auth-config.js' in html
        assert 'assets/auth-gate.js' in html or '../assets/auth-gate.js' in html
        assert html.index('auth-config.js') < html.index('auth-gate.js')


def test_public_index_hides_admin_link_and_request_copy():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert 'admin.html' not in html
    assert '접근 제한을 켜면' not in html
    assert 'href="#roadmap"' in html
    assert '공개 회차 확인하기' in html
    assert 'id="roadmap"' in html
    assert '저작권 보호 안내' in html
    assert '무단 복제·전재·배포·재판매·2차 가공·AI 학습데이터 수집을 금지' in html
    assert '강의자료 레퍼런스 안내' in html
    assert '무기견의 내부 지식맵' not in html
    assert 'OIC, OCC, SEC, FINRA, Cboe' in html
    assert 'href="references.html"' in html


def test_references_page_lists_actual_sources():
    html = (ROOT / 'references.html').read_text(encoding='utf-8')
    assert '참고문헌과 출처' in html
    assert 'Options Industry Council, Options Basics' in html
    assert 'OCC, Characteristics and Risks of Standardized Options' in html
    assert 'SEC Investor.gov, Options' in html
    assert 'FINRA, Options' in html
    assert 'Volatility Index Methodology: Cboe Volatility Index' in html
    assert 'Sheldon Natenberg' in html
    assert 'John C. Hull' in html
    assert '무기견의 내부 지식맵' not in html
    assert '<h2>제작 원칙</h2>' not in html


def test_admin_page_loads_admin_script():
    html = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'assets/auth-config.js' in html
    assert 'assets/auth-admin.js' in html
    assert 'access_requests' in js
    assert 'approved_users' in js


def test_privacy_consent_copy_uses_clear_x_id_language():
    gate = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    admin = (ROOT / 'admin.html').read_text(encoding='utf-8')
    privacy = (ROOT / 'privacy.html').read_text(encoding='utf-8')
    assert 'X 닉네임' not in gate
    assert 'X 닉네임' not in admin
    assert 'X 아이디' in gate
    assert 'privacy_consent' in gate
    assert '개인정보처리방침' in gate
    assert 'privacy.html' in gate
    assert '수집 항목' in privacy
    assert '이메일, X 아이디' in privacy


def test_approved_user_identity_badge_exists():
    js = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'renderApprovedBadge' in js
    assert '승인 계정' in js
    assert 'x_handle' in js
    assert 'hi-approved-sign-out' in js


def test_auth_rate_limit_message_is_friendly():
    js = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'authErrorMessage' in js
    assert '인증 메일 요청이 잠시 제한됐습니다' in js
    assert 'secondsUntilOtpRetry' in js


def test_expired_magic_link_message_is_friendly():
    js = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'authUrlError' in js
    assert '인증 링크가 만료됐거나 이미 사용된 링크입니다' in js


def test_mobile_course_navigation_is_visible_on_course_pages():
    pages = [ROOT / 'prologue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 6
    for path in pages:
        html = path.read_text(encoding='utf-8')
        assert 'Mobile course navigation: keep previous/index/next reachable on phones.' in html
        assert '.nav-prev,.nav-index,.nav-forward { display:inline-flex !important;' in html
        assert 'nav-index' in html
        assert 'nav-forward' in html


def test_course_readability_overrides_are_loaded_on_course_pages():
    assert (ROOT / 'assets' / 'readability-overrides.css').exists()
    pages = [ROOT / 'index.html', ROOT / 'prologue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 7
    for path in pages:
        html = path.read_text(encoding='utf-8')
        expected_href = '../assets/readability-overrides.css' if path.parent.name == 'sessions' else 'assets/readability-overrides.css'
        assert expected_href in html



def test_course_visibility_admin_ui_exists():
    admin = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    schema = (ROOT / 'supabase_schema.sql').read_text(encoding='utf-8')
    assert 'session-visibility-list' in admin
    assert 'save-visibility' in admin
    assert '필수 Supabase 테이블' not in admin
    assert 'course_session_visibility' in js
    assert 'course_session_visibility' in schema
    assert 'Anyone can read course session visibility' in schema
    assert 'Admins can manage course session visibility' in schema
    assert '저장 전 확인창' in admin
    assert 'confirmVisibilitySave' in js
    assert 'summarizeVisibilityChanges' in js
    assert '공개로 변경' in js
    assert '비공개로 변경' in js
    assert 'window.confirm' in js


def test_course_visibility_script_is_loaded_on_course_pages():
    assert (ROOT / 'assets' / 'course-visibility.js').exists()
    pages = [ROOT / 'index.html', ROOT / 'prologue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 7
    for path in pages:
        html = path.read_text(encoding='utf-8')
        assert 'course-visibility.js' in html
        assert 'auth-config.js' in html
        assert html.index('auth-config.js') < html.index('course-visibility.js')


def test_unreleased_sessions_are_kept_out_of_public_deploy():
    public_sessions = sorted(path.name for path in (ROOT / 'sessions').glob('session-*.html'))
    assert public_sessions == [f'session-{num:02d}.html' for num in range(1, 6)]
    assert not (ROOT / 'epilogue.html').exists()
    assert not (ROOT / 'sessions' / 'session-06.html').exists()
    assert (OUTPUT_ROOT / 'drafts' / 'sessions' / 'session-06.html').exists()
    assert (OUTPUT_ROOT / 'drafts' / 'sessions' / 'session-30.html').exists()
    assert (OUTPUT_ROOT / 'drafts' / 'epilogue.html').exists()


def test_session_five_points_to_upcoming_page():
    html = (ROOT / 'sessions' / 'session-05.html').read_text(encoding='utf-8')
    upcoming = (ROOT / 'upcoming.html').read_text(encoding='utf-8')
    assert '../upcoming.html' in html
    assert 'session-06.html' not in html
    assert '다음 회차를 준비하고 있습니다' in upcoming
    assert '공개 회차 확인하기' in upcoming


def test_index_marks_prologue_open_and_remote_visible_sessions_as_open():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'course-visibility.js').read_text(encoding='utf-8')
    admin = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert html.count('<span class="rt-status open">공개</span>') == 1
    assert '<span class="rt-status pending">비공개</span>' in html
    assert "new Map(DEFAULT_COURSE_SESSIONS.map((item) => [item.slug, item.slug === 'prologue']))" in js
    assert 'row.visible === true' in js
    assert 'map.get(item.slug) === true' in js
    assert 'map.get(slug) !== true' in js
    assert "row ? row.visible === true : item.slug === 'prologue'" in admin
    assert 'visible: visibleBySlug.get(item.slug) === true' in admin



def test_admin_request_approval_feedback_exists():
    admin = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'request-status approved' in js
    assert '승인됨' in js
    assert 'is-approved' in admin
    assert '승인 계정 목록에 반영됐습니다' in js
    assert 'data-action="revoke"' in js
    assert '접근불가' in js


def test_visibility_checkboxes_render_before_remote_table():
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'list.innerHTML = mergeVisibilityRows([]).map(visibilityRowTemplate).join' in js
    assert '체크박스는 먼저 선택할 수 있고' not in js
    assert 'course_session_visibility table unavailable' in js



def test_x_subscriber_allowlist_admin_ui_exists():
    admin = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    schema = (ROOT / 'supabase_schema.sql').read_text(encoding='utf-8')
    assert 'x-subscriber-handles' in admin
    assert 'sync-subscribers' in admin
    assert 'x-subscriber-add-one' in admin
    assert 'add-one-subscriber' in admin
    assert 'normalize-subscriber-input' in admin
    assert '입력칸 명단 저장' in admin
    assert '삭제는 입력칸에서 해당 줄을 지우고 저장하면 반영됩니다' in admin
    assert '활성구독자 확인' in js
    assert '구독자 목록 없음' in js
    assert 'addOneSubscriberToTextarea' in js
    assert 'normalizeSubscriberTextarea' in js
    assert '추가·삭제가 반영됐습니다' in js
    assert "textarea.value = handles.join('\\n')" in js
    assert '입력칸에 현재 명단을 표시했고' in js
    assert 'x_subscribers' in js
    assert 'x_subscribers' in schema
    assert 'Admins can manage x subscribers' in schema


def test_access_request_rls_keeps_user_requests_pending_only():
    gate_js = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    schema = (ROOT / 'supabase_schema.sql').read_text(encoding='utf-8')

    assert "Anyone can create pending access request" in schema
    assert "Authenticated users can update pending own request metadata" in schema
    assert 'drop policy if exists "Anyone can request access"' in schema
    assert 'drop policy if exists "Authenticated users can update own request"' in schema
    assert "status = 'pending'" in schema
    assert "approved_at is null" in schema
    assert "status: 'pending'" in gate_js
    assert "approved_at: null" in gate_js
