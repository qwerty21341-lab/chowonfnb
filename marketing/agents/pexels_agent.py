"""
Pexels 에이전트 — 무료 스톡 사진/영상/음악 검색 및 다운로드
https://www.pexels.com/api/ (무료, 월 200req/hr)
배경음악: 유튜브 오디오 라이브러리 대신 Pexels Audio 사용
"""

import os
import httpx
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUTPUT_DIR = ROOT / "assets"

try:
    from config import PEXELS_API_KEY
except ImportError:
    PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

BASE_URL = "https://api.pexels.com"


def _headers():
    return {"Authorization": PEXELS_API_KEY}


def search_photos(query: str, per_page: int = 5, orientation: str = "landscape") -> list[dict]:
    """
    사진 검색
    orientation: "landscape" | "portrait" | "square"
    반환: [{"id", "url", "photographer", "src": {"original", "large", "medium"}}]
    """
    r = httpx.get(
        f"{BASE_URL}/v1/search",
        headers=_headers(),
        params={"query": query, "per_page": per_page, "orientation": orientation},
        timeout=10,
    )
    photos = r.json().get("photos", [])
    return [{"id": p["id"], "photographer": p["photographer"],
             "src": p["src"], "url": p["url"]} for p in photos]


def search_videos(query: str, per_page: int = 5, orientation: str = "portrait") -> list[dict]:
    """
    영상 검색 (릴스용 세로 영상)
    반환: [{"id", "url", "duration", "files": [{"link", "quality", "width", "height"}]}]
    """
    r = httpx.get(
        f"{BASE_URL}/videos/search",
        headers=_headers(),
        params={"query": query, "per_page": per_page, "orientation": orientation},
        timeout=10,
    )
    videos = r.json().get("videos", [])
    result = []
    for v in videos:
        files = sorted(v.get("video_files", []),
                       key=lambda f: f.get("width", 0), reverse=True)
        result.append({
            "id": v["id"], "url": v["url"],
            "duration": v["duration"],
            "files": [{"link": f["link"], "quality": f.get("quality"),
                       "width": f.get("width"), "height": f.get("height")}
                      for f in files[:3]]
        })
    return result


def download_photo(photo: dict, dest_dir: str | None = None, size: str = "large2x") -> str:
    """사진 다운로드. size: original/large2x/large/medium/small"""
    dest = Path(dest_dir or OUTPUT_DIR / "pexels_photos")
    dest.mkdir(parents=True, exist_ok=True)
    url = photo["src"].get(size) or photo["src"].get("large") or photo["src"]["original"]
    ext = url.split("?")[0].rsplit(".", 1)[-1] or "jpg"
    out_path = dest / f"pexels_{photo['id']}.{ext}"
    if out_path.exists():
        return str(out_path)
    r = httpx.get(url, timeout=30, follow_redirects=True)
    out_path.write_bytes(r.content)
    print(f"  다운로드: {out_path.name} ({len(r.content)//1024}KB)")
    return str(out_path)


def download_video(video: dict, dest_dir: str | None = None) -> str:
    """최고화질 영상 파일 다운로드"""
    dest = Path(dest_dir or OUTPUT_DIR / "pexels_videos")
    dest.mkdir(parents=True, exist_ok=True)
    best = video["files"][0] if video["files"] else None
    if not best:
        raise ValueError("다운로드 가능한 영상 없음")
    out_path = dest / f"pexels_{video['id']}.mp4"
    if out_path.exists():
        return str(out_path)
    r = httpx.get(best["link"], timeout=60, follow_redirects=True)
    out_path.write_bytes(r.content)
    print(f"  영상 다운로드: {out_path.name} ({len(r.content)//1024//1024}MB)")
    return str(out_path)


def get_background_music(query: str = "korean ambient restaurant", dest_dir: str | None = None) -> str | None:
    """
    배경음악용 영상 다운로드 → FFmpeg으로 오디오 추출
    (Pexels Audio API 대신 영상 오디오 활용)
    """
    dest = Path(dest_dir or ROOT / "assets" / "music")
    dest.mkdir(parents=True, exist_ok=True)

    import subprocess
    videos = search_videos(query, per_page=3, orientation="landscape")
    if not videos:
        return None

    video_path = download_video(videos[0], str(dest))
    audio_path = str(dest / f"bgm_{Path(video_path).stem}.mp3")

    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vn", "-acodec", "libmp3lame", "-b:a", "128k",
        audio_path
    ], capture_output=True)
    print(f"  배경음악 추출: {Path(audio_path).name}")
    return audio_path


if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    if not PEXELS_API_KEY:
        print("PEXELS_API_KEY 없음. config.py에 설정하세요.")
        sys.exit(1)

    query = sys.argv[1] if len(sys.argv) > 1 else "korean beef grilled restaurant"
    print(f"검색: '{query}'")
    photos = search_photos(query, per_page=3)
    for p in photos:
        print(f"  [{p['id']}] {p['photographer']} — {p['url']}")
