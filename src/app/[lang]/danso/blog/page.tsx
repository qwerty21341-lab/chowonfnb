import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale, type Locale } from "@/dictionaries";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "@/data/blog-posts";
import { SiteNav } from "@/components/SiteNav";

export async function generateStaticParams() {
  return [{ lang: "ko" }, { lang: "en" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale: Locale = hasLocale(lang) ? (lang as Locale) : "ko";
  return {
    title: "단소상회 블로그 — 포항 한우 이야기",
    description:
      "포항 한우 등급, 참숯 직화구이, 포항 맛집 가이드 등 단소상회가 전하는 한우 이야기.",
    alternates: {
      canonical: `https://chowonfnb.com/${locale}/danso/blog`,
    },
    openGraph: {
      title: "단소상회 블로그 — 포항 한우 이야기",
      description: "포항 한우 등급, 참숯 직화, 포항 맛집 가이드.",
      url: `https://chowonfnb.com/${locale}/danso/blog`,
      siteName: "단소상회",
    },
  };
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const locale = lang as Locale;

  return (
    <main className="min-h-dvh bg-charcoal">
      <SiteNav lang={locale} />

      <div className="pt-14">
        {/* Header */}
        <div className="px-6 py-12 border-b border-gold/10 max-w-2xl mx-auto">
          <p className="font-sans text-[10px] tracking-[0.45em] text-gold/50 mb-3">BLOG</p>
          <h1 className="font-serif text-3xl font-bold text-cream">한우 이야기</h1>
          <p className="font-sans text-sm text-cream/40 mt-2 leading-6">
            포항 한우, 참숯 직화, 등급 이야기를 담습니다.
          </p>
        </div>

        {/* Post list */}
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-0 pb-24">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/${locale}/danso/blog/${post.slug}`}
              className="block py-8 border-b border-gold/8 hover:bg-white/[0.02] transition-colors -mx-6 px-6 group"
            >
              <p className="font-sans text-[10px] tracking-[0.35em] text-gold/40 mb-2">
                {post.category} · {post.date}
              </p>
              <h2 className="font-serif text-lg font-bold text-cream group-hover:text-gold transition-colors leading-7 mb-2">
                {post.title}
              </h2>
              <p className="font-sans text-sm text-cream/45 leading-6">
                {post.summary}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="font-sans text-[10px] text-gold/40 border border-gold/15 px-2 py-0.5"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
