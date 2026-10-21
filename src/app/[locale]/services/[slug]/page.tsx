import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { getPracticeArea, practiceAreas } from "@/lib/content/public-site";
export function generateStaticParams() {
  return locales.flatMap((locale) => Object.keys(practiceAreas).map((slug) => ({ locale, slug })));
}
export default async function PracticeAreaPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const item = getPracticeArea(slug, locale);
  if (!item) notFound();
  const ar = locale === "ar";
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale + "/services"}>{ar ? "كل الخدمات" : "All services"}</Link><Link href={locale === "ar" ? "/en/services/" + slug : "/ar/services/" + slug}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <section className="bg-[#14263d] py-20 text-white sm:py-28"><div className="container"><p className="eyebrow !text-[#d8c39b]">{ar ? "مجال من مجالات الممارسة" : "PRACTICE AREA"}</p><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{item.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{item.summary}</p></div></section>
    <section className="section"><div className="container grid gap-12 md:grid-cols-[1fr_.8fr]"><div><h2 className="text-2xl font-black">{ar ? "كيف يمكن أن نساعد؟" : "How we may help"}</h2><ul className="mt-6 space-y-4">{item.details.map((detail) => <li key={detail} className="flex gap-3 leading-8 text-[#657184]"><span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b99a62]" />{detail}</li>)}</ul></div><aside className="rounded-3xl bg-[#e8e3d7] p-7 sm:p-9"><h2 className="text-2xl font-black">{ar ? "ناقش موضوعك" : "Discuss your matter"}</h2><p className="mt-4 leading-8 text-[#657184]">{ar ? "تختلف الخيارات والإجراءات بحسب الوقائع والقانون المنطبق. تواصل معنا لمناقشة الخطوة التالية." : "Options and procedures depend on the facts and applicable law. Contact us to discuss a next step."}</p><a href="mailto:hello@mizan-legal.example" className="mt-7 inline-flex rounded-full bg-[#176b67] px-6 py-4 font-bold text-white">{ar ? "تواصل مع المكتب" : "Contact the office"} ↗</a></aside></div></section>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى تعريفي عام ولا يُعد استشارة قانونية." : "Content is general information and is not legal advice."}</div></footer>
  </main>;
}
