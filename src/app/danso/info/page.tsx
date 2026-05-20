import Link from "next/link";

export default function InfoPage() {
  return (
    <main className="min-h-dvh bg-charcoal pb-24">
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
            찾아오기
          </p>
          <p className="font-sans text-[10px] text-gold/50 tracking-widest">
            단소상회
          </p>
        </div>
      </div>

      <div className="px-6 py-10 max-w-md mx-auto space-y-10">
        {/* Map placeholder */}
        <div className="w-full h-48 bg-white/4 border border-gold/15 flex items-center justify-center">
          <a
            href="https://map.kakao.com/link/search/단소상회"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-gold/60 tracking-widest hover:text-gold transition-colors"
          >
            카카오맵으로 보기 →
          </a>
        </div>

        {/* Address block */}
        <div className="space-y-6 font-sans text-sm border-t border-gold/10 pt-8">
          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">주소</span>
            <div className="text-cream/65 leading-6">
              <p>경상북도 포항시 남구 이동</p>
              <p className="text-cream/35 text-xs mt-1">
                (정확한 주소는 전화 문의)
              </p>
            </div>
          </div>

          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">영업</span>
            <div className="text-cream/65 leading-6">
              <p>매일 17:00 — 23:00</p>
              <p className="text-cream/35 text-xs mt-1">라스트 오더 22:00</p>
            </div>
          </div>

          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">휴무</span>
            <span className="text-cream/65">매주 월요일</span>
          </div>

          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">전화</span>
            <a href="tel:010-0000-0000" className="text-cream/65 underline underline-offset-4 decoration-gold/20">
              010-0000-0000
            </a>
          </div>

          <div className="flex gap-5">
            <span className="text-gold/55 w-14 shrink-0 pt-0.5 tracking-wide">주차</span>
            <span className="text-cream/65">매장 앞 주차 가능</span>
          </div>
        </div>

        {/* Notice */}
        <div className="border border-gold/15 p-5 space-y-3">
          <p className="font-sans text-[10px] text-gold/60 tracking-[0.3em]">NOTICE</p>
          <ul className="font-sans text-xs text-cream/45 leading-7 space-y-1">
            <li>· 예약 없이 방문하실 경우 대기가 있을 수 있습니다</li>
            <li>· 단체 방문(6인 이상)은 사전 예약 필수입니다</li>
            <li>· 노쇼 방지를 위해 예약 당일 확인 연락을 드립니다</li>
          </ul>
        </div>

        {/* CTA */}
        <a
          href="https://map.kakao.com/link/search/단소상회"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center py-3.5 border border-gold/35 text-gold font-sans text-xs tracking-[0.3em] hover:bg-gold/8 transition-colors"
        >
          카카오맵으로 보기
        </a>
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-gold/20 bg-charcoal/95 backdrop-blur-sm">
        <Link
          href="/danso"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-charcoal bg-gold text-center hover:bg-gold/90 transition-colors"
        >
          예약하기
        </Link>
        <a
          href="tel:010-0000-0000"
          className="flex-1 py-4 font-sans text-sm font-bold tracking-[0.3em] text-gold text-center border-l border-gold/20 hover:bg-gold/5 transition-colors"
        >
          전화하기
        </a>
      </div>
    </main>
  );
}
