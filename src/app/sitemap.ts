import type { MetadataRoute } from "next";

const BASE = "https://chowonfnb.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    // Korean (primary)
    { url: `${BASE}/ko/danso`,      lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/ko/danso/menu`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/ko/danso/info`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // English
    { url: `${BASE}/en/danso`,      lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/en/danso/menu`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/en/danso/info`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
