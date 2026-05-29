"""
Playwright로 Chrome을 자동 제어하여 Instagram 토큰 발급
기존 Chrome 프로필(세션/쿠키)을 그대로 사용 → Facebook 재로그인 불필요

실행 방법:
  python marketing/auto_instagram_token.py
"""

import sys
import time
import subprocess
import os
from pathlib import Path

ROOT      = Path(__file__).parent
ENV_PATH  = ROOT.parent / ".env.local"
CHROME    = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE   = r"C:\Users\user\AppData\Local\Google\Chrome\User Data"
CDP_PORT  = 9222

PERMISSIONS = [
    "instagram_basic",
    "instagram_content_publish",
    "instagram_manage_insights",
    "instagram_manage_comments",
    "pages_show_list",
    "pages_read_engagement",
]


def kill_chrome():
    os.system("taskkill /F /IM chrome.exe /T > nul 2>&1")
    time.sleep(2)
    print("기존 Chrome 종료 완료")


def launch_chrome_with_cdp():
    cmd = [
        CHROME,
        f"--remote-debugging-port={CDP_PORT}",
        f"--user-data-dir={PROFILE}",
        "--no-first-run",
        "--no-default-browser-check",
        "https://developers.facebook.com/tools/explorer/",
    ]
    subprocess.Popen(cmd)
    print("Chrome 재시작 (원격 디버깅 포트 활성화)...")
    time.sleep(4)


