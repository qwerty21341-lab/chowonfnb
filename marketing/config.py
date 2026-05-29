"""
마케팅 에이전트 설정
── 여기에 API 키를 채워넣으세요 ──
"""
import os

# ─── Telegram ✅ 연결됨 ───────────────────────────────────
TELEGRAM_BOT_TOKEN = "8945416716:AAFGV4NWsISbwwZBxzToCe_zKkrQzJRdgKk"
TELEGRAM_CHAT_ID   = "2118277787"

# ─── Instagram Graph API ─────────────────────────────────
# 1. https://developers.facebook.com/ 앱 생성 (무료)
# 2. Instagram Graph API 추가, Instagram Business 계정 연결
# 3. 장기 액세스 토큰 발급 (60일, 자동 갱신 코드 포함됨)
INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_BUSINESS_ID  = os.environ.get("INSTAGRAM_BUSINESS_ID", "")

# ─── Google APIs ─────────────────────────────────────────
# 1. https://console.cloud.google.com/ 프로젝트 생성
# 2. 아래 API 활성화:
#    - My Business Business Information API
#    - Search Console API
#    - Google Analytics Data API
# 3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)
# 4. python marketing/setup_google_oauth.py 실행 → Refresh Token 발급
GOOGLE_CLIENT_ID      = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET  = os.environ.get("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REFRESH_TOKEN  = os.environ.get("GOOGLE_REFRESH_TOKEN", "")
GOOGLE_LOCATION_NAME  = os.environ.get("GOOGLE_LOCATION_NAME", "")  # "accounts/xxx/locations/xxx"
GA4_PROPERTY_ID       = os.environ.get("GA4_PROPERTY_ID", "")       # "properties/xxxxxxxxx"
GSC_SITE_URL          = os.environ.get("GSC_SITE_URL", "https://chowonfnb.com")

# ─── Stability AI ────────────────────────────────────────
# https://platform.stability.ai/ 무료 가입 → API Keys → 키 생성
STABILITY_API_KEY = os.environ.get("STABILITY_API_KEY", "sk-SJ7I1kyVS0rbzy9PNXT32zM74RCv7XlzXX8IrO6SrnYzDxtE")

# ─── Pexels ──────────────────────────────────────────────
# https://www.pexels.com/api/ 무료 가입 → Your API Key
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "0sFk0csOUO0he9ritFYloZCRvQDB9Y9S5veG5KbCqQmqqGzdY8CVwFhX")

# ─── Naver Developer (플레이스 모니터링) ─────────────────
# https://developers.naver.com/apps/ 앱 생성 → 검색 API 신청 (무료)
NAVER_CLIENT_ID     = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

# ─── Anthropic ✅ 기존 .env 사용 ─────────────────────────
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
