"""
마케팅 에이전트 설정
── 여기에 API 키를 채워넣으세요 ──
"""

# ─── Telegram ─────────────────────────────────────────────
# 1. https://t.me/BotFather 에서 /newbot 으로 봇 생성
# 2. 봇 토큰 복사
TELEGRAM_BOT_TOKEN = ""   # "7xxxxxxxx:AAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 3. 봇에게 메시지 한 번 보내고
#    https://api.telegram.org/bot<TOKEN>/getUpdates 에서 chat.id 확인
TELEGRAM_CHAT_ID = ""     # "-100xxxxxxxxxx" (채널) 또는 "xxxxxxxxx" (개인)

# ─── Instagram Graph API ─────────────────────────────────
# 1. https://developers.facebook.com/ 에서 앱 생성 (무료)
# 2. Instagram Basic Display or Graph API 연결
# 3. 비즈니스 계정 필요 (개인 계정 → 비즈니스 전환: 무료)
INSTAGRAM_ACCESS_TOKEN = ""   # "EAAxxxxxxxx..."
INSTAGRAM_BUSINESS_ID  = ""   # "17xxxxxxxxx"

# ─── Google Business Profile ────────────────────────────
# 1. Google Cloud Console 프로젝트 생성 (무료)
# 2. Business Profile API 활성화
# 3. OAuth 2.0 인증
GOOGLE_ACCESS_TOKEN  = ""    # OAuth 후 발급
GOOGLE_LOCATION_NAME = ""    # "accounts/xxxxxxx/locations/xxxxxxx"

# ─── Anthropic (카피 에이전트) ───────────────────────────
# 기존 프로젝트 .env의 키를 그대로 사용 가능
import os
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
