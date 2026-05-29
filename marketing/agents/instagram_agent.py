"""
Instagram 에이전트 — Meta Graph API (무료)
사진/릴스/카루셀 게시 + 인사이트 분석
필요: Meta Developer 앱 + Instagram Business 계정
"""

import os
import httpx
import asyncio
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent

try:
    from config import INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ID
except ImportError:
    INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
    INSTAGRAM_BUSINESS_ID  = os.environ.get("INSTAGRAM_BUSINESS_ID", "")

GRAPH_URL = "https://graph.instagram.com/v21.0"


def _p(extra: dict = {}) -> dict:
    return {"access_token": INSTAGRAM_ACCESS_TOKEN, **extra}


# ═══════════════════════════════════════════════════════════
# 게시
# ═══════════════════════════════════════════════════════════

async def post_photo(image_url: str, caption: str) -> str | None:
    """단일 사진 게시. image_url은 공개 URL이어야 함."""
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media",
                         params=_p({"image_url": image_url, "caption": caption}))
        cid = r.json().get("id")
        if not cid:
            print(f"  컨테이너 생성 실패: {r.json()}")
            return None
        await asyncio.sleep(3)
        r2 = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media_publish",
                          params=_p({"creation_id": cid}))
        pid = r2.json().get("id")
        print(f"  인스타 게시: {'성공 ' + pid if pid else '실패 ' + r2.text[:80]}")
        return pid


async def post_reel(video_url: str, caption: str, cover_url: str | None = None) -> str | None:
    """릴스 게시. video_url은 공개 URL."""
    async with httpx.AsyncClient(timeout=60) as c:
        params = _p({"media_type": "REELS", "video_url": video_url, "caption": caption})
        if cover_url:
            params["cover_url"] = cover_url
        r = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media", params=params)
        cid = r.json().get("id")
        if not cid:
            print(f"  릴스 컨테이너 실패: {r.json()}")
            return None

        # 처리 대기 (릴스는 최대 1~2분)
        for _ in range(20):
            await asyncio.sleep(6)
            status = await c.get(f"{GRAPH_URL}/{cid}",
                                  params=_p({"fields": "status_code,status"}))
            code = status.json().get("status_code")
            if code == "FINISHED":
                break
            if code == "ERROR":
                print(f"  릴스 처리 오류: {status.json()}")
                return None

        r2 = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media_publish",
                          params=_p({"creation_id": cid}))
        pid = r2.json().get("id")
        print(f"  릴스 게시: {'성공 ' + pid if pid else '실패'}")
        return pid


async def post_carousel(image_urls: list[str], caption: str) -> str | None:
    """카루셀 (여러 장) 게시"""
    async with httpx.AsyncClient(timeout=30) as c:
        children = []
        for url in image_urls[:10]:  # 최대 10장
            r = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media",
                              params=_p({"image_url": url, "is_carousel_item": "true"}))
            cid = r.json().get("id")
            if cid:
                children.append(cid)

        if not children:
            return None

        r = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media",
                          params=_p({"media_type": "CAROUSEL",
                                     "children": ",".join(children),
                                     "caption": caption}))
        cid = r.json().get("id")
        if not cid:
            return None

        await asyncio.sleep(5)
        r2 = await c.post(f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media_publish",
                           params=_p({"creation_id": cid}))
        pid = r2.json().get("id")
        print(f"  카루셀 게시: {'성공 ' + pid if pid else '실패'}")
        return pid


# ═══════════════════════════════════════════════════════════
# 인사이트 분석
# ═══════════════════════════════════════════════════════════

def get_account_insights(period: str = "week") -> dict:
    """
    계정 인사이트
    period: "day" | "week" | "days_28"
    """
    r = httpx.get(
        f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/insights",
        params=_p({
            "metric": "impressions,reach,profile_views,website_clicks",
            "period": period,
        }),
        timeout=15,
    )
    data = r.json().get("data", [])
    return {item["name"]: item.get("values", [{}])[-1].get("value", 0) for item in data}


def get_media_insights(post_id: str) -> dict:
    """특정 게시물 인사이트"""
    r = httpx.get(
        f"{GRAPH_URL}/{post_id}/insights",
        params=_p({"metric": "impressions,reach,likes,comments,shares,saves,video_views"}),
        timeout=15,
    )
    data = r.json().get("data", [])
    return {item["name"]: item.get("values", [{}])[-1].get("value", 0) for item in data}


def get_recent_posts(limit: int = 10) -> list[dict]:
    """최근 게시물 목록"""
    r = httpx.get(
        f"{GRAPH_URL}/{INSTAGRAM_BUSINESS_ID}/media",
        params=_p({"fields": "id,caption,media_type,timestamp,like_count,comments_count",
                   "limit": limit}),
        timeout=15,
    )
    return r.json().get("data", [])


def insights_report() -> str:
    """인사이트 요약 (텔레그램용)"""
    try:
        acc = get_account_insights("week")
        posts = get_recent_posts(5)

        lines = [
            "📸 <b>인스타그램 주간 인사이트</b>",
            f"━━━━━━━━━━━━━━",
            f"👁 노출: {acc.get('impressions', '?')}",
            f"🔍 도달: {acc.get('reach', '?')}",
            f"👤 프로필 방문: {acc.get('profile_views', '?')}",
            f"🔗 웹사이트 클릭: {acc.get('website_clicks', '?')}",
        ]
        if posts:
            lines.append(f"\n최근 게시물 반응:")
            for p in posts[:3]:
                cap = (p.get("caption", "") or "")[:20]
                lines.append(f"  ❤️{p.get('like_count',0)} 💬{p.get('comments_count',0)} — {cap}...")
        return "\n".join(lines)
    except Exception as e:
        return f"인스타 리포트 오류: {e}"


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if not INSTAGRAM_ACCESS_TOKEN:
        print("INSTAGRAM_ACCESS_TOKEN 없음. config.py 확인.")
        sys.exit(1)
    print(insights_report())
