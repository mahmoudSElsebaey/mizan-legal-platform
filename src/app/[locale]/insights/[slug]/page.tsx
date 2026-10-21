import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { articleDetails, insightsContent } from "@/lib/content/public-site";
export function generateStaticParams() {
  return locales.flatMap((locale) => insightsContent[locale].articles.map((article) => ({ locale, slug: article.slug })));
}
export default async function InsightArticlePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const article = articleDetails[slug]?.[locale];
  if (!article) notFound();
  const ar = locale === "ar";
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale + "/insights"}>{ar ? "كل المقالات" : "All insights"}</Link><Link href={locale === "ar" ? "/en/insights/" + slug : "/ar/insights/" + slug}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <article className="section"><div className="container max-w-3xl"><p className="eyebrow">{ar ? "رؤى قانونية" : "LEGAL INSIGHT"}</p><h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">{article.title}</h1><p className="mt-6 text-lg leading-8 text-[#657184]">{article.intro}</p><ul className="mt-10 space-y-5">{article.points.map((point, i) => <li key={point} className="flex gap-4 rounded-2xl border border-[#14263d]/10 bg-white/70 p-5 leading-8"><span className="font-black text-[#b99a62]">0{i + 1}</span><span>{point}</span></li>)}</ul><p className="mt-8 rounded-2xl bg-[#e8e3d7] p-5 text-sm leading-7 text-[#657184]">{ar ? "هذا المحتوى عام للتوعية فقط، ولا يُعد رأيًا قانونيًا في حالة محددة. قد تختلف القواعد بحسب الاختصاص والوقائع." : "This is general educational content, not legal advice for a specific situation. Rules may differ by jurisdiction and facts."}</p><Link className="mt-8 inline-flex font-bold text-[#176b67]" href={"/" + locale + "/insights"}>← {ar ? "العودة إلى المقالات" : "Back to insights"}</Link></div></article>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى للتوعية العامة ولا يُعد استشارة قانونية." : "Content is for general education and is not legal advice."}</div></footer>
  </main>;
}
