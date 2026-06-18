from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTECTED = [ROOT / 'prologue.html', ROOT / 'epilogue.html', ROOT / 'sessions' / 'session-01.html', ROOT / 'sessions' / 'session-30.html']


def test_auth_assets_exist():
    assert (ROOT / 'assets' / 'auth-config.js').exists()
    assert (ROOT / 'assets' / 'auth-gate.js').exists()
    assert (ROOT / 'assets' / 'auth-admin.js').exists()
    assert (ROOT / 'supabase_schema.sql').exists()


def test_access_gate_can_be_temporarily_disabled():
    config = (ROOT / 'assets' / 'auth-config.js').read_text(encoding='utf-8')
    gate = (ROOT / 'assets' / 'auth-gate.js').read_text(encoding='utf-8')
    assert 'accessGateEnabled: false' in config
    assert 'accessGateEnabled' in gate
    assert '!accessGateEnabled' in gate


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


def test_admin_page_loads_admin_script():
    html = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'assets/auth-config.js' in html
    assert 'assets/auth-admin.js' in html
    assert 'access_requests' in js
    assert 'approved_users' in js


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
    pages = [ROOT / 'prologue.html', ROOT / 'epilogue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 32
    for path in pages:
        html = path.read_text(encoding='utf-8')
        assert 'Mobile course navigation: keep previous/index/next reachable on phones.' in html
        assert '.nav-prev,.nav-index,.nav-forward { display:inline-flex !important;' in html
        assert 'nav-index' in html
        assert 'nav-forward' in html



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


def test_course_visibility_script_is_loaded_on_course_pages():
    assert (ROOT / 'assets' / 'course-visibility.js').exists()
    pages = [ROOT / 'index.html', ROOT / 'prologue.html', ROOT / 'epilogue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 33
    for path in pages:
        html = path.read_text(encoding='utf-8')
        assert 'course-visibility.js' in html
        if 'auth-config.js' in html:
            assert html.index('auth-config.js') < html.index('course-visibility.js')



def test_admin_request_approval_feedback_exists():
    admin = (ROOT / 'admin.html').read_text(encoding='utf-8')
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'request-status approved' in js
    assert '승인됨' in js
    assert 'is-approved' in admin
    assert '승인 계정 목록에 반영됐습니다' in js


def test_visibility_checkboxes_render_before_remote_table():
    js = (ROOT / 'assets' / 'auth-admin.js').read_text(encoding='utf-8')
    assert 'list.innerHTML = mergeVisibilityRows([]).map(visibilityRowTemplate).join' in js
    assert '체크박스는 먼저 선택할 수 있고' in js
