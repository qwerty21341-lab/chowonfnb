"""
발행 에이전트
- Telegram: 예약 알림 + 마케팅 콘텐츠 알림
- Instagram: Graph API (Meta Developer 무료)
- Google Business Profile: Posts API (구글 계정 무료)
설정 필요: config.py에 API 키 입력
"""

import os
import json
import httpx
import asyncio
from pathlib import Path
from datetime import datetime
from typing import Optional

ROOT = Path(__file__).parent.parent

try:
    from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID
except ImportError:
    TELEGRAM_BOT_TOKEN    = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_CHAT_ID      = os.environ.get("TELEGRAM_CHAT_ID", "")
    INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    INSTAGRAM_BUSINESS_ID  = os.environ.get("INSTAGRAM_BUSINESS_ID", "")


# ═══════════════════════════════════════════════════════════
# TELEGRAM
# ═══════════════════════════════════════════════════════════

async def telegram_send_text(text: str, chat_id: str = "") -> bool:
    """텔레그램 텍스트 메시지 전송"""
    token = TELEGRAM_BOT_TOKEN
    chat  = chat_id or TELEGRAM_CHAT_ID
    if not token or not chat:
        print("  ⚠️  텔레그램 설정 없음 (config.py 확인)")
        return False

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
    ok = r.json().get("ok", False)
    print(f"  {'✅' if ok else '❌'} 텔레그램 전송: {'성공' if ok else r.text[:80]}")
    return ok


async def telegram_send_photo(image_path: str, caption: str = "", chat_id: str = "") -> bool:
    """텔레그램 이미지 + 캡션 전송"""
    token = TELEGRAM_BOT_TOKEN
    chat  = chat_id or TELEGRAM_CHAT_ID
    if not token or not chat:
        return False

    async with httpx.AsyncClient() as client:
        with open(image_path, "rb") as f:
            r = await client.post(
                f"https://api.telegram.org/bot{token}/sendPhoto",
                data={"chat_id": chat, "caption": caption, "parse_mode": "HTML"},
                files={"photo": f},
                timeout=30,
            )
    ok = r.json().get("ok", False)
    print(f"  {'✅' if ok else '❌'} 텔레그램 이미지 전송: {'성공' if ok else r.text[:80]}")
    return ok


def notify_reservation(data: dict) -> bool:
    """예약 알림 (actions.ts에서 호출)"""
    msg = (
        f"📋 <b>예약 요청</b>\n"
        f"━━━━━━━━━━━━━━\n"
        f"👤 {data.get('name', '')}\n"
        f"📅 {data.get('date', '')} {data.get('time', '')}\n"
        f"👥 {data.get('guests', '')}명\n"
        f"📞 {data.get('phone', '')}\n"
        f"{f'📝 {data[\"note\"]}' if data.get('note') else ''}"
    )
    return asyncio.run(telegram_send_text(msg))


# ═══════════════════════════════════════════════════════════
# INSTAGRAM GRAPH API
# ═══════════════════════════════════════════════════════════

async def instagram_post_image(
    image_url: str,          # 공개 URL이어야 함 (로컬 파일 X)
    caption: str,
) -> Optional[str]:
    """
    인스타그램 단일 이미지 게시
    반환: 게시물 ID or None
    """
    if not INSTAGRAM_ACCESS_TOKEN or not INSTAGRAM_BUSINESS_ID:
        print("  ⚠️  인스타그램 설정 없음 (config.py 확인)")
        return None

    async with httpx.AsyncClient() as client:
        # Step 1: 컨테이너 생성
        r = await client.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media",
            params={
                "image_url": image_url,
                "caption": caption,
                "access_token": INSTAGRAM_ACCESS_TOKEN,
            },
            timeout=30,
        )
        container = r.json()
        if "id" not in container:
            print(f"  ❌ 인스타 컨테이너 생성 실패: {container}")
            return None

        container_id = container["id"]
        print(f"  ⏳ 인스타 컨테이너 생성: {container_id}")

        # Step 2: 게시
        await asyncio.sleep(3)  # 처리 대기
        r2 = await client.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media_publish",
            params={
                "creation_id": container_id,
                "access_token": INSTAGRAM_ACCESS_TOKEN,
            },
            timeout=30,
        )
        result = r2.json()
        post_id = result.get("id")
        print(f"  {'✅' if post_id else '❌'} 인스타 게시: {post_id or result}")
        return post_id


async def instagram_post_carousel(
    image_urls: list[str],
    caption: str,
) -> Optional[str]:
    """카루셀 (여러 장) 게시"""
    if not INSTAGRAM_ACCESS_TOKEN or not INSTAGRAM_BUSINESS_ID:
        print("  ⚠️  인스타그램 설정 없음")
        return None

    async with httpx.AsyncClient() as client:
        # 각 이미지 컨테이너 생성
        children = []
        for url in image_urls:
            r = await client.post(
                f"https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media",
                params={"image_url": url, "is_carousel_item": "true",
                        "access_token": INSTAGRAM_ACCESS_TOKEN},
                timeout=20,
            )
            cid = r.json().get("id")
            if cid:
                children.append(cid)

        if not children:
            return None

        # 카루셀 컨테이너
        r = await client.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media",
            params={
                "media_type": "CAROUSEL",
                "children": ",".join(children),
                "caption": caption,
                "access_token": INSTAGRAM_ACCESS_TOKEN,
            },
            timeout=30,
        )
        container_id = r.json().get("id")
        if not container_id:
            return None

        await asyncio.sleep(5)
        r2 = await client.post(
            f"https://graph.facebook.com/v21.0/{INSTAGRAM_BUSINESS_ID}/media_publish",
            params={"creation_id": container_id, "access_token": INSTAGRAM_ACCESS_TOKEN},
            timeout=30,
        )
        post_id = r2.json().get("id")
        print(f"  {'✅' if post_id else '❌'} 인스타 카루셀 게시: {post_id}")
        return post_id


# ═══════════════════════════════════════════════════════════
# PIPELINE 통합 함수
# ═══════════════════════════════════════════════════════════

def publish_all(
    image_paths: list[str],
    copy: dict[str, str],
    image_host_urls: list[str] | None = None,  # 인스타는 공개 URL 필요
) -> dict[str, bool]:
    """모든 플랫폼에 게시"""
    results = {}

    async def _run():
        # 텔레그램: 첫 번째 이미지 + 인스타 카피
        if image_paths:
            tg_caption = copy.get("instagram", "단소상회 새 게시물")[:200]
            results["telegram"] = await telegram_send_photo(image_paths[0], caption=tg_caption)

        # 인스타그램 (공개 URL 있을 때만)
        if image_host_urls:
            ig_caption = copy.get("instagram", "")
            if len(image_host_urls) == 1:
                post_id = await instagram_post_image(image_host_urls[0], ig_caption)
            else:
                post_id = await instagram_post_carousel(image_host_urls, ig_caption)
            results["instagram"] = bool(post_id)

    asyncio.run(_run())
    return results


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    # 연결 테스트
    print("\n📡 발행 에이전트 연결 테스트")
    asyncio.run(telegram_send_text(
        "✅ 단소상회 마케팅 에이전트 연결 테스트\n"
        f"{datetime.now().strftime('%Y-%m-%d %H:%M')}"
    ))
