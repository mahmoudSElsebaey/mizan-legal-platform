import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { insightsContent } from "@/lib/content/public-site";
export default async function InsightsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const content = insightsContent[locale];
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale}>{ar ? "الرئيسية" : "Home"}</Link><Link href={"/" + locale + "/office"}>{ar ? "عن المكتب" : "Office"}</Link><Link href={locale === "ar" ? "/en/insights" : "/ar/insights"}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <section className="bg-[#14263d] py-20 text-white sm:py-28"><div className="container"><p className="eyebrow !text-[#d8c39b]">{ar ? "المعرفة القانونية" : "LEGAL KNOWLEDGE"}</p><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{content.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{content.intro}</p></div></section>
    <section className="section"><div className="container grid gap-5 md:grid-cols-3">{content.articles.map((article, i) => <article key={article.slug} className="flex flex-col rounded-3xl border border-[#14263d]/10 bg-white/70 p-7"><span className="text-xs font-bold text-[#176b67]">{article.category}</span><h2 className="mt-5 text-xl font-extrabold leading-8">{article.title}</h2><p className="mt-3 flex-1 leading-8 text-[#657184]">{article.summary}</p><Link className="mt-6 inline-flex items-center gap-2 font-bold text-[#176b67]" href={"/" + locale + "/insights/" + article.slug}>{ar ? "اقرأ المقال" : "Read article"} ↗</Link></article>)}</div></section>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى للتوعية العامة ولا يُعد استشارة قانونية." : "Content is for general education and is not legal advice."}</div></footer>
  </main>;
}
