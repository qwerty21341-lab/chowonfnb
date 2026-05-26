"""
영상 에이전트 — FFmpeg (GPU 가속) + MoviePy
이미지 여러 장 → 릴스/쇼츠 슬라이드쇼 영상 자동 생성
자막, 배경음악, 트랜지션 포함
"""

import subprocess
import json
import os
import tempfile
import shutil
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "output" / "videos"
MUSIC_DIR  = ROOT / "assets" / "music"
FONT_KO    = "C:/Windows/Fonts/malgunbd.ttf"

# ─── 릴스 스펙 ───────────────────────────────────────────────────────────────
REELS_W, REELS_H = 1080, 1920   # 9:16
SLIDE_DURATION   = 3.0           # 장당 초
FADE_DURATION    = 0.4           # 페이드 초
MAX_DURATION     = 30.0          # 최대 30초 (릴스 권장)


def has_nvidia() -> bool:
    """NVIDIA GPU 사용 가능 여부"""
    result = subprocess.run(
        ["ffmpeg", "-hide_banner", "-encoders"],
        capture_output=True, text=True
    )
    return "h264_nvenc" in result.stdout


def build_slideshow(
    images: list[str],
    output_path: str,
    title: str = "",
    subtitle: str = "단소상회 · 포항 이동",
    music_path: str | None = None,
    duration_per_slide: float = SLIDE_DURATION,
) -> str:
    """
    이미지 리스트 → MP4 릴스 영상
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    tmpdir = Path(tempfile.mkdtemp())
    use_gpu = has_nvidia()
    encoder = "h264_nvenc" if use_gpu else "libx264"
    print(f"  GPU 인코딩: {'ON (NVENC)' if use_gpu else 'OFF (CPU)'}")

    # 1) 이미지 → 릴스 비율 변환
    prepared = []
    for i, img_path in enumerate(images):
        out_img = tmpdir / f"slide_{i:03d}.jpg"
        subprocess.run([
            "ffmpeg", "-y", "-i", img_path,
            "-vf", (
                f"scale={REELS_W}:{REELS_H}:force_original_aspect_ratio=increase,"
                f"crop={REELS_W}:{REELS_H},"
                f"format=yuv420p"
            ),
            str(out_img)
        ], capture_output=True)
        prepared.append(str(out_img))
        print(f"  준비: {Path(img_path).name} → slide_{i:03d}.jpg")

    # 2) concat 파일 생성
    concat_file = tmpdir / "concat.txt"
    with open(concat_file, "w") as f:
        for p in prepared:
            f.write(f"file '{p}'\n")
            f.write(f"duration {duration_per_slide}\n")
        # 마지막 프레임 반복 방지
        f.write(f"file '{prepared[-1]}'\n")

    total_duration = len(images) * duration_per_slide
    if total_duration > MAX_DURATION:
        total_duration = MAX_DURATION

    # 3) 슬라이드쇼 + 크로스페이드 필터
    n = len(prepared)
    fade_filter = _build_xfade_filter(n, duration_per_slide, FADE_DURATION)

    raw_video = tmpdir / "raw.mp4"

    if n == 1:
        # 단일 이미지: 줌인 효과
        subprocess.run([
            "ffmpeg", "-y",
            "-loop", "1", "-i", prepared[0],
            "-vf", (
                f"zoompan=z='min(zoom+0.0015,1.5)':d={int(duration_per_slide*30)}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"s={REELS_W}x{REELS_H},format=yuv420p"
            ),
            "-t", str(total_duration),
            "-c:v", encoder,
            *(["-preset", "p4", "-rc", "vbr", "-cq", "23"] if use_gpu else ["-preset", "medium", "-crf", "23"]),
            str(raw_video)
        ], capture_output=True)
    else:
        # 멀티 이미지: 크로스페이드 슬라이드쇼
        inputs = []
        for p in prepared:
            inputs += ["-loop", "1", "-t", str(duration_per_slide + FADE_DURATION), "-i", p]

        subprocess.run([
            "ffmpeg", "-y",
            *inputs,
            "-filter_complex", fade_filter,
            "-map", "[out]",
            "-t", str(total_duration),
            "-c:v", encoder,
            *(["-preset", "p4", "-rc", "vbr", "-cq", "23"] if use_gpu else ["-preset", "medium", "-crf", "23"]),
            str(raw_video)
        ], capture_output=True)

    # 4) 자막 오버레이 (libass)
    video_with_text = tmpdir / "with_text.mp4"
    drawtext_filters = []
    if title:
        drawtext_filters.append(
            f"drawtext=fontfile='{FONT_KO.replace(chr(92), chr(47))}':"
            f"text='{title}':"
            f"fontcolor=0xe8dcc8:fontsize=62:"
            f"x=(w-text_w)/2:y=h-280:"
            f"shadowcolor=black:shadowx=2:shadowy=2:"
            f"enable='between(t,0,{total_duration})'"
        )
    if subtitle:
        drawtext_filters.append(
            f"drawtext=fontfile='{FONT_KO.replace(chr(92), chr(47))}':"
            f"text='{subtitle}':"
            f"fontcolor=0xc9a84c:fontsize=38:"
            f"x=(w-text_w)/2:y=h-200:"
            f"shadowcolor=black:shadowx=1:shadowy=1:"
            f"enable='between(t,0,{total_duration})'"
        )

    if drawtext_filters:
        vf = ",".join(drawtext_filters)
        subprocess.run([
            "ffmpeg", "-y", "-i", str(raw_video),
            "-vf", vf,
            "-c:v", encoder,
            *(["-preset", "p4"] if use_gpu else ["-preset", "medium"]),
            "-c:a", "copy",
            str(video_with_text)
        ], capture_output=True)
    else:
        video_with_text = raw_video

    # 5) 배경음악 합성
    final = Path(output_path)
    final.parent.mkdir(parents=True, exist_ok=True)

    # 사용 가능한 무료 음악 파일 탐색
    if not music_path:
        music_files = list(MUSIC_DIR.glob("*.mp3")) + list(MUSIC_DIR.glob("*.wav")) + list(MUSIC_DIR.glob("*.m4a"))
        if music_files:
            music_path = str(music_files[0])

    if music_path and Path(music_path).exists():
        subprocess.run([
            "ffmpeg", "-y",
            "-i", str(video_with_text),
            "-i", music_path,
            "-filter_complex",
            f"[1:a]volume=0.3,afade=t=out:st={max(0, total_duration-1.5)}:d=1.5[music];"
            f"[0:a][music]amix=inputs=2:duration=first[aout]",
            "-map", "0:v", "-map", "[aout]",
            "-t", str(total_duration),
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "128k",
            str(final)
        ], capture_output=True)
    else:
        subprocess.run([
            "ffmpeg", "-y", "-i", str(video_with_text),
            "-t", str(total_duration),
            "-c", "copy",
            str(final)
        ], capture_output=True)

    shutil.rmtree(tmpdir, ignore_errors=True)
    print(f"  ✅ 영상 완료: {final.name} ({total_duration:.0f}초)")
    return str(final)


def _build_xfade_filter(n: int, dur: float, fade: float) -> str:
    """N개 슬라이드 크로스페이드 필터 그래프 생성"""
    if n < 2:
        return "[0:v]copy[out]"

    parts = []
    inputs = "".join(f"[{i}:v]" for i in range(n))
    # 순차적 xfade 체인
    prev = "[0:v]"
    for i in range(1, n):
        offset = i * dur - fade * i
        label = f"[v{i}]" if i < n - 1 else "[out]"
        parts.append(
            f"{prev}[{i}:v]xfade=transition=fade:"
            f"duration={fade}:offset={offset:.2f}{label}"
        )
        prev = f"[v{i}]"

    return ";".join(parts)


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python video_agent.py <이미지1> [이미지2 ...] --title 제목 --sub 부제목 --out output.mp4")
        sys.exit(1)

    images = []
    title = ""
    subtitle = "단소상회 · 포항 이동"
    out_path = str(OUTPUT_DIR / "reels.mp4")
    music = None

    i = 1
    while i < len(sys.argv):
        arg = sys.argv[i]
        if arg == "--title" and i + 1 < len(sys.argv):
            title = sys.argv[i + 1]; i += 2
        elif arg == "--sub" and i + 1 < len(sys.argv):
            subtitle = sys.argv[i + 1]; i += 2
        elif arg == "--out" and i + 1 < len(sys.argv):
            out_path = sys.argv[i + 1]; i += 2
        elif arg == "--music" and i + 1 < len(sys.argv):
            music = sys.argv[i + 1]; i += 2
        else:
            images.append(arg); i += 1

    if not images:
        print("이미지 경로를 입력하세요.")
        sys.exit(1)

    print(f"\n🎬 영상 에이전트 시작: {len(images)}장 → 릴스")
    build_slideshow(images, out_path, title=title, subtitle=subtitle, music_path=music)
