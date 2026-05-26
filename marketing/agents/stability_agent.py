"""
Stability AI 에이전트 — 무료 티어 (월 25크레딧)
텍스트 → AI 이미지 생성 / 이미지 업스케일 / 배경 제거
https://platform.stability.ai/ (무료 가입, 신용카드 불필요)
"""

import os
import httpx
import base64
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "output" / "ai_images"

try:
    from config import STABILITY_API_KEY
except ImportError:
    STABILITY_API_KEY = os.environ.get("STABILITY_API_KEY", "")

BASE_URL = "https://api.stability.ai"


def _headers():
    return {
        "Authorization": f"Bearer {STABILITY_API_KEY}",
        "Accept": "application/json",
    }


def generate_image(
    prompt: str,
    negative_prompt: str = "blurry, ugly, watermark, text, logo",
    style: str = "photographic",   # photographic | cinematic | food-photography
    width: int = 1024,
    height: int = 1024,
    out_dir: str | None = None,
) -> str:
    """
    텍스트 → AI 이미지 생성
    모델: Stable Diffusion 3 (무료 티어에서 사용 가능)
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_dir = Path(out_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    r = httpx.post(
        f"{BASE_URL}/v2beta/stable-image/generate/core",
        headers={**_headers(), "Accept": "image/*"},
        data={
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "style_preset": style,
            "output_format": "jpeg",
            "aspect_ratio": "1:1" if width == height else ("9:16" if height > width else "4:5"),
        },
        timeout=60,
    )

    if r.status_code != 200:
        raise RuntimeError(f"Stability AI 오류 {r.status_code}: {r.text[:200]}")

    ts = datetime.now().strftime("%m%d_%H%M%S")
    out_path = out_dir / f"ai_{ts}.jpg"
    out_path.write_bytes(r.content)
    print(f"  AI 이미지 생성: {out_path.name}")
    return str(out_path)


def remove_background(image_path: str, out_dir: str | None = None) -> str:
    """
    이미지 배경 제거 → PNG (투명 배경)
    메뉴 사진에서 고기만 오려내기 등에 활용
    """
    out_dir = Path(out_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(image_path, "rb") as f:
        r = httpx.post(
            f"{BASE_URL}/v2beta/stable-image/edit/remove-background",
            headers={**_headers(), "Accept": "image/*"},
            files={"image": f},
            data={"output_format": "png"},
            timeout=60,
        )

    if r.status_code != 200:
        raise RuntimeError(f"배경 제거 오류 {r.status_code}: {r.text[:200]}")

    stem = Path(image_path).stem
    out_path = out_dir / f"{stem}_nobg.png"
    out_path.write_bytes(r.content)
    print(f"  배경 제거: {out_path.name}")
    return str(out_path)


def upscale(image_path: str, out_dir: str | None = None) -> str:
    """이미지 4x 업스케일 (화질 향상)"""
    out_dir = Path(out_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(image_path, "rb") as f:
        r = httpx.post(
            f"{BASE_URL}/v2beta/stable-image/upscale/fast",
            headers={**_headers(), "Accept": "image/*"},
            files={"image": f},
            data={"output_format": "jpeg"},
            timeout=120,
        )

    if r.status_code != 200:
        raise RuntimeError(f"업스케일 오류 {r.status_code}: {r.text[:200]}")

    stem = Path(image_path).stem
    out_path = out_dir / f"{stem}_4x.jpg"
    out_path.write_bytes(r.content)
    print(f"  업스케일 완료: {out_path.name}")
    return str(out_path)


# ─── 단소상회 특화 프롬프트 ───────────────────────────────────────────────────
PRESETS = {
    "hanwoo_dish": (
        "Premium Korean Hanwoo beef grilled over charcoal, highly marbled wagyu-grade ribeye, "
        "sizzling on iron grill, dark moody restaurant atmosphere, steam rising, "
        "cinematic food photography, shallow depth of field, bokeh background, "
        "warm golden tones, michelin star plating",
        "photographic"
    ),
    "restaurant_interior": (
        "Upscale Korean BBQ restaurant interior, dark charcoal walls, warm ambient lighting, "
        "wooden tables, traditional Korean aesthetic, intimate private dining room, "
        "premium restaurant atmosphere, architectural photography",
        "cinematic"
    ),
    "event_poster_bg": (
        "Abstract dark luxury background, deep charcoal black texture, "
        "subtle gold geometric patterns, premium restaurant brand aesthetic, "
        "minimal and sophisticated, gradient shadows",
        "cinematic"
    ),
}


def generate_preset(preset_name: str, out_dir: str | None = None) -> str:
    """미리 정의된 단소상회 프롬프트로 이미지 생성"""
    if preset_name not in PRESETS:
        raise ValueError(f"알 수 없는 프리셋: {preset_name}. 가능: {list(PRESETS.keys())}")
    prompt, style = PRESETS[preset_name]
    return generate_image(prompt, style=style, out_dir=out_dir)


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if not STABILITY_API_KEY:
        print("STABILITY_API_KEY 없음. config.py에 설정하세요.")
        sys.exit(1)
    preset = sys.argv[1] if len(sys.argv) > 1 else "hanwoo_dish"
    generate_preset(preset)
