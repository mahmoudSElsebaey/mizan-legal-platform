import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { insightsContent, practiceAreas } from "@/lib/content/public-site";
const siteUrl = "https://mizan-legal.example";
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/office", "/lawyer", "/services", "/insights"];
  const localized = locales.flatMap((locale) => routes.map((route) => ({ url: siteUrl + "/" + locale + route, changeFrequency: route === "/insights" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : 0.7 })));
  const serviceRoutes = locales.flatMap((locale) => Object.keys(practiceAreas).map((slug) => ({ url: siteUrl + "/" + locale + "/services/" + slug, changeFrequency: "monthly" as const, priority: 0.6 })));
  const articleRoutes = locales.flatMap((locale) => insightsContent[locale].articles.map((article) => ({ url: siteUrl + "/" + locale + "/insights/" + article.slug, changeFrequency: "monthly" as const, priority: 0.5 })));
  return [...localized, ...serviceRoutes, ...articleRoutes];
}
