"""
Whisper 에이전트 — faster-whisper (로컬, 완전 무료)
영상/음성 → 한국어 자막 자동 생성
SRT 파일 + FFmpeg으로 영상에 자동 삽입
"""

from faster_whisper import WhisperModel
from pathlib import Path
import subprocess

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "output" / "subtitles"
FONT_KO = "C:/Windows/Fonts/malgunbd.ttf"

# 모델 크기: tiny(빠름) / base / small / medium / large(정확함)
# 처음 실행 시 자동 다운로드
DEFAULT_MODEL = "small"


def transcribe(audio_path: str, language: str = "ko", model_size: str = DEFAULT_MODEL) -> list[dict]:
    """
    음성/영상 → 자막 세그먼트 리스트
    반환: [{"start": 0.0, "end": 2.5, "text": "안녕하세요"}, ...]
    """
    print(f"  Whisper 모델 로드 중: {model_size}")
    model = WhisperModel(model_size, device="cpu", compute_type="int8")

    print(f"  음성 인식 시작: {Path(audio_path).name}")
    segments, info = model.transcribe(audio_path, language=language, beam_size=5)

    result = []
    for seg in segments:
        result.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
        print(f"    [{seg.start:.1f}s → {seg.end:.1f}s] {seg.text.strip()}")

    print(f"  완료: {len(result)}개 세그먼트, 언어={info.language}")
    return result


def to_srt(segments: list[dict], out_path: str) -> str:
    """세그먼트 → SRT 자막 파일"""
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)

    def ts(seconds: float) -> str:
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int((seconds % 1) * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    lines = []
    for i, seg in enumerate(segments, 1):
        lines.append(f"{i}")
        lines.append(f"{ts(seg['start'])} --> {ts(seg['end'])}")
        lines.append(seg["text"])
        lines.append("")

    content = "\n".join(lines)
    Path(out_path).write_text(content, encoding="utf-8")
    print(f"  SRT 저장: {out_path}")
    return out_path


def burn_subtitles(video_path: str, srt_path: str, out_path: str) -> str:
    """SRT 자막을 영상에 하드 삽입 (FFmpeg)"""
    srt_posix = Path(srt_path).as_posix().replace(":", "\\:")
    font_posix = Path(FONT_KO).as_posix()

    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", (
            f"subtitles='{srt_posix}':"
            f"force_style='FontName=Malgun Gothic,FontSize=22,"
            f"PrimaryColour=&H00E8DCC8,OutlineColour=&H001E1C1A,"
            f"BackColour=&H801E1C1A,Outline=2,Shadow=1,"
            f"Alignment=2,MarginV=40'"
        ),
        "-c:v", "h264_nvenc", "-preset", "p4",
        "-c:a", "copy",
        out_path
    ], capture_output=True)
    print(f"  자막 삽입 완료: {Path(out_path).name}")
    return out_path


def process_video(video_path: str, out_dir: str | None = None) -> dict:
    """
    영상 → 자막 생성 + 삽입까지 한 번에
    반환: {"srt": srt_path, "video": subtitled_video_path}
    """
    out_dir = Path(out_dir or OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(video_path).stem

    segments = transcribe(video_path)
    srt_path = str(out_dir / f"{stem}.srt")
    to_srt(segments, srt_path)

    out_video = str(out_dir / f"{stem}_subtitled.mp4")
    burn_subtitles(video_path, srt_path, out_video)

    return {"srt": srt_path, "video": out_video}


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("사용법: python whisper_agent.py <영상경로>")
        sys.exit(1)
    result = process_video(sys.argv[1])
    print(f"SRT: {result['srt']}")
    print(f"자막 영상: {result['video']}")
