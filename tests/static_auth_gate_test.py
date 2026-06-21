from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE_APPLY = 'options.html'
COURSE_ENTRY = 'https://course.howinsight.com/sessions/session-01?entry=login'
COURSE_ADMIN = 'https://course.howinsight.com/admin.html'


def read(rel):
    return (ROOT / rel).read_text(encoding='utf-8')


def test_www_index_is_brand_landing_to_course_site():
    html = read('index.html')
    assert 'HowInsight · 무기견의 투자 학습 공간' in html
    assert '공개 안내/브랜드 공간' in html
    assert COURSE_APPLY in html
    assert '프롤로그 읽고 강의자료 열람 신청하기' in html
    assert 'https://course.howinsight.com/prologue?entry=login' not in html
    assert 'https://course.howinsight.com/index.html' not in html
    assert COURSE_ADMIN in html
    assert 'assets/auth-gate.js' not in html
    assert '접근 코드' not in html


def test_options_page_contains_public_prologue_and_application_form():
    html = read('options.html')
    assert '무기견의 옵션 입문 · 프롤로그와 열람 신청' in html
    assert '옵션 공부는<br>동기 점검에서' in html
    assert 'id="course-access-request-form"' in html
    assert '구독 여부 확인을 위한 X 아이디' in html
    assert 'course-access-request' in html
    assert COURSE_ENTRY in html
    assert '1회차로 이동해 OTP 인증하기' in html
    assert 'assets/auth-gate.js' not in html
    assert '접근 코드' not in html


def test_legacy_admin_is_retired_and_redirects_to_course_admin():
    html = read('admin.html')
    assert '관리자 페이지가 이동했습니다' in html
    assert COURSE_ADMIN in html
    assert 'session-visibility-list' not in html
    assert 'x-subscriber-handles' not in html
    assert 'assets/auth-admin.js' not in html
    assert 'noindex,nofollow' in html


def test_public_course_pages_redirect_to_private_course_domain_without_lesson_body():
    pages = [ROOT / 'prologue.html', ROOT / 'epilogue.html'] + sorted((ROOT / 'sessions').glob('session-*.html'))
    assert len(pages) == 32
    sensitive_terms = [
        'Figure 07',
        '옵션 체인 읽는 순서',
        '콜 매수',
        '풋 매수',
        '손익분기점',
        '델타헷지',
        '감마 스퀴즈',
    ]
    for path in pages:
        html = path.read_text(encoding='utf-8')
        rel = path.relative_to(ROOT).as_posix()
        assert f'https://course.howinsight.com/{rel}' in html
        assert '강의 페이지가 이동했습니다' in html
        assert 'noindex,nofollow' in html
        for term in sensitive_terms:
            assert term not in html


def test_course_specific_aux_pages_redirect_to_course_home():
    for rel in ['upcoming.html', 'references.html']:
        html = read(rel)
        assert COURSE_APPLY in html
        assert '강의 안내가 이동했습니다' in html
        assert 'noindex,nofollow' in html


def test_robots_and_sitemap_match_brand_role():
    robots = read('robots.txt')
    sitemap = read('sitemap.xml')
    assert 'Disallow: /admin' in robots
    assert 'Disallow: /sessions/' in robots
    assert 'Disallow: /prologue.html' in robots
    assert 'Sitemap: https://howinsight.com/sitemap.xml' in robots
    assert '<loc>https://howinsight.com/</loc>' in sitemap
    assert '<loc>https://howinsight.com/options.html</loc>' in sitemap
    assert 'course.howinsight.com' not in sitemap
