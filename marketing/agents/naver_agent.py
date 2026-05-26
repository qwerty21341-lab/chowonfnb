"""
네이버 에이전트 — Playwright 반자동화
네이버 블로그: 초안 생성 + 브라우저 열어서 게시 준비
네이버 플레이스: 현황 모니터링 (공개 API)
"""

import os
import json
import asyncio
import subprocess
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "output" / "naver"


def prepare_blog_post(
    title: str,
    content: str,
    tags: list[str],
    images: list[str] | None = None,
) -> str:
    """
    블로그 포스팅 초안을 HTML 파일로 저장
    브라우저에서 열어서 내용 확인 후 게시
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%m%d_%H%M")

    # 이미지 태그 생성
    img_html = ""
    if images:
        img_html = "\n".join(
            f'<img src="{p}" style="max-width:100%;margin:12px 0" alt="단소상회">'
            for p in images
        )

    tag_html = " ".join(f"#{t}" for t in tags)

    html = f"""<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8">
<title>블로그 초안: {title}</title>
<style>
body {{ font-family: 'Malgun Gothic', sans-serif; max-width: 800px; margin: 40px auto;
       padding: 24px; background: #fafafa; color: #333; line-height: 1.8; }}
.title {{ font-size: 28px; font-weight: bold; margin-bottom: 8px; color: #111; }}
.meta {{ color: #888; font-size: 13px; margin-bottom: 24px; }}
.content {{ font-size: 16px; white-space: pre-wrap; }}
.tags {{ margin-top: 32px; color: #03c75a; font-size: 14px; }}
.copy-btn {{ padding: 10px 20px; background: #03c75a; color: white;
             border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }}
.notice {{ background: #fff3cd; border: 1px solid #ffc107; padding: 12px 16px;
           border-radius: 6px; margin-bottom: 20px; font-size: 13px; }}
</style></head>
<body>
<div class="notice">
  📋 <b>블로그 초안입니다.</b> 내용 확인 후 네이버 블로그에 직접 복사해서 게시하세요.<br>
  아래 [내용 복사] 버튼을 누르면 클립보드에 복사됩니다.
</div>
<div class="title">{title}</div>
<div class="meta">생성: {datetime.now().strftime('%Y-%m-%d %H:%M')} | 단소상회 마케팅 에이전트</div>
{img_html}
<div class="content">{content}</div>
<div class="tags">{tag_html}</div>
<br>
<button class="copy-btn" onclick="
  const text = document.querySelector('.content').innerText;
  navigator.clipboard.writeText(document.querySelector('.title').innerText + '\\n\\n' + text + '\\n\\n' + document.querySelector('.tags').innerText);
  this.textContent = '복사됨!'; setTimeout(() => this.textContent = '내용 복사', 2000);
">내용 복사</button>
<br><br>
<a href="https://blog.naver.com/PostWriteForm.naver" target="_blank"
   style="padding:10px 20px;background:#1EC800;color:white;border-radius:6px;text-decoration:none;font-size:14px">
  네이버 블로그 글쓰기 열기
</a>
</body></html>"""

    out_path = OUTPUT_DIR / f"blog_{ts}.html"
    out_path.write_text(html, encoding="utf-8")
    print(f"  블로그 초안 저장: {out_path.name}")

    # 브라우저에서 자동으로 열기
    try:
        subprocess.Popen(["start", str(out_path)], shell=True)
        print("  브라우저에서 초안 열기...")
    except Exception:
        pass

    return str(out_path)


def search_place_reviews(keyword: str = "단소상회") -> list[dict]:
    """
    네이버 검색 API로 플레이스/블로그 리뷰 검색
    (네이버 Developer API — 무료 하루 25,000건)
    """
    client_id     = os.environ.get("NAVER_CLIENT_ID", "")
    client_secret = os.environ.get("NAVER_CLIENT_SECRET", "")

    if not client_id:
        print("  NAVER_CLIENT_ID 없음 — 건너뜀")
        return []

    import httpx
    r = httpx.get(
        "https://openapi.naver.com/v1/search/blog.json",
        headers={"X-Naver-Client-Id": client_id, "X-Naver-Client-Secret": client_secret},
        params={"query": keyword, "display": 10, "sort": "date"},
        timeout=10,
    )
    items = r.json().get("items", [])
    return [{"title": i["title"], "link": i["link"], "date": i["postdate"],
             "desc": i["description"]} for i in items]


def monitor_place() -> str:
    """네이버 플레이스 최신 블로그 언급 모니터링 (텔레그램 리포트용)"""
    reviews = search_place_reviews("단소상회 포항")
    if not reviews:
        return "네이버 모니터링: 설정 필요 (NAVER_CLIENT_ID)"

    lines = ["🔍 <b>네이버 최신 언급</b>", "━━━━━━━━━━━━━━"]
    for r in reviews[:5]:
        title = r["title"].replace("<b>", "").replace("</b>", "")[:30]
        lines.append(f"  · {title} ({r['date']})")
    return "\n".join(lines)


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    title = "포항 한우 맛집 단소상회 — 1++(9) 특상한우 직화구이"
    content = """포항에서 한우 맛집을 찾고 계신다면 단소상회를 추천드립니다.

포항 이동에 위치한 단소상회는 1++(9) 특상한우만을 취급하는 한우 전문점입니다.
참숯 직화구이 방식으로, 숯불에서만 나오는 특유의 향과 풍미를 느끼실 수 있습니다.

★ 주요 특징
- 전 부위 1++(9) 특상한우
- 참숯 직화구이
- 콜키지 프리 (양산형 소주·맥주 제외)
- 6~30인 단독룸 운영
- 2층~옥상 150여 대 주차

매일 오후 5시부터 11시까지 연중무휴 운영합니다.
예약은 홈페이지 또는 전화(0507-1443-2080)로 가능합니다."""

    tags = ["포항한우맛집", "포항맛집", "포항이동맛집", "특상한우", "단소상회", "포항소고기", "참숯구이"]
    prepare_blog_post(title, content, tags)
