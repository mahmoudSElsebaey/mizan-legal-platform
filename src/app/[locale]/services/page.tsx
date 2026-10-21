import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { practiceAreas } from "@/lib/content/public-site";
export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const entries = Object.entries(practiceAreas);
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale}>{ar ? "الرئيسية" : "Home"}</Link><Link href={"/" + locale + "/office"}>{ar ? "عن المكتب" : "Office"}</Link><Link href={locale === "ar" ? "/en/services" : "/ar/services"}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <section className="bg-[#14263d] py-20 text-white sm:py-28"><div className="container"><p className="eyebrow !text-[#d8c39b]">{ar ? "مجالات الممارسة" : "PRACTICE AREAS"}</p><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{ar ? "خدمات قانونية بخطوات واضحة" : "Legal services with clear next steps"}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{ar ? "تعرّف على مجالات المساعدة القانونية المتاحة، ثم تواصل معنا لمناقشة ما إذا كانت مناسبة لموضوعك." : "Explore the areas of legal support, then contact us to discuss whether they fit your matter."}</p></div></section>
    <section className="section"><div className="container grid gap-5 sm:grid-cols-2">{entries.map(([slug, data], i) => { const item = data[locale]; return <article key={slug} className="rounded-3xl border border-[#14263d]/10 bg-white/70 p-7 transition hover:-translate-y-1 hover:border-[#176b67]/40"><span className="text-xs font-black tracking-widest text-[#b99a62]">0{i + 1}</span><h2 className="mt-5 text-2xl font-extrabold">{item.title}</h2><p className="mt-3 leading-8 text-[#657184]">{item.summary}</p><Link className="mt-6 inline-flex items-center gap-2 font-bold text-[#176b67]" href={"/" + locale + "/services/" + slug}>{ar ? "اعرف المزيد" : "Learn more"} <span aria-hidden="true">↗</span></Link></article>; })}</div></section>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى تعريفي عام ولا يُعد استشارة قانونية." : "Content is general information and is not legal advice."}</div></footer>
  </main>;
}
