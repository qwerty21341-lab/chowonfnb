"""
Google 에이전트 — 무료 (Google Cloud 프로젝트 필요)
- Google Business Profile API: 포스팅, 리뷰 답변
- Google Search Console API: 검색 순위 모니터링
- Google Analytics 4 API: 웹사이트 방문자 분석
OAuth 2.0 인증 (최초 1회 브라우저 인증 필요)
"""

import os
import json
import httpx
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path(__file__).parent.parent
TOKEN_PATH = ROOT / ".google_token.json"

try:
    from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, \
                       GOOGLE_LOCATION_NAME, GA4_PROPERTY_ID, GSC_SITE_URL
except ImportError:
    GOOGLE_CLIENT_ID      = os.environ.get("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET  = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REFRESH_TOKEN  = os.environ.get("GOOGLE_REFRESH_TOKEN", "")
    GOOGLE_LOCATION_NAME  = os.environ.get("GOOGLE_LOCATION_NAME", "")   # "accounts/xxx/locations/xxx"
    GA4_PROPERTY_ID       = os.environ.get("GA4_PROPERTY_ID", "")        # "properties/xxxxxxxxx"
    GSC_SITE_URL          = os.environ.get("GSC_SITE_URL", "https://chowonfnb.com")


# ─── OAuth 토큰 갱신 ─────────────────────────────────────────────────────────
def get_access_token() -> str:
    """Refresh Token으로 Access Token 갱신"""
    r = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": GOOGLE_REFRESH_TOKEN,
            "grant_type":    "refresh_token",
        },
        timeout=10,
    )
    data = r.json()
    if "access_token" not in data:
        raise RuntimeError(f"토큰 갱신 실패: {data}")
    return data["access_token"]


def _auth_headers() -> dict:
    return {"Authorization": f"Bearer {get_access_token()}",
            "Content-Type": "application/json"}


# ═══════════════════════════════════════════════════════════
# GOOGLE BUSINESS PROFILE
# ═══════════════════════════════════════════════════════════

def gbp_create_post(text: str, image_url: str | None = None, cta_type: str = "LEARN_MORE") -> dict:
    """
    구글 비즈니스 프로필 포스트 생성
    cta_type: LEARN_MORE | BOOK | ORDER | SHOP | SIGN_UP | CALL
    """
    body: dict = {
        "languageCode": "ko",
        "summary": text[:1500],
        "callToAction": {
            "actionType": cta_type,
            "url": "https://chowonfnb.com/danso",
        },
        "topicType": "STANDARD",
    }

    if image_url:
        body["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": image_url}]

    r = httpx.post(
        f"https://mybusiness.googleapis.com/v4/{GOOGLE_LOCATION_NAME}/localPosts",
        headers=_auth_headers(),
        json=body,
        timeout=30,
    )
    result = r.json()
    post_name = result.get("name", "")
    print(f"  GBP 포스트: {'성공 — ' + post_name if post_name else '실패 — ' + str(result)[:100]}")
    return result


def gbp_list_reviews(page_size: int = 10) -> list[dict]:
    """리뷰 목록 가져오기"""
    r = httpx.get(
        f"https://mybusiness.googleapis.com/v4/{GOOGLE_LOCATION_NAME}/reviews",
        headers=_auth_headers(),
        params={"pageSize": page_size},
        timeout=10,
    )
    reviews = r.json().get("reviews", [])
    print(f"  리뷰 {len(reviews)}개 조회")
    return reviews


def gbp_reply_review(review_name: str, reply_text: str) -> bool:
    """리뷰 답변"""
    r = httpx.put(
        f"https://mybusiness.googleapis.com/v4/{review_name}/reply",
        headers=_auth_headers(),
        json={"comment": reply_text},
        timeout=10,
    )
    ok = r.status_code == 200
    print(f"  리뷰 답변: {'성공' if ok else '실패 ' + r.text[:80]}")
    return ok


# ═══════════════════════════════════════════════════════════
# GOOGLE SEARCH CONSOLE
# ═══════════════════════════════════════════════════════════

