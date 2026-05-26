"""
Google OAuth 최초 인증 스크립트
1회만 실행하면 Refresh Token이 발급됨 → config.py에 저장

실행 방법:
  python marketing/setup_google_oauth.py
"""

import json
import httpx
import webbrowser
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

try:
    from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
except ImportError:
    GOOGLE_CLIENT_ID = input("Google Client ID: ").strip()
    GOOGLE_CLIENT_SECRET = input("Google Client Secret: ").strip()

SCOPES = [
    "https://www.googleapis.com/auth/business.manage",          # GBP
    "https://www.googleapis.com/auth/webmasters.readonly",      # GSC
    "https://www.googleapis.com/auth/analytics.readonly",       # GA4
]

REDIRECT_URI = "http://localhost:8765"
auth_code = None


class _Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        params = parse_qs(urlparse(self.path).query)
        auth_code = params.get("code", [None])[0]
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"<h2>인증 완료! 이 창을 닫아도 됩니다.</h2>")

    def log_message(self, *args):
        pass


def get_refresh_token():
    global auth_code

    # 인증 URL 생성
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  REDIRECT_URI,
        "response_type": "code",
        "scope":         " ".join(SCOPES),
        "access_type":   "offline",
        "prompt":        "consent",
    }
    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)

    # 로컬 서버 시작
    server = HTTPServer(("localhost", 8765), _Handler)
    t = threading.Thread(target=server.handle_request)
    t.daemon = True
    t.start()

    print(f"\n브라우저에서 Google 계정 인증을 진행하세요...")
    webbrowser.open(auth_url)
    t.join(timeout=120)

    if not auth_code:
        print("인증 실패 또는 시간 초과")
        return

    # 토큰 교환
    r = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code":          auth_code,
            "redirect_uri":  REDIRECT_URI,
            "grant_type":    "authorization_code",
        },
    )
    tokens = r.json()

    if "refresh_token" not in tokens:
        print(f"토큰 발급 실패: {tokens}")
        return

    refresh_token = tokens["refresh_token"]
    print(f"\n✅ Refresh Token 발급 완료!")
    print(f"\n아래를 .env.local에 추가하세요:\n")
    print(f"GOOGLE_CLIENT_ID={GOOGLE_CLIENT_ID}")
    print(f"GOOGLE_CLIENT_SECRET={GOOGLE_CLIENT_SECRET}")
    print(f"GOOGLE_REFRESH_TOKEN={refresh_token}")

    # Location 확인
    access_token = tokens["access_token"]
    r2 = httpx.get(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    accounts = r2.json().get("accounts", [])
    if accounts:
        print(f"\n구글 비즈니스 계정:")
        for acc in accounts:
            print(f"  {acc['name']} — {acc.get('accountName', '')}")

        # Location 목록
        acc_name = accounts[0]["name"]
        r3 = httpx.get(
            f"https://mybusinessbusinessinformation.googleapis.com/v1/{acc_name}/locations",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"readMask": "name,title"},
        )
        locations = r3.json().get("locations", [])
        if locations:
            print(f"\n매장 Location Name (config에 입력):")
            for loc in locations:
                print(f"  GOOGLE_LOCATION_NAME={loc['name']}  ({loc.get('title', '')})")


if __name__ == "__main__":
    get_refresh_token()
