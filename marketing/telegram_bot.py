"""
단소상회 텔레그램 마케팅 에이전트

명령어:
  키워드       → 컨텐츠 의도 파악 → AI 이미지 + 인스타 + 스레드 + 네이버 소식
  /review     → 리뷰 답글 생성
  /today      → 오늘 마케팅 체크리스트
  /weekly     → 이번 주 할 것
  /help       → 도움말
  사진+키워드  → 사진 보정 + 멀티플랫폼 카피
"""

import os
import sys
import time
import json
import re
import httpx
import urllib.parse
import logging
from pathlib import Path
from datetime import datetime, date

logging.basicConfig(level=logging.WARNING)
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "agents"))

env_path = ROOT.parent / ".env.local"
if env_path.exists():
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ[k.strip()] = v.strip()

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
if not BOT_TOKEN:
    print("TELEGRAM_BOT_TOKEN 없음 — .env.local 확인")
    sys.exit(1)

BASE = f"https://api.telegram.org/bot{BOT_TOKEN}"
TMP  = ROOT / "output" / "bot_tmp"
TMP.mkdir(parents=True, exist_ok=True)

pending_photos:  dict[str, list] = {}
pending_context: dict[str, dict] = {}


# ─── Telegram 헬퍼 ──────────────────────────────────────────────────────────

def api(method: str, **kwargs) -> dict:
    r = httpx.post(f"{BASE}/{method}", timeout=30, **kwargs)
    return r.json()

def send_text(chat_id: str, text: str, reply_markup: dict | None = None):
    payload = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
    if reply_markup:
        payload["reply_markup"] = json.dumps(reply_markup)
    api("sendMessage", json=payload)

def send_typing(chat_id: str):
    api("sendChatAction", json={"chat_id": chat_id, "action": "typing"})

def send_photo(chat_id: str, path: str, caption: str = ""):
    with open(path, "rb") as f:
        api("sendPhoto",
            data={"chat_id": chat_id, "caption": caption[:1024], "parse_mode": "HTML"},
            files={"photo": f})

def send_media_group(chat_id: str, paths: list[str]):
    if not paths:
        return
    if len(paths) == 1:
        send_photo(chat_id, paths[0])
        return
    files = {}
    media = []
    for i, p in enumerate(paths[:10]):
        key = f"photo{i}"
        files[key] = open(p, "rb")
        media.append({"type": "photo", "media": f"attach://{key}"})
    try:
        api("sendMediaGroup",
            data={"chat_id": chat_id, "media": json.dumps(media)},
            files=files)
    finally:
        for f in files.values():
            f.close()

def get_updates(offset: int) -> list:
    r = httpx.get(f"{BASE}/getUpdates",
                  params={"offset": offset, "timeout": 30},
                  timeout=35)
    return r.json().get("result", [])

def download_tg_photo(file_id: str) -> str:
    res = api("getFile", json={"file_id": file_id})
    file_path = res["result"]["file_path"]
    url = f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file_path}"
    r = httpx.get(url, timeout=30)
    out = TMP / f"{file_id}.jpg"
    out.write_bytes(r.content)
    return str(out)

def inline_buttons(rows: list[list[str]]) -> dict:
    return {
        "inline_keyboard": [
            [{"text": btn, "callback_data": btn} for btn in row]
            for row in rows
        ]
    }


# ─── Claude 헬퍼 ─────────────────────────────────────────────────────────────

def claude_haiku(prompt: str, max_tokens: int = 800) -> str:
    import anthropic
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY 없음")
    client = anthropic.Anthropic(api_key=key)
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text.strip()

def parse_json(text: str) -> dict | list:
    m = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if m:
        text = m.group(1)
    text = text.strip()
    start = text.find("[") if text.lstrip().startswith("[") else text.find("{")
    if start >= 0:
        text = text[start:]
    return json.loads(text)


# ─── 브랜드 정보 ─────────────────────────────────────────────────────────────

BRAND = """
식당: 단소상회 (포항 이동)
주소: 경북 포항시 남구 대이로 159번길 12-8
전화: 0507-1443-2080
영업: 매일 17:00~23:00, 연중무휴
메뉴: 1++(9) 특상한우 참숯 직화구이
특징: 콜키지 프리, 단체룸(6~30인), 150대 주차
인스타: @danso.pohang
"""


# ─── 컨텐츠 생성 흐름 ────────────────────────────────────────────────────────

