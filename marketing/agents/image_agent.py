"""
이미지 에이전트 — Pillow + OpenCV
사진 1장 → 인스타/스토리/릴스 포맷 3종 자동 생성
텍스트 오버레이, 색보정, 로고 워터마크
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from pathlib import Path
import os

# ─── 경로 설정 ────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
FONTS_DIR = ROOT / "assets" / "fonts"
OUTPUT_DIR = ROOT / "output"
FONT_KO = "C:/Windows/Fonts/malgunbd.ttf"   # 맑은 고딕 Bold
FONT_KO_LIGHT = "C:/Windows/Fonts/malgun.ttf"

# ─── 포맷 정의 ────────────────────────────────────────────────────────────────
FORMATS = {
    "square":  (1080, 1080),   # 인스타 피드 1:1
    "portrait": (1080, 1350),  # 인스타 피드 4:5
    "story":   (1080, 1920),   # 스토리/릴스 9:16
}

# ─── 브랜드 색상 ──────────────────────────────────────────────────────────────
CHARCOAL = (30, 28, 26)       # #1e1c1a
GOLD     = (201, 168, 76)     # #c9a84c
CREAM    = (232, 220, 200)    # #e8dcc8


def load_image(path: str) -> Image.Image:
    """이미지 로드 (EXIF 회전 보정)"""
    img = Image.open(path)
    try:
        from PIL import ExifTags
        exif = img._getexif()
        if exif:
            for tag, val in exif.items():
                if ExifTags.TAGS.get(tag) == "Orientation":
                    rotations = {3: 180, 6: 270, 8: 90}
                    if val in rotations:
                        img = img.rotate(rotations[val], expand=True)
    except Exception:
        pass
    return img.convert("RGB")


def smart_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """비율 유지하며 중앙 스마트 크롭"""
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    tgt_ratio = target_w / target_h

    if src_ratio > tgt_ratio:
        # 좌우 자르기
        new_w = int(src_h * tgt_ratio)
        left = (src_w - new_w) // 2
        img = img.crop((left, 0, left + new_w, src_h))
    else:
        # 상하 자르기 — 음식은 위쪽이 더 중요하므로 약간 위로
        new_h = int(src_w / tgt_ratio)
        top = int((src_h - new_h) * 0.35)
        img = img.crop((0, top, src_w, top + new_h))

    return img.resize((target_w, target_h), Image.LANCZOS)


def enhance_food_photo(img: Image.Image) -> Image.Image:
    """음식 사진 최적화: 밝기/대비/채도/선명도"""
    # OpenCV로 CLAHE (적응형 히스토그램 균등화) 적용
    arr = np.array(img)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    img = Image.fromarray(enhanced)

    # Pillow 후처리
    img = ImageEnhance.Brightness(img).enhance(1.05)
    img = ImageEnhance.Contrast(img).enhance(1.12)
    img = ImageEnhance.Color(img).enhance(1.15)      # 채도
    img = ImageEnhance.Sharpness(img).enhance(1.3)   # 선명도
    return img


def add_text_overlay(
    img: Image.Image,
    title: str = "",
    subtitle: str = "",
    position: str = "bottom",  # "top" | "bottom" | "center"
) -> Image.Image:
    """텍스트 오버레이 (그라디언트 배경 포함)"""
    W, H = img.size
    draw = ImageDraw.Draw(img)

    if not title and not subtitle:
        return img

    # 그라디언트 오버레이 (하단)
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ov_draw = ImageDraw.Draw(overlay)

    if position == "bottom":
        grad_h = int(H * 0.35)
        for i in range(grad_h):
            alpha = int(200 * (i / grad_h))
            ov_draw.line([(0, H - grad_h + i), (W, H - grad_h + i)],
                         fill=(*CHARCOAL, alpha))
    elif position == "top":
        grad_h = int(H * 0.25)
        for i in range(grad_h):
            alpha = int(180 * (1 - i / grad_h))
            ov_draw.line([(0, i), (W, i)], fill=(*CHARCOAL, alpha))

    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    # 폰트 크기 (이미지 크기 비례)
    title_size = max(36, W // 18)
    sub_size   = max(24, W // 28)

    try:
        font_title = ImageFont.truetype(FONT_KO, title_size)
        font_sub   = ImageFont.truetype(FONT_KO_LIGHT, sub_size)
    except Exception:
        font_title = ImageFont.load_default()
        font_sub   = font_title

    pad = int(W * 0.06)

    if position == "bottom":
        y_title = H - int(H * 0.18)
        y_sub   = H - int(H * 0.09)
    elif position == "top":
        y_title = int(H * 0.04)
        y_sub   = int(H * 0.10)
    else:
        y_title = H // 2 - title_size
        y_sub   = H // 2 + 10

    if title:
        # 그림자
        draw.text((pad + 2, y_title + 2), title, font=font_title, fill=(0, 0, 0, 180))
        draw.text((pad, y_title), title, font=font_title, fill=CREAM)

    if subtitle:
        draw.text((pad + 1, y_sub + 1), subtitle, font=font_sub, fill=(0, 0, 0, 140))
        draw.text((pad, y_sub), subtitle, font=font_sub, fill=(*GOLD, 255))

    return img


def add_watermark(img: Image.Image, text: str = "단소상회") -> Image.Image:
    """우하단 워터마크"""
    W, H = img.size
    draw = ImageDraw.Draw(img)
    size = max(18, W // 45)
    try:
        font = ImageFont.truetype(FONT_KO_LIGHT, size)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    x = W - tw - int(W * 0.04)
    y = H - size - int(H * 0.03)

    draw.text((x + 1, y + 1), text, font=font, fill=(0, 0, 0, 100))
    draw.text((x, y), text, font=font, fill=(*GOLD, 160))
    return img


def process(
    src: str,
    title: str = "",
    subtitle: str = "",
    formats: list[str] | None = None,
    enhance: bool = True,
    watermark: bool = True,
    out_dir: str | None = None,
) -> dict[str, str]:
    """
    메인 함수.
    반환값: {"square": "/path/to/square.jpg", "portrait": ..., "story": ...}
    """
    out_dir = Path(out_dir or OUTPUT_DIR / "images")
    out_dir.mkdir(parents=True, exist_ok=True)

    formats = formats or list(FORMATS.keys())
    src_name = Path(src).stem
    results = {}

    img_orig = load_image(src)

    for fmt in formats:
        if fmt not in FORMATS:
            continue
        W, H = FORMATS[fmt]
        img = smart_crop(img_orig.copy(), W, H)

        if enhance:
            img = enhance_food_photo(img)

        if title or subtitle:
            img = add_text_overlay(img, title=title, subtitle=subtitle)

        if watermark:
            img = add_watermark(img)

        out_path = out_dir / f"{src_name}_{fmt}.jpg"
        img.save(str(out_path), "JPEG", quality=92, optimize=True)
        results[fmt] = str(out_path)
        print(f"  ✅ {fmt}: {out_path.name}")

    return results


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python image_agent.py <이미지경로> [제목] [부제목]")
        sys.exit(1)

    src   = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else ""
    sub   = sys.argv[3] if len(sys.argv) > 3 else "단소상회 · 포항 이동"

    print(f"\n🖼  이미지 에이전트 시작: {src}")
    results = process(src, title=title, subtitle=sub)
    print(f"\n완료: {len(results)}개 포맷 생성")
    for k, v in results.items():
        print(f"  {k}: {v}")
