import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { posts } from "@/lib/blog";

const staticPaths = [
  "",
  "/services",
  "/services/cv-writing",
  "/services/linkedin-optimisation",
  "/services/career-coaching",
  "/services/ats-cv-review",
  "/services/international-cvs",
  "/services/graduate-cvs",
  "/services/executive-profiles",
  "/pricing",
  "/how-it-works",
  "/about",
  "/resources",
  "/free-cv-checklist",
  "/upload-cv",
  "/book-a-call",
  "/faqs",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/disclaimer",
  "/refund-policy",
  "/cookie-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...staticPaths.map((p) => ({
      url: `${site.url}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...posts.map((post) => ({
      url: `${site.url}/resources/${post.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