def generate_questions(keyword: str) -> list[dict]:
    prompt = f"""너는 한우 BBQ 레스토랑 인스타그램 마케터야.
{BRAND}
사장님이 키워드 "{keyword}"를 보냈어.

이 키워드로 어떤 인스타그램 컨텐츠를 만들고 싶은지 파악하기 위한
핵심 질문 2개를 만들어줘. 키워드의 맥락과 의도를 파악하는 데 집중해.

반드시 JSON 배열만 출력:
[
  {{"question": "질문1?", "options": ["옵션A", "옵션B", "옵션C"]}},
  {{"question": "질문2?", "options": ["옵션A", "옵션B", "옵션C"]}}
]"""
    return parse_json(claude_haiku(prompt))


def synthesize_prompts(keyword: str, qa_pairs: list[dict]) -> dict:
    qa_text = "\n".join(f"Q: {qa['question']}\nA: {qa['answer']}" for qa in qa_pairs)
    prompt = f"""너는 한우 BBQ 레스토랑 마케팅 전문가야.
{BRAND}

키워드: {keyword}
사장님 답변:
{qa_text}

두 가지를 만들어줘:
1. image_prompt: Pollinations.ai용 영어 이미지 생성 프롬프트 (상세하게, "no text no watermark" 포함)
2. copy_context: 카피 작성 방향 한국어 (어떤 감성/메시지를 담을지, 100자 이내)

JSON만 출력:
{{"image_prompt": "...", "copy_context": "..."}}"""
    return parse_json(claude_haiku(prompt))


def start_flow(chat_id: str, keyword: str):
    send_typing(chat_id)
    try:
        questions = generate_questions(keyword)
    except Exception as e:
        send_text(chat_id, f"❌ 질문 생성 실패: {e}")
        return

    pending_context[chat_id] = {
        "type": "content",
        "keyword": keyword,
        "questions": questions,
        "step": 0,
        "qa_pairs": [],
    }
    send_text(chat_id, f"✅ <b>{keyword}</b> 소재 잡았어요!\n어떤 컨텐츠인지 2가지만 알려주세요.")
    ask_step(chat_id)


def ask_step(chat_id: str):
    ctx = pending_context[chat_id]
    step = ctx["step"]
    q = ctx["questions"][step]
    opts = q["options"]
    rows = [opts[:2], opts[2:]] if len(opts) > 2 else [opts]
    send_text(chat_id,
        f"<b>Q{step+1}.</b> {q['question']}\n\n직접 입력도 가능해요 ✏️",
        reply_markup=inline_buttons(rows))


def collect_answer(chat_id: str, answer: str):
    ctx = pending_context[chat_id]
    step = ctx["step"]
    ctx["qa_pairs"].append({
        "question": ctx["questions"][step]["question"],
        "answer": answer,
    })
    ctx["step"] += 1
    if ctx["step"] < len(ctx["questions"]):
        ask_step(chat_id)
    else:
        ctx_copy = dict(ctx)
        del pending_context[chat_id]
        generate_and_send(chat_id, ctx_copy)


# ─── 생성 & 전송 ─────────────────────────────────────────────────────────────

