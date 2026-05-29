import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/data/blog-posts";

const BASE = "https://chowonfnb.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/danso`,             lastModified: new Date("2026-05-20"), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/danso/menu`,        lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/danso/info`,        lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/danso/reservation`, lastModified: new Date("2026-05-01"), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/danso/blog`,        lastModified: new Date(BLOG_POSTS[0].date), changeFrequency: "weekly", priority: 0.6 },
    ...BLOG_POSTS.map((post) => ({
      url: `${BASE}/danso/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
