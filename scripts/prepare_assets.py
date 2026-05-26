"""
단소상회 웹사이트 에셋 준비 스크립트
- Gallery 8장, Story 원육, 리뷰 6장, 외관 사진 변환
- 구버전 gallery 파일 정리
"""
import subprocess
import os

FFMPEG = r"C:\Users\user\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
PUB    = r"C:\Users\user\chowonfnb\public"
GBASE  = r"C:\Users\user\Desktop\KJH\02_Work\00_Gallery\04_단소상회"
RBASE  = r"C:\Users\user\Desktop\KJH\02_Work\03_Blog\01_Naver\01_단소상회브랜드블로그\리뷰캡쳐"

JOBS = [
    # (입력 경로, 출력 경로, 너비, 품질)
    # ── 갤러리 ──
    (
        fr"{GBASE}\유료촬영본\더윈마케팅\플레이스_최종\20241121-20241113-DSC07929_fin.JPG",
        fr"{PUB}\gallery\g1-hero-top.jpg", 1400, 2
    ),
    (
        fr"{GBASE}\03_리뷰어이미지\냠냠_우다길\9E4A9571.jpg",
        fr"{PUB}\gallery\g2-marbling.jpg", 900, 2
    ),
    (
        fr"{GBASE}\03_리뷰어이미지\냠냠_우다길\9E4A9581.jpg",
        fr"{PUB}\gallery\g3-smoke.jpg", 900, 2
    ),
    (
        fr"{GBASE}\03_리뷰어이미지\냠냠_우다길\9E4A9563.jpg",
        fr"{PUB}\gallery\g4-gyeran.jpg", 900, 2
    ),
    (
        fr"{GBASE}\03_리뷰어이미지\냠냠_우다길\9E4A9596.jpg",
        fr"{PUB}\gallery\g5-ssam.jpg", 1200, 2
    ),
    (
        fr"{GBASE}\유료촬영본\더윈마케팅\메뉴_최종\20241113-DSC07694.jpg",
        fr"{PUB}\gallery\g6-cuts.jpg", 900, 2
    ),
    (
        fr"{GBASE}\유료촬영본\더윈마케팅\메뉴_최종\20241113-DSC07740.jpg",
        fr"{PUB}\gallery\g7-glove.jpg", 1200, 2
    ),
    (
        fr"{GBASE}\유료촬영본\더윈마케팅\플레이스_최종\20241121-20241113-DSC08053_fin.JPG",
        fr"{PUB}\gallery\g8-hero-bottom.jpg", 1400, 2
    ),
    # ── 스토리 01 원육 ──
    (
        fr"{GBASE}\04_생고기사진\9F320A91-D5EF-4CA5-8157-0A2299D74A2A.jpg",
        fr"{PUB}\story\raw-marbling.jpg", 900, 2
    ),
    # ── 외관 ──
    (
        fr"{GBASE}\03_리뷰어이미지\픽플러스최주영\KakaoTalk_20260129_160534254_18.jpg",
        fr"{PUB}\exterior.jpg", 1200, 2
    ),
    # ── 리뷰 6장 ──
    (fr"{RBASE}\리뷰_무조건예약.jpg",                fr"{PUB}\reviews\r1.jpg", 600, 4),
    (fr"{RBASE}\리뷰_타지,마늘갈비,가족.jpg",         fr"{PUB}\reviews\r2.jpg", 600, 4),
    (fr"{RBASE}\리뷰_안창,차돌,예약.jpg",             fr"{PUB}\reviews\r3.jpg", 600, 4),
    (fr"{RBASE}\리뷰_고기, 대접, 친절, 회식, 부모님.jpg", fr"{PUB}\reviews\r4.jpg", 600, 4),
    (fr"{RBASE}\리뷰_화력,친절,후식.jpg",             fr"{PUB}\reviews\r5.jpg", 600, 4),
    (fr"{RBASE}\리뷰_주차,고기,친절.jpg",             fr"{PUB}\reviews\r6.jpg", 600, 4),
]

# 디렉토리 생성
for d in [fr"{PUB}\gallery", fr"{PUB}\reviews", fr"{PUB}\story"]:
    os.makedirs(d, exist_ok=True)

# 변환
for src, dst, w, q in JOBS:
    name = os.path.basename(dst)
    if not os.path.exists(src):
        print(f"[SKIP] 없음: {src}")
        continue
    print(f"[변환] {name} ...")
    result = subprocess.run(
        [FFMPEG, "-y", "-i", src, "-vf", f"scale={w}:-2", "-q:v", str(q), dst],
        capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if result.returncode == 0:
        size_kb = os.path.getsize(dst) // 1024
        print(f"  → OK ({size_kb} KB)")
    else:
        print(f"  → 실패\n{result.stderr[-300:]}")

# 구버전 gallery 파일 정리
OLD = [
    fr"{PUB}\gallery\g1-marbling-block.jpg",
    fr"{PUB}\gallery\g2-marbling-close.jpg",
    fr"{PUB}\gallery\g3-slice-tray.jpg",
    fr"{PUB}\gallery\g4-slice-spread.jpg",
    fr"{PUB}\gallery\g5-grill.jpg",
    fr"{PUB}\gallery\g6-setup.jpg",
]
for f in OLD:
    if os.path.exists(f):
        os.remove(f)
        print(f"[삭제] {os.path.basename(f)}")

# preview 임시파일 정리
import glob
for f in glob.glob(fr"{PUB}\preview_IMG_*.jpg"):
    os.remove(f); print(f"[삭제] {os.path.basename(f)}")
preview_dir = fr"{PUB}\preview"
if os.path.isdir(preview_dir):
    import shutil; shutil.rmtree(preview_dir); print("[삭제] preview/")

print("\n✅ 완료")