def generate_ai_image(image_prompt: str, out_dir: str) -> str:
    encoded = urllib.parse.quote(image_prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=1024&nologo=true"
    r = httpx.get(url, timeout=90, follow_redirects=True)
    if r.status_code != 200:
        raise RuntimeError(f"Pollinations 오류 {r.status_code}")
    ts = datetime.now().strftime("%m%d_%H%M%S")
    out_path = Path(out_dir) / f"ai_{ts}.jpg"
    out_path.write_bytes(r.content)
    return str(out_path)


def generate_and_send(chat_id: str, ctx: dict):
    keyword  = ctx["keyword"]
    qa_pairs = ctx["qa_pairs"]

    send_typing(chat_id)
    send_text(chat_id, "⏳ 이미지 + 멀티플랫폼 카피 생성 중...")

    try:
        synth = synthesize_prompts(keyword, qa_pairs)
        image_prompt = synth.get("image_prompt", "")
        copy_context = synth.get("copy_context", "")
    except Exception as e:
        send_text(chat_id, f"❌ 프롬프트 합성 실패: {e}")
        return

    # 이미지 생성
    try:
        import image_agent
        ai_path = generate_ai_image(image_prompt, out_dir=str(TMP))
        results = image_agent.process(
            src=ai_path,
            title=keyword[:15],
            subtitle="단소상회 · 포항 이동",
            formats=["square"],
            enhance=False,
            watermark=True,
            out_dir=str(TMP),
        )
        send_photo(chat_id, results.get("square", ai_path))
    except Exception as e:
        send_text(chat_id, f"❌ 이미지 생성 실패: {e}")

    # 멀티플랫폼 카피 생성
    try:
        from copy_agent import generate
        results = generate(
            keyword,
            platforms=["instagram", "threads", "naver_post"],
            extra_context=copy_context
        )

        if ig := results.get("instagram"):
            send_text(chat_id, f"📸 <b>인스타그램</b>\n\n{ig}")

        if th := results.get("threads"):
            send_text(chat_id, f"🧵 <b>스레드</b>\n\n{th}")

        if np := results.get("naver_post"):
            send_text(chat_id, f"🟢 <b>네이버 소식</b>\n\n{np}")

    except Exception as e:
        send_text(chat_id, f"✍️ 카피 생성 실패 (크레딧 확인): {e}")


def process_photos(chat_id: str, photo_paths: list[str], keyword: str):
    import image_agent

    send_typing(chat_id)
    processed = []
    for i, src in enumerate(photo_paths[:4]):
        try:
            results = image_agent.process(
                src=src,
                title=keyword[:15] if i == 0 else "",
                subtitle="단소상회 · 포항 이동" if i == 0 else "",
                formats=["square"],
                enhance=True,
                watermark=True,
                out_dir=str(TMP),
            )
            if results.get("square"):
                processed.append(results["square"])
        except Exception as e:
            print(f"이미지 가공 오류: {e}", flush=True)

    if processed:
        send_media_group(chat_id, processed)

    try:
        from copy_agent import generate
        results = generate(keyword, platforms=["instagram", "threads", "naver_post"])
        if ig := results.get("instagram"):
            send_text(chat_id, f"📸 <b>인스타그램</b>\n\n{ig}")
        if th := results.get("threads"):
            send_text(chat_id, f"🧵 <b>스레드</b>\n\n{th}")
        if np := results.get("naver_post"):
            send_text(chat_id, f"🟢 <b>네이버 소식</b>\n\n{np}")
    except Exception as e:
        send_text(chat_id, f"✍️ 카피 생성 실패: {e}")


# ─── 리뷰 답글 ───────────────────────────────────────────────────────────────

def handle_review(chat_id: str, review_text: str):
    if not review_text:
        send_text(chat_id,
            "📝 리뷰 내용을 함께 보내주세요.\n\n"
            "예) <code>/review 고기가 너무 맛있었어요! 다음에 또 올게요</code>")
        return

    send_typing(chat_id)
    send_text(chat_id, "⏳ 답글 작성 중...")
    try:
        from copy_agent import generate
        results = generate(review_text, platforms=["review_reply"],
                           extra_context=f"손님 리뷰: {review_text}")
        reply = results.get("review_reply", "")
        send_text(chat_id, f"💬 <b>리뷰 답글 초안</b>\n\n{reply}")
    except Exception as e:
        send_text(chat_id, f"❌ 오류: {e}")


# ─── 일일/주간 체크리스트 ────────────────────────────────────────────────────

def handle_today(chat_id: str):
    today = date.today()
    weekday = today.weekday()  # 0=월, 6=일
    day_name = ["월", "화", "수", "목", "금", "토", "일"][weekday]

    msg = (
        f"📋 <b>오늘({day_name}요일) 마케팅 체크리스트</b>\n"
        f"━━━━━━━━━━━━━━\n\n"
        f"<b>📱 매일 필수 (15~40분)</b>\n"
        f"☐ 인스타그램 피드/릴스 1개 업로드\n"
        f"☐ 스레드 2~3개 업로드\n"
        f"☐ 네이버·카카오 소식 1개 업로드\n"
        f"☐ 새 리뷰 확인 + 답글 작성\n"
        f"☐ 손님에게 리뷰 요청 (3~10회)\n\n"
    )

    if weekday in (0, 3):  # 월·목 → 사진 업데이트
        msg += (
            f"<b>📸 이번 주 (오늘 하기 좋은 날)</b>\n"
            f"☐ 매장/메뉴/고기 사진 10장 이상 추가\n"
            f"☐ 네이버 플레이스 소식 2~3개 추가\n\n"
        )

    msg += (
        f"<b>💡 오늘 컨텐츠 소재 아이디어</b>\n"
        f"• 오늘 입고된 부위 소개\n"
        f"• 단골 손님 후기\n"
        f"• 주방/불판 비하인드\n\n"
        f"키워드 보내면 바로 이미지+카피 만들어드려요 🔥"
    )
    send_text(chat_id, msg)


def handle_weekly(chat_id: str):
    msg = (
        f"📅 <b>이번 주 마케팅 플랜</b>\n"
        f"━━━━━━━━━━━━━━\n\n"
        f"<b>🟢 네이버 플레이스</b>\n"
        f"☐ 소식 2~3개 추가\n"
        f"☐ 리뷰 확인/답글 관리\n\n"
        f"<b>🗺 구글맵</b>\n"
        f"☐ 사진 업로드\n"
        f"☐ 리뷰 답글 관리\n\n"
        f"<b>🌐 웹사이트/블로그</b>\n"
        f"☐ 내용 1개 업데이트 (후기·메뉴·공지)\n\n"
        f"<b>✍️ 콘텐츠 제작</b>\n"
        f"☐ 블로그 or SEO글 1개\n"
        f"  주제 예시: 포항 한우 맛집 / 1++(9) 한우 이야기\n\n"
        f"<b>📊 이달 KPI 현황</b>\n"
        f"• 네이버 리뷰 목표: +30개\n"
        f"• 구글 리뷰 목표: +10개\n"
        f"• 인스타 목표: 20~30개\n"
        f"• 스레드 목표: 60개+\n"
        f"• 소식 목표: 12개+\n\n"
        f"오늘 할 일은 /today 로 확인하세요 💪"
    )
    send_text(chat_id, msg)


# ─── 메시지 핸들러 ───────────────────────────────────────────────────────────

def handle(upd: dict):
    if "callback_query" in upd:
        cb = upd["callback_query"]
        chat_id = str(cb["message"]["chat"]["id"])
        answer  = cb.get("data", "")
        api("answerCallbackQuery", json={"callback_query_id": cb["id"]})
        if chat_id in pending_context:
            collect_answer(chat_id, answer)
        return

    msg = upd.get("message", {})
    chat_id = str(msg.get("chat", {}).get("id", ""))
    if not chat_id:
        return

    text   = (msg.get("text") or msg.get("caption") or "").strip()
    photos = msg.get("photo", [])
    album  = msg.get("media_group_id")

    # 사진 처리
    if photos:
        best = max(photos, key=lambda p: p.get("width", 0))
        path = download_tg_photo(best["file_id"])
        if album:
            if chat_id not in pending_photos:
                pending_photos[chat_id] = []
            pending_photos[chat_id].append(path)
            if len(pending_photos[chat_id]) == 1:
                if text:
                    paths = pending_photos.pop(chat_id)
                    process_photos(chat_id, paths + [path], text)
                else:
                    send_text(chat_id, "📸 사진 수집 중... 키워드를 입력해주세요.")
        else:
            process_photos(chat_id, [path], text or "단소상회 특선")
        return

    if not text:
        return

    # 명령어 처리
    if text.startswith("/help") or text.startswith("/start"):
        send_text(chat_id,
            "🥩 <b>단소상회 마케팅 에이전트</b>\n"
            "━━━━━━━━━━━━━━\n\n"
            "<b>컨텐츠 생성</b>\n"
            "• 키워드 입력 → AI 이미지 + 인스타 + 스레드 + 네이버 소식\n"
            "• 사진 전송 → 보정 + 멀티플랫폼 카피\n\n"
            "<b>명령어</b>\n"
            "• <code>/today</code> → 오늘 마케팅 체크리스트\n"
            "• <code>/weekly</code> → 이번 주 플랜\n\n"
            "<b>예시 키워드</b>\n"
            "<code>오늘 갈빗살 입고</code>\n"
            "<code>어버이날 단체 예약</code>\n"
            "<code>주말 특선</code>")
        return

    if text.startswith("/today") or text == "오늘":
        handle_today(chat_id)
        return

    if text.startswith("/weekly") or text == "이번주":
        handle_weekly(chat_id)
        return


    # 대기 중인 사진
    if chat_id in pending_photos and pending_photos[chat_id]:
        paths = pending_photos.pop(chat_id)
        process_photos(chat_id, paths, text)
        return

    # 대화 흐름 진행 중
    if chat_id in pending_context:
        collect_answer(chat_id, text)
        return

    # 새 키워드 → 컨텐츠 생성 시작
    start_flow(chat_id, text)


# ─── 메인 루프 ──────────────────────────────────────────────────────────────

def main():
    me = httpx.get(f"{BASE}/getMe", timeout=5).json()
    username = me.get("result", {}).get("username", "unknown")
    print(f"[{datetime.now().strftime('%H:%M')}] 봇 시작: @{username}", flush=True)

    offset = 0
    while True:
        try:
            updates = get_updates(offset)
            for upd in updates:
                offset = upd["update_id"] + 1
                try:
                    handle(upd)
                except Exception as e:
                    print(f"처리 오류: {e}", flush=True)
        except KeyboardInterrupt:
            print("\n봇 종료")
            break
        except Exception as e:
            print(f"루프 오류: {e}", flush=True)
            time.sleep(5)


if __name__ == "__main__":
    main()
