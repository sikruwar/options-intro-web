from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTECTED = [ROOT / 'prologue.html', ROOT / 'epilogue.html', ROOT / 'sessions' / 'session-01.html', ROOT / 'sessions' / 'session-30.html']


def test_auth_assets_exist():
    assert (ROOT / 'assets' / 'auth-config.js').exists()
    assert (ROOT / 'assets' / 'auth-gate.js').exists()
    assert (ROOT / 'assets' / 'auth-admin.js').exists()
    assert (ROOT / 'supabase_schema.sql').exists()


def test_protected_pages_load_gate_after_config():
    for path in PROTECTED:
        html = path.read_text(encoding='utf-8')
        assert 'assets/auth-config.js' in html or '../assets/auth-config.js' in html
        assert 'assets/auth-gate.js' in html or '../assets/auth-gate.js' in html
        assert html.index('auth-config.js') < html.index('auth-gate.js')


def test_public_index_links_to_admin_and_request_flow():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    assert 'admin.html' in html
    assert '승인' in html


def test_admin_page_loads_admin_script():
    html = (ROOT / 'admin.html').read_text(encoding='utf-8')
    assert 'assets/auth-config.js' in html
    assert 'assets/auth-admin.js' in html
    assert 'access_requests' in html
    assert 'approved_users' in html
