"""
디자인 에이전트 — Playwright (브라우저 렌더링) + Pillow
HTML/CSS 템플릿 → PNG 이벤트 포스터 / 메뉴 카드 자동 생성
추가 설치 없이 무료 (Playwright = 이미 Node에서 사용 가능)
"""

import subprocess
import json
import os
import tempfile
from pathlib import Path
from PIL import Image
from datetime import datetime

ROOT = Path(__file__).parent.parent
TEMPLATES_DIR = ROOT / "assets" / "templates"
OUTPUT_DIR = ROOT / "output" / "designs"

# ─── 브랜드 토큰 ──────────────────────────────────────────────────────────────
COLORS = {
    "charcoal": "#1e1c1a",
    "gold":     "#c9a84c",
    "cream":    "#e8dcc8",
    "ember":    "#d4763b",
}


def render_html_to_png(html: str, width: int, height: int, out_path: str) -> str:
    """Playwright로 HTML을 PNG로 렌더링"""
    tmpdir = Path(tempfile.mkdtemp())
    html_file = tmpdir / "design.html"
    html_file.write_text(html, encoding="utf-8")

    script = f"""
const {{ chromium }} = require('playwright');
(async () => {{
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({{ width: {width}, height: {height} }});
  await page.goto('file:///{html_file.as_posix()}');
  await page.waitForTimeout(500);
  await page.screenshot({{ path: '{Path(out_path).as_posix()}', fullPage: false }});
  await browser.close();
}})();
"""
    js_file = tmpdir / "render.js"
    js_file.write_text(script, encoding="utf-8")

    result = subprocess.run(
        ["node", str(js_file)],
        capture_output=True, text=True, cwd=str(ROOT.parent)
    )

    if result.returncode != 0:
        raise RuntimeError(f"Playwright 렌더링 실패: {result.stderr[:300]}")

    import shutil
    shutil.rmtree(tmpdir, ignore_errors=True)
    return out_path


def make_event_poster(
    title: str,
    body: str,
    date_str: str = "",
    cta: str = "예약 문의: 0507-1443-2080",
    size: str = "square",   # "square" | "story"
) -> str:
    """이벤트 포스터 생성"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    W, H = (1080, 1080) if size == "square" else (1080, 1920)
    font_scale = 1.0 if size == "square" else 1.4

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&family=Noto+Sans+KR:wght@300;400&display=swap" rel="stylesheet">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  width: {W}px; height: {H}px; overflow: hidden;
  background: {COLORS['charcoal']};
  font-family: 'Noto Serif KR', serif;
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  padding: {int(W * 0.08)}px;
  position: relative;
}}
.top-line {{
  position: absolute; top: {int(H * 0.06)}px; left: 50%; transform: translateX(-50%);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: {int(13 * font_scale)}px; letter-spacing: 0.4em;
  color: {COLORS['gold']}; opacity: 0.6; white-space: nowrap;
}}
.divider {{
  width: 40px; height: 1px;
  background: {COLORS['gold']}; opacity: 0.4;
  margin: {int(20 * font_scale)}px auto;
}}
.title {{
  font-size: {int(62 * font_scale)}px; font-weight: 900;
  color: {COLORS['cream']}; text-align: center; line-height: 1.25;
  letter-spacing: -0.01em;
}}
.body {{
  font-family: 'Noto Sans KR', sans-serif;
  font-size: {int(26 * font_scale)}px; font-weight: 300;
  color: {COLORS['cream']}; opacity: 0.55;
  text-align: center; line-height: 1.8; margin-top: {int(24 * font_scale)}px;
}}
.date {{
  font-family: 'Noto Sans KR', sans-serif;
  font-size: {int(20 * font_scale)}px;
  color: {COLORS['gold']}; opacity: 0.7;
  letter-spacing: 0.2em; margin-top: {int(32 * font_scale)}px;
}}
.cta {{
  position: absolute; bottom: {int(H * 0.07)}px; left: 50%; transform: translateX(-50%);
  font-family: 'Noto Sans KR', sans-serif;
  font-size: {int(18 * font_scale)}px;
  color: {COLORS['cream']}; opacity: 0.3;
  letter-spacing: 0.15em; white-space: nowrap;
}}
.corner {{
  position: absolute;
  width: 30px; height: 30px;
  border-color: {COLORS['gold']};
  border-style: solid;
  opacity: 0.25;
}}
.tl {{ top: {int(H*0.04)}px; left: {int(W*0.04)}px; border-width: 1px 0 0 1px; }}
.tr {{ top: {int(H*0.04)}px; right: {int(W*0.04)}px; border-width: 1px 1px 0 0; }}
.bl {{ bottom: {int(H*0.04)}px; left: {int(W*0.04)}px; border-width: 0 0 1px 1px; }}
.br {{ bottom: {int(H*0.04)}px; right: {int(W*0.04)}px; border-width: 0 1px 1px 0; }}
</style></head>
<body>
  <div class="corner tl"></div>
  <div class="corner tr"></div>
  <div class="corner bl"></div>
  <div class="corner br"></div>
  <div class="top-line">단소상회 · DANSO</div>
  <div class="title">{title}</div>
  <div class="divider"></div>
  <div class="body">{body.replace(chr(10), '<br>')}</div>
  {'<div class="date">' + date_str + '</div>' if date_str else ''}
  <div class="cta">{cta}</div>
</body></html>"""

    ts = datetime.now().strftime("%m%d_%H%M")
    out_path = str(OUTPUT_DIR / f"poster_{size}_{ts}.png")
    render_html_to_png(html, W, H, out_path)
    print(f"  ✅ 포스터: {Path(out_path).name}")
    return out_path


