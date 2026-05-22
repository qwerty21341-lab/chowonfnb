import Link from "next/link";

const MENU_CATEGORIES = [
  {
    category: "소고기",
    note: "전 부위 1++(9) 특상한우",
    items: [
      { name: "등심", desc: "풍부한 마블링이 살아있는 단소상회의 시그니처", unit: "100g" },
      { name: "채끝", desc: "부드러운 결, 담백하고 깔끔한 맛", unit: "100g" },
      { name: "안심", desc: "가장 연한 부위, 특별한 날을 위해", unit: "100g" },
      { name: "꽃살", desc: "꽃처럼 피어난 마블링, 육즙이 풍부", unit: "100g" },
      { name: "갈비", desc: "참숯 위에서 천천히 익히는 프리미엄 갈비", unit: "1인분" },
    ],
  },
  {
    category: "사이드",
    note: "",
    items: [
      { name: "냉면", desc: "고기 후에 마무리하는 시원한 평양냉면 스타일", unit: "1그릇" },
      { name: "된장찌개", desc: "사장님이 직접 끓이는 구수한 한식 된장찌개", unit: "1인" },
      { name: "공기밥", desc: "", unit: "1공기" },
    ],
  },
  {
    category: "주류",
    note: "",
    items: [
      { name: "소주", desc: "", unit: "1병" },
      { name: "맥주", desc: "", unit: "1병" },
      { name: "막걸리", desc: "한우와 어울리는 전통 막걸리", unit: "1병" },
    ],
  },
];

export default function MenuPage() {
  return (
    <main className="min-h-dvh bg-charcoal pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-charcoal/95 backdrop-blur-sm border-b border-gold/15 px-6 py-4 flex items-center gap-4">
        <Link
          href="/danso"
          className="font-sans text-gold/60 text-sm hover:text-gold transition-colors"
        >
          ←
        </Link>
        <div>
          <p className="font-serif text-lg font-bold text-cream tracking-wider">
            단소상회 메뉴
          </p>
          <p className="font-sans text-[10px] text-gold/50 tracking-widest">
            1++(9) 특상한우 전문점
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="px-6 py-10 border-b border-gold/10">
        <p className="font-sans text-sm leading-7 text-cream/55 max-w-md">
          &ldquo;가격은 시가입니다. 매일 직접 고르는 한우라 당일 시세에 따라 달라집니다.
          가격보다 퀄리티를 먼저 생각합니다.&rdquo;
        </p>
        <p className="font-serif text-sm text-gold/50 mt-3">— 사장님</p>
      </div>

      {/* Menu Categories */}
      <div className="px-6 pt-8 space-y-12 max-w-md mx-auto">
        {MENU_CATEGORIES.map((cat) => (
          <div key={cat.category}>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-serif text-xl font-bold text-gold tracking-wider">
                {cat.category}
              </h2>
              {cat.note && (
                <span className="font-sans text-[10px] text-cream/35 tracking-wide">
                  {cat.note}
                </span>
              )}
            </div>
            <div className="space-y-0">
              {cat.items.map((item) => (
                <div
                  key={item.name}
                  className="flex items-start justify-between py-4 border-b border-gold/8 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="font-serif text-base font-bold text-cream">
                      {item.name}
                    </p>
                    {item.desc && (
                      <p className="font-sans text-xs text-cream/40 mt-0.5 leading-5">
                        {item.desc}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-right shrink-0">
                    <p className="font-sans text-xs text-gold/55">시가</p>
                    <p className="font-sans text-[10px] text-cream/25 mt-0.5">
                      {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom note */}
      <div className="px-6 mt-12 max-w-md mx-auto">
        <p className="font-sans text-[11px] text-cream/25 leading-6 text-center">
          메뉴 및 가격은 시세에 따라 변동될 수 있습니다.
          <br />
          자세한 문의는 전화주세요.
        </p>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link
          href="/danso#reservation"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold text-center hover:bg-gold/90 transition-colors"
        >
          예약하기
        </Link>
        <a
          href="tel:0507-1443-2080"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors"
        >
          전화하기
        </a>
      </div>
    </main>
  );
}
