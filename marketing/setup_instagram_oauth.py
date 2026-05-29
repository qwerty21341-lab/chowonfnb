"""
Instagram Graph API 최초 인증 스크립트
1회만 실행하면 장기 액세스 토큰(60일) + Instagram Business ID 발급

실행 방법:
  python marketing/setup_instagram_oauth.py

필요한 것:
  1. https://developers.facebook.com/apps/ → chowonfnb 앱 선택
  2. 앱 설정 > 기본 설정 → 앱 ID + 앱 시크릿 코드 확인
"""

import json
import httpx
import webbrowser
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import sys

try:
    from config import (
        INSTAGRAM_ACCESS_TOKEN as _saved_token,
        INSTAGRAM_BUSINESS_ID  as _saved_id,
    )
except ImportError:
    _saved_token, _saved_id = "", ""

REDIRECT_URI = "http://localhost:8766"
SCOPES = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "pages_show_list",
    "pages_read_engagement",
]

auth_code = None
shutdown_flag = threading.Event()


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        params = parse_qs(urlparse(self.path).query)
        auth_code = params.get("code", [None])[0]
        error = params.get("error", [None])[0]

        self.send_response(200)
        self.end_headers()
        if auth_code:
            self.wfile.write("<h2>✅ 인증 완료! 이 창을 닫아도 됩니다.</h2>".encode())
        else:
            msg = f"<h2>❌ 오류: {error}</h2>"
            self.wfile.write(msg.encode())
        shutdown_flag.set()

    def log_message(self, *args):
        pass


def get_tokens(app_id: str, app_secret: str):
    global auth_code

    # 인증 URL 생성
    params = {
        "client_id":     app_id,
        "redirect_uri":  REDIRECT_URI,
        "response_type": "code",
        "scope":         ",".join(SCOPES),
    }
    auth_url = "https://www.facebook.com/dialog/oauth?" + urlencode(params)

    # 로컬 서버 시작
    server = HTTPServer(("localhost", 8766), _Handler)
    t = threading.Thread(target=server.handle_request)
    t.daemon = True
    t.start()

    print("\n브라우저에서 Facebook 계정으로 로그인해주세요...")
    print(f"URL: {auth_url}\n")
    webbrowser.open(auth_url)

    shutdown_flag.wait(timeout=120)
    t.join(timeout=5)

    if not auth_code:
        print("인증 실패 또는 시간 초과")
        return

    # ── 단기 토큰 교환 ──────────────────────────────
    r = httpx.post(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        data={
            "client_id":     app_id,
            "client_secret": app_secret,
            "redirect_uri":  REDIRECT_URI,
            "code":          auth_code,
        },
        timeout=15,
    )
    short = r.json()
    if "access_token" not in short:
        print(f"단기 토큰 실패: {short}")
        return

    short_token = short["access_token"]
    print("단기 토큰 발급 완료 (1시간 유효)")

    # ── 장기 토큰 교환 (60일) ───────────────────────
    r2 = httpx.get(
        "https://graph.facebook.com/v21.0/oauth/access_token",
        params={
            "grant_type":        "fb_exchange_token",
            "client_id":         app_id,
            "client_secret":     app_secret,
            "fb_exchange_token": short_token,
        },
        timeout=15,
    )
    long = r2.json()
    if "access_token" not in long:
        print(f"장기 토큰 실패: {long}")
        return

    long_token = long["access_token"]
    expires_in = long.get("expires_in", "알 수 없음")
    print(f"장기 토큰 발급 완료 (유효기간: {expires_in}초 ≈ 60일)")

    # ── 연결된 Facebook 페이지 조회 ─────────────────
    r3 = httpx.get(
        "https://graph.facebook.com/v21.0/me/accounts",
        params={"access_token": long_token},
        timeout=15,
    )
    pages = r3.json().get("data", [])
    if not pages:
        print("\n⚠️  연결된 Facebook 페이지가 없습니다.")
        print("   Facebook 페이지와 Instagram Business 계정이 연결되어 있어야 합니다.")
        print(f"\nINSTAGRAM_ACCESS_TOKEN={long_token}")
        return

    print(f"\n연결된 Facebook 페이지 ({len(pages)}개):")
    for p in pages:
        print(f"  · {p.get('name')} (ID: {p.get('id')})")

    page_token = pages[0]["access_token"]
    page_id    = pages[0]["id"]

    # ── Instagram Business 계정 ID 조회 ─────────────
    r4 = httpx.get(
        f"https://graph.facebook.com/v21.0/{page_id}",
        params={
            "fields":       "instagram_business_account",
            "access_token": page_token,
        },
        timeout=15,
    )
    ig_data = r4.json().get("instagram_business_account", {})
    ig_id   = ig_data.get("id", "")

    if ig_id:
        # IG 계정 이름 확인
        r5 = httpx.get(
            f"https://graph.facebook.com/v21.0/{ig_id}",
            params={"fields": "name,username,followers_count", "access_token": long_token},
            timeout=15,
        )
        ig_info = r5.json()
        print(f"\n✅ Instagram Business 계정:")
        print(f"   @{ig_info.get('username','')} — {ig_info.get('name','')} ({ig_info.get('followers_count',0)} 팔로워)")
    else:
        print("\n⚠️  Instagram Business 계정을 찾을 수 없습니다.")
        print("   Facebook 페이지 설정에서 Instagram 계정을 연결하세요.")

    # ── 결과 출력 ────────────────────────────────────
    print("\n" + "="*60)
    print("아래를 .env.local 에 추가하세요:")
    print("="*60)
    print(f"INSTAGRAM_ACCESS_TOKEN={long_token}")
    if ig_id:
        print(f"INSTAGRAM_BUSINESS_ID={ig_id}")
    print("="*60)

    if ig_id:
        print("\n아래를 GitHub Secrets에도 추가하세요:")
        print(f"  INSTAGRAM_ACCESS_TOKEN  =  {long_token}")
        print(f"  INSTAGRAM_BUSINESS_ID   =  {ig_id}")

    # ── config.py 자동 업데이트 여부 ─────────────────
    if ig_id:
        ans = input("\nconfig.py에 자동 저장할까요? (y/n): ").strip().lower()
        if ans == "y":
            config_path = "config.py"
            try:
                txt = open(config_path, encoding="utf-8").read()
                # 이미 os.environ.get 방식이므로 .env.local에 저장하는 게 맞음
                print("config.py는 os.environ.get 방식 → .env.local에 저장하는 것을 권장합니다.")
                print("위 값을 .env.local에 직접 붙여넣으세요.")
            except Exception as e:
                print(f"config.py 읽기 실패: {e}")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    print("=" * 60)
    print("Instagram Graph API 토큰 발급 스크립트")
    print("=" * 60)
    print()
    print("Meta Developer에서 앱 정보를 확인하세요:")
    print("  https://developers.facebook.com/apps/")
    print("  → chowonfnb 앱 → 앱 설정 → 기본 설정")
    print()

    app_id     = input("앱 ID (App ID): ").strip()
    app_secret = input("앱 시크릿 코드 (App Secret): ").strip()

    if not app_id or not app_secret:
        print("앱 ID와 시크릿 코드를 입력해야 합니다.")
        sys.exit(1)

    get_tokens(app_id, app_secret)


if __name__ == "__main__":
    main()