def make_menu_card(
    menu_name: str,
    grade: str = "1++(9) 특상한우",
    description: str = "",
) -> str:
    """메뉴 카드 생성 (인스타 1:1)"""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    W = H = 1080

    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;900&family=Noto+Sans+KR:wght@300;400&display=swap" rel="stylesheet">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{
  width: {W}px; height: {H}px;
  background: linear-gradient(145deg, #1e1c1a 0%, #2a2520 100%);
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  font-family: 'Noto Serif KR', serif;
}}
.grade {{
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 18px; letter-spacing: 0.35em;
  color: #c9a84c; opacity: 0.65; margin-bottom: 28px;
}}
.name {{
  font-size: 96px; font-weight: 900;
  color: #e8dcc8; letter-spacing: -0.02em;
  line-height: 1.1;
}}
.line {{
  width: 60px; height: 1px;
  background: #c9a84c; opacity: 0.35;
  margin: 32px auto;
}}
.desc {{
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 22px; font-weight: 300;
  color: #e8dcc8; opacity: 0.45;
  text-align: center; line-height: 1.9; padding: 0 80px;
}}
.watermark {{
  position: absolute; bottom: 48px; right: 52px;
  font-family: 'Noto Sans KR', sans-serif;
  font-size: 15px; letter-spacing: 0.2em;
  color: #c9a84c; opacity: 0.3;
}}
</style></head>
<body>
  <div class="grade">{grade}</div>
  <div class="name">{menu_name}</div>
  <div class="line"></div>
  {'<div class="desc">' + description + '</div>' if description else ''}
  <div class="watermark">단소상회</div>
</body></html>"""

    ts = datetime.now().strftime("%m%d_%H%M")
    out_path = str(OUTPUT_DIR / f"menu_{menu_name}_{ts}.png")
    render_html_to_png(html, W, H, out_path)
    print(f"  ✅ 메뉴카드: {Path(out_path).name}")
    return out_path


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "poster"

    if mode == "poster":
        make_event_poster(
            title=sys.argv[2] if len(sys.argv) > 2 else "어버이날\n특별 코스",
            body="온 가족이 함께하는 특별한 날\n최상급 한우로 차린 단소상회의 정성",
            date_str="2025.05.08",
        )
    elif mode == "menu":
        make_menu_card(
            menu_name=sys.argv[2] if len(sys.argv) > 2 else "갈빗살",
            description="직화 참숯으로 피워올린\n진한 마블링의 결정체",
        )