def gsc_get_top_queries(days: int = 28, row_limit: int = 20) -> list[dict]:
    """
    최근 N일 상위 검색 쿼리
    반환: [{"query", "clicks", "impressions", "ctr", "position"}]
    """
    end   = datetime.now().strftime("%Y-%m-%d")
    start = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

    r = httpx.post(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{GSC_SITE_URL}/searchAnalytics/query",
        headers=_auth_headers(),
        json={
            "startDate": start,
            "endDate":   end,
            "dimensions": ["query"],
            "rowLimit":   row_limit,
            "orderBy":    [{"fieldName": "clicks", "sortOrder": "DESCENDING"}],
        },
        timeout=15,
    )
    rows = r.json().get("rows", [])
    result = []
    for row in rows:
        result.append({
            "query":       row["keys"][0],
            "clicks":      row.get("clicks", 0),
            "impressions": row.get("impressions", 0),
            "ctr":         round(row.get("ctr", 0) * 100, 1),
            "position":    round(row.get("position", 0), 1),
        })
    return result


def gsc_get_index_status() -> dict:
    """색인 현황 요약"""
    r = httpx.get(
        f"https://searchconsole.googleapis.com/webmasters/v3/sites/{GSC_SITE_URL}/sitemaps",
        headers=_auth_headers(),
        timeout=10,
    )
    return r.json()


# ═══════════════════════════════════════════════════════════
# GOOGLE ANALYTICS 4
# ═══════════════════════════════════════════════════════════

def ga4_get_overview(days: int = 7) -> dict:
    """
    최근 N일 방문자 현황
    반환: {"sessions", "users", "pageviews", "bounce_rate", "top_pages"}
    """
    end   = "today"
    start = f"{days}daysAgo"

    r = httpx.post(
        f"https://analyticsdata.googleapis.com/v1beta/{GA4_PROPERTY_ID}:runReport",
        headers=_auth_headers(),
        json={
            "dateRanges": [{"startDate": start, "endDate": end}],
            "metrics": [
                {"name": "sessions"},
                {"name": "activeUsers"},
                {"name": "screenPageViews"},
                {"name": "bounceRate"},
            ],
            "dimensions": [{"name": "pagePath"}],
            "limit": 10,
            "orderBys": [{"metric": {"metricName": "sessions"}, "desc": True}],
        },
        timeout=15,
    )
    data = r.json()

    # 합계
    totals = data.get("totals", [{}])[0].get("metricValues", [])
    total_map = {}
    if totals:
        total_map = {
            "sessions":    int(float(totals[0].get("value", 0))),
            "users":       int(float(totals[1].get("value", 0))),
            "pageviews":   int(float(totals[2].get("value", 0))),
            "bounce_rate": round(float(totals[3].get("value", 0)) * 100, 1),
        }

    # 상위 페이지
    top_pages = []
    for row in data.get("rows", []):
        path = row["dimensionValues"][0]["value"]
        sessions = int(float(row["metricValues"][0]["value"]))
        top_pages.append({"path": path, "sessions": sessions})

    return {**total_map, "top_pages": top_pages[:5]}


def ga4_get_reservation_funnel() -> dict:
    """예약 완료 이벤트 추적"""
    r = httpx.post(
        f"https://analyticsdata.googleapis.com/v1beta/{GA4_PROPERTY_ID}:runReport",
        headers=_auth_headers(),
        json={
            "dateRanges": [{"startDate": "28daysAgo", "endDate": "today"}],
            "metrics":    [{"name": "eventCount"}],
            "dimensions": [{"name": "eventName"}],
            "dimensionFilter": {
                "filter": {
                    "fieldName": "eventName",
                    "stringFilter": {"matchType": "BEGINS_WITH", "value": "reservation"},
                }
            },
        },
        timeout=15,
    )
    rows = r.json().get("rows", [])
    return {row["dimensionValues"][0]["value"]: int(float(row["metricValues"][0]["value"]))
            for row in rows}


# ─── 리포트 ───────────────────────────────────────────────────────────────────
def weekly_report() -> str:
    """주간 통합 리포트 (텔레그램용)"""
    try:
        ga4  = ga4_get_overview(7)
        gsc  = gsc_get_top_queries(7, 5)

        lines = [
            "📊 <b>단소상회 주간 리포트</b>",
            f"━━━━━━━━━━━━━━",
            f"👁 방문자: {ga4.get('users', '?')}명",
            f"📄 페이지뷰: {ga4.get('pageviews', '?')}회",
            f"🔍 상위 검색어:",
        ]
        for q in gsc[:3]:
            lines.append(f"  · {q['query']} ({q['clicks']}클릭, {q['position']}위)")

        return "\n".join(lines)
    except Exception as e:
        return f"리포트 생성 오류: {e}"


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if not GOOGLE_CLIENT_ID:
        print("Google API 설정 없음. config.py 확인.")
        sys.exit(1)
    print(weekly_report())
