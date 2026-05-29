import sys, time
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

sys.stdout.reconfigure(encoding="utf-8")

PERMISSIONS = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "pages_show_list",
    "pages_read_engagement",
]

with sync_playwright() as p:
    print("CDP 연결 중...")
    browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    ctx = browser.contexts[0]
    pg = ctx.pages[0] if ctx.pages else ctx.new_page()
    print(f"현재 URL: {pg.url}")

    pg.goto("https://developers.facebook.com/tools/explorer/", timeout=30000, wait_until="networkidle")
    time.sleep(3)
    final_url = pg.url
    print(f"이동 후 URL: {final_url}")

    if "login" in final_url or "loginpage" in final_url:
        print("로그인 필요 — 프로필 세션 없음")
    else:
        print("로그인 상태 OK")

    browser.close()
    print("완료")
