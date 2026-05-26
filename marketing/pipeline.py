"""
단소상회 마케팅 파이프라인 — 오케스트레이터

사용법:
  python pipeline.py <이미지경로> "키워드"
  python pipeline.py photo.jpg "오늘 갈빗살 입고"
  python pipeline.py photo1.jpg photo2.jpg "주말 특선" --platforms instagram telegram
  python pipeline.py --design poster "어버이날 특선"

흐름:
  사진 → [이미지 에이전트] → [카피 에이전트] → [영상 에이전트] → [발행 에이전트]
"""

import sys
import json
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "agents"))

import image_agent
import video_agent
import copy_agent
import design_agent
import publish_agent

OUTPUT = ROOT / "output"


def run(
    images: list[str],
    keyword: str,
    platforms: list[str] | None = None,
    make_video: bool = True,
    occasion: str = "",
) -> dict:
    """
    메인 파이프라인 실행

    Args:
        images: 원본 사진 경로 리스트
        keyword: 키워드/메뉴명 (예: "오늘 갈빗살 입고")
        platforms: 게시할 플랫폼. None이면 telegram만
        make_video: 릴스 영상 생성 여부
        occasion: 특별 상황 (예: "어버이날")
    """
    ts = datetime.now().strftime("%m%d_%H%M")
    platforms = platforms or ["telegram"]

    print(f"\n{'='*50}")
    print(f"🚀 단소상회 마케팅 파이프라인 시작")
    print(f"   키워드: {keyword}")
    print(f"   이미지: {len(images)}장")
    print(f"   플랫폼: {', '.join(platforms)}")
    print(f"{'='*50}\n")

    results = {"ts": ts, "keyword": keyword}

    # ── STEP 1: 이미지 에이전트 ───────────────────────────
    print("📸 STEP 1 — 이미지 처리")
    processed = {}
    for img_path in images:
        out = image_agent.process(
            src=img_path,
            title=keyword if len(keyword) <= 15 else "",
            subtitle="단소상회 · 포항 이동",
            formats=["square", "story"],
        )
        processed.update(out)
    results["images"] = processed
    print(f"   → {len(processed)}개 이미지 생성\n")

    # ── STEP 2: 카피 에이전트 ────────────────────────────
    print("✍️  STEP 2 — 카피 생성")
    needed_platforms = [p for p in ["instagram", "google_business", "kakao", "naver_blog"]
                        if p in platforms or p == "instagram"]  # 인스타는 기본 생성
    copy = copy_agent.generate(
        keyword=keyword,
        platforms=needed_platforms,
        occasion=occasion,
    )
    copy_path = copy_agent.save(copy, keyword)
    results["copy"] = copy
    results["copy_path"] = copy_path
    print(f"   → {len(copy)}개 플랫폼 카피 완료\n")

    # ── STEP 3: 영상 에이전트 (선택) ─────────────────────
    if make_video and images:
        print("🎬 STEP 3 — 릴스 영상 제작")
        video_path = str(OUTPUT / "videos" / f"reels_{ts}.mp4")
        try:
            video_agent.build_slideshow(
                images=images,
                output_path=video_path,
                title=keyword[:20] if keyword else "",
                subtitle="단소상회 · 포항 이동",
            )
            results["video"] = video_path
            print(f"   → {video_path}\n")
        except Exception as e:
            print(f"   ⚠️  영상 생성 실패: {e}\n")
    else:
        print("🎬 STEP 3 — 영상 생성 건너뜀\n")

    # ── STEP 4: 발행 에이전트 ────────────────────────────
    print("📡 STEP 4 — 발행")

    # 텔레그램: 처리된 이미지 중 첫 번째 사용
    primary_image = processed.get("square") or (images[0] if images else None)

    publish_results = publish_agent.publish_all(
        image_paths=[primary_image] if primary_image else [],
        copy=copy,
    )
    results["publish"] = publish_results

    # ── 완료 리포트 ───────────────────────────────────────
    print(f"\n{'='*50}")
    print("✅ 파이프라인 완료")
    print(f"   이미지: {len(processed)}개")
    print(f"   카피:   {', '.join(copy.keys())}")
    print(f"   영상:   {'✅' if results.get('video') else '—'}")
    for p, ok in publish_results.items():
        print(f"   {p}:   {'✅ 게시 완료' if ok else '⚠️  미설정'}")
    print(f"{'='*50}\n")

    # 결과 저장
    report_path = OUTPUT / f"report_{ts}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        # video/image paths만 저장 (copy 내용도 포함)
        json.dump({
            "ts": ts, "keyword": keyword,
            "images": list(processed.values()),
            "video": results.get("video"),
            "copy_path": copy_path,
            "publish": publish_results,
        }, f, ensure_ascii=False, indent=2)

    return results


# ─── CLI ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="단소상회 마케팅 파이프라인")
    parser.add_argument("images", nargs="*", help="원본 이미지 경로")
    parser.add_argument("--keyword", "-k", default="", help="키워드/메뉴명")
    parser.add_argument("--platforms", "-p", nargs="+",
                        default=["telegram"],
                        choices=["telegram", "instagram", "google_business", "kakao", "naver_blog"])
    parser.add_argument("--no-video", action="store_true", help="영상 생성 건너뜀")
    parser.add_argument("--occasion", "-o", default="", help="특별 상황")
    parser.add_argument("--design", choices=["poster", "menu"], help="디자인 모드")
    parser.add_argument("--title", default="", help="디자인 제목")
    parser.add_argument("--body", default="", help="디자인 본문")

    args = parser.parse_args()

    if args.design == "poster":
        design_agent.make_event_poster(title=args.title, body=args.body)
    elif args.design == "menu":
        design_agent.make_menu_card(menu_name=args.title)
    elif args.images:
        # 마지막 인자가 이미지가 아니면 keyword로 처리
        images = args.images
        keyword = args.keyword or (images.pop() if not Path(images[-1]).exists() else "오늘의 특선")
        run(
            images=images,
            keyword=keyword,
            platforms=args.platforms,
            make_video=not args.no_video,
            occasion=args.occasion,
        )
    else:
        parser.print_help()
