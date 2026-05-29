import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getPostBySlug, getAllSlugs } from "@/data/blog-posts";
import { SiteNav } from "@/components/SiteNav";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} — 단소상회`,
    description: post.summary,
    keywords: post.tags,
    alternates: {
      canonical: `https://chowonfnb.com/danso/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `https://chowonfnb.com/danso/blog/${slug}`,
      siteName: "단소상회",
      locale: "ko_KR",
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Parse content into sections
  const sections = post.content.split("\n\n").map((block) => block.trim()).filter(Boolean);

  // Related posts
  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <main className="min-h-dvh bg-charcoal">
      <SiteNav />

      <article className="pt-14 max-w-2xl mx-auto px-6">
        {/* Breadcrumb */}
        <div className="py-6 flex items-center gap-2 font-sans text-[10px] tracking-[0.3em] text-cream/30">
          <Link href="/danso" className="hover:text-gold transition-colors">홈</Link>
          <span>·</span>
          <Link href="/danso/blog" className="hover:text-gold transition-colors">블로그</Link>
          <span>·</span>
          <span className="text-cream/50">{post.category}</span>
        </div>

        {/* Title */}
        <div className="pb-8 border-b border-gold/10">
          <p className="font-sans text-[10px] tracking-[0.35em] text-gold/40 mb-3">
            {post.category} · {post.date}
          </p>
          <h1 className="font-serif text-2xl font-bold text-cream leading-9">
            {post.title}
          </h1>
          <p className="font-sans text-sm text-cream/45 mt-4 leading-6">
            {post.summary}
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="font-sans text-[10px] text-gold/40 border border-gold/15 px-2 py-0.5"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="py-10 space-y-5">
          {sections.map((block, i) => {
            if (block.startsWith("## ")) {
              return (
                <h2 key={i} className="font-serif text-xl font-bold text-gold mt-8 mb-2">
                  {block.replace("## ", "")}
                </h2>
              );
            }
            if (block.startsWith("**") && block.endsWith("**")) {
              return (
                <p key={i} className="font-sans text-sm font-bold text-cream/80">
                  {block.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (block.startsWith("- ")) {
              const items = block.split("\n").map((l) => l.replace(/^- /, ""));
              return (
                <ul key={i} className="space-y-2 pl-4">
                  {items.map((item, j) => {
                    const parts = item.split("**").map((p, k) =>
                      k % 2 === 1 ? <strong key={k} className="text-gold font-bold">{p}</strong> : p
                    );
                    return (
                      <li key={j} className="font-sans text-sm text-cream/60 leading-6 flex gap-2">
                        <span className="text-gold/40 shrink-0">·</span>
                        <span>{parts}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }
            // Bold inline parsing
            const parts = block.split("**").map((part, k) =>
              k % 2 === 1 ? (
                <strong key={k} className="text-cream/90 font-bold">{part}</strong>
              ) : (
                part
              )
            );
            return (
              <p key={i} className="font-sans text-[15px] text-cream/60 leading-8">
                {parts}
              </p>
            );
          })}
        </div>

        {/* CTA */}
        <div className="py-10 border-t border-gold/10">
          <p className="font-sans text-xs text-cream/40 tracking-[0.2em] mb-5">단소상회 방문하기</p>
          <div className="flex gap-3">
            <Link
              href="/danso"
              className="flex-1 py-3.5 bg-gold text-charcoal font-sans font-bold text-xs tracking-[0.3em] text-center hover:bg-gold/90 transition-colors"
            >
              예약하기
            </Link>
            <a
              href="tel:0507-1443-2080"
              className="flex-1 py-3.5 border border-gold/30 text-gold font-sans text-xs tracking-[0.3em] text-center hover:bg-gold/5 transition-colors"
            >
              전화하기
            </a>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="py-8 border-t border-gold/10 mb-16">
            <p className="font-sans text-[10px] tracking-[0.4em] text-gold/40 mb-6">관련 글</p>
            <div className="space-y-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/danso/blog/${p.slug}`}
                  className="block py-4 border-b border-gold/8 hover:bg-white/[0.02] transition-colors -mx-6 px-6 group"
                >
                  <p className="font-sans text-[10px] text-gold/35 mb-1">{p.category}</p>
                  <p className="font-serif text-base text-cream group-hover:text-gold transition-colors">
                    {p.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