def run():
    sys.stdout.reconfigure(encoding="utf-8")

    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    print("=" * 60)
    print("Instagram 토큰 자동 발급 스크립트 (Playwright)")
    print("=" * 60)

    # ── Chrome 재시작 ────────────────────────────────────────
    print("\n[1/5] Chrome 재시작 (기존 세션 유지)...")
    kill_chrome()
    launch_chrome_with_cdp()

    with sync_playwright() as p:
        # ── CDP로 기존 Chrome 연결 ───────────────────────────
        print("[2/5] Playwright → Chrome CDP 연결...")
        try:
            browser = p.chromium.connect_over_cdp(f"http://127.0.0.1:{CDP_PORT}")
        except Exception as e:
            print(f"CDP 연결 실패: {e}")
            print("Chrome이 제대로 열렸는지 확인하고 다시 시도하세요.")
            return

        context = browser.contexts[0]
        pages   = context.pages
        page    = pages[0] if pages else context.new_page()

        # ── 그래프 API 탐색기로 이동 ─────────────────────────
        print("[3/5] 그래프 API 탐색기 이동...")
        page.goto("https://developers.facebook.com/tools/explorer/", timeout=30000)
        page.wait_for_load_state("networkidle", timeout=20000)
        time.sleep(2)

        # ── chowonfnb 앱 선택 확인 ───────────────────────────
        print("       앱 선택 확인...")
        try:
            # 앱 드롭다운에서 chowonfnb 찾기
            app_dropdown = page.locator("text=chowonfnb").first
            if not app_dropdown.is_visible(timeout=5000):
                # 드롭다운 열기
                page.locator("[class*='_app']").first.click()
                time.sleep(1)
                page.locator("text=chowonfnb").click()
                time.sleep(1)
            print("       ✅ chowonfnb 앱 선택됨")
        except PWTimeout:
            print("       ⚠️  앱 드롭다운 자동 선택 실패 → 수동으로 chowonfnb 선택 필요")

        # ── 권한 추가 ────────────────────────────────────────
        print("[4/5] 권한 추가 중...")
        for perm in PERMISSIONS:
            try:
                # "권한 추가" 드롭다운 클릭
                add_btn = page.get_by_role("combobox").filter(has_text="권한 추가").first
                if not add_btn.is_visible(timeout=3000):
                    # 대체 선택자
                    add_btn = page.locator("text=권한 추가").first
                add_btn.click()
                time.sleep(0.5)

                # 권한 검색 입력
                page.keyboard.type(perm, delay=50)
                time.sleep(0.8)

                # 드롭다운에서 해당 권한 클릭
                option = page.locator(f"text={perm}").first
                option.wait_for(timeout=3000)
                option.click()
                time.sleep(0.5)
                print(f"       ✅ {perm}")
            except PWTimeout:
                print(f"       ⚠️  {perm} 추가 실패 (이미 추가됐거나 UI 변경)")
            except Exception as ex:
                print(f"       ⚠️  {perm}: {ex}")

        time.sleep(1)

        # ── Generate Access Token ────────────────────────────
        print("[5/5] Generate Access Token 클릭...")
        try:
            gen_btn = page.get_by_role("button", name="Generate Access Token")
            if not gen_btn.is_visible(timeout=5000):
                gen_btn = page.locator("text=Generate Access Token").first

            # 팝업 처리
            with page.expect_popup(timeout=15000) as popup_info:
                gen_btn.click()

            popup = popup_info.value
            popup.wait_for_load_state("networkidle", timeout=20000)
            print("       팝업 열림 → 자동 승인 시도...")
            time.sleep(2)

            # Facebook OAuth 팝업에서 "Continue" 또는 "확인" 클릭
            for btn_text in ["계속", "Continue", "확인", "OK", "__CONFIRM__"]:
                try:
                    btn = popup.get_by_role("button", name=btn_text)
                    if btn.is_visible(timeout=2000):
                        btn.click()
                        print(f"       ✅ 팝업 '{btn_text}' 클릭")
                        time.sleep(2)
                        break
                except Exception:
                    pass

            popup.wait_for_load_state("networkidle", timeout=10000)
            time.sleep(2)

        except PWTimeout:
            print("       ⚠️  팝업 시간 초과 → 수동으로 팝업 확인 후 Enter 눌러주세요")
            input("       팝업 처리 완료 후 Enter ▶ ")
        except Exception as ex:
            print(f"       ⚠️  팝업 오류: {ex}")

        # ── 토큰 추출 ────────────────────────────────────────
        time.sleep(2)
        print("\n토큰 추출 중...")
        token = ""
        try:
            # 액세스 토큰 입력 필드 찾기
            token_input = page.locator("input[placeholder*='토큰'], input[placeholder*='token'], input[placeholder*='Token']").first
            if not token_input.is_visible(timeout=5000):
                # 다른 선택자 시도
                token_input = page.locator("[aria-label*='token'], [aria-label*='토큰']").first

            token = token_input.input_value(timeout=5000)
        except Exception:
            # JavaScript로 토큰 추출 시도
            try:
                token = page.evaluate("""
                    () => {
                        const inputs = document.querySelectorAll('input');
                        for (const inp of inputs) {
                            if (inp.value && inp.value.length > 50) return inp.value;
                        }
                        return '';
                    }
                """)
            except Exception as e:
                print(f"토큰 추출 실패: {e}")

        if not token or len(token) < 20:
            print("\n⚠️  자동 토큰 추출 실패")
            print("Chrome에서 액세스 토큰 필드의 토큰을 복사해서 붙여넣으세요:")
            token = input("토큰 붙여넣기: ").strip()

        if not token:
            print("토큰 없음 → 종료")
            return

        print(f"\n✅ 토큰 획득: {token[:20]}...({len(token)}자)")

        # ── Instagram Business ID 조회 ───────────────────────
        import httpx
        print("\nInstagram Business ID 조회 중...")
        ig_id = ""

        # 연결된 Facebook 페이지 조회
        r = httpx.get(
            "https://graph.facebook.com/v21.0/me/accounts",
            params={"access_token": token},
            timeout=15,
        )
        pages_data = r.json().get("data", [])

        if pages_data:
            page_id    = pages_data[0]["id"]
            page_token = pages_data[0]["access_token"]
            page_name  = pages_data[0].get("name", "")
            print(f"Facebook 페이지: {page_name} (ID: {page_id})")

            r2 = httpx.get(
                f"https://graph.facebook.com/v21.0/{page_id}",
                params={"fields": "instagram_business_account", "access_token": page_token},
                timeout=15,
            )
            ig_data = r2.json().get("instagram_business_account", {})
            ig_id   = ig_data.get("id", "")

            if ig_id:
                r3 = httpx.get(
                    f"https://graph.facebook.com/v21.0/{ig_id}",
                    params={"fields": "name,username,followers_count", "access_token": token},
                    timeout=15,
                )
                ig_info = r3.json()
                print(f"✅ Instagram: @{ig_info.get('username','')} — {ig_info.get('followers_count',0)} 팔로워")
        else:
            print("⚠️  Facebook 페이지 없음 (pages_show_list 권한 확인 필요)")

        # ── .env.local 저장 ──────────────────────────────────
        print("\n.env.local 업데이트 중...")
        env_lines = []
        if ENV_PATH.exists():
            env_lines = ENV_PATH.read_text(encoding="utf-8").splitlines()

        def upsert(lines, key, value):
            for i, line in enumerate(lines):
                if line.startswith(f"{key}="):
                    lines[i] = f"{key}={value}"
                    return
            lines.append(f"{key}={value}")

        upsert(env_lines, "INSTAGRAM_ACCESS_TOKEN", token)
        if ig_id:
            upsert(env_lines, "INSTAGRAM_BUSINESS_ID", ig_id)

        ENV_PATH.write_text("\n".join(env_lines) + "\n", encoding="utf-8")
        print("✅ .env.local 저장 완료")

        # ── 결과 출력 ────────────────────────────────────────
        print("\n" + "=" * 60)
        print("GitHub Secrets에 아래 값을 추가하세요:")
        print("=" * 60)
        print(f"INSTAGRAM_ACCESS_TOKEN = {token}")
        if ig_id:
            print(f"INSTAGRAM_BUSINESS_ID  = {ig_id}")
        print("=" * 60)

        browser.close()
        print("\n✅ 완료!")


if __name__ == "__main__":
    run()
