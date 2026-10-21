import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { officeContent } from "@/lib/content/public-site";
export default async function OfficePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const content = officeContent[locale];
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale}>{ar ? "الرئيسية" : "Home"}</Link><Link href={"/" + locale + "/services"}>{ar ? "الخدمات" : "Services"}</Link><Link href={"/" + locale + "/insights"}>{ar ? "المقالات" : "Insights"}</Link><Link href={locale === "ar" ? "/en/office" : "/ar/office"}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <section className="bg-[#14263d] py-20 text-white sm:py-28"><div className="container"><p className="eyebrow !text-[#d8c39b]">{ar ? "قيمنا ونهجنا" : "OUR VALUES & APPROACH"}</p><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{content.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{content.intro}</p></div></section>
    <section className="section"><div className="container grid gap-5 md:grid-cols-3">{content.principles.map((item, i) => <article key={item.title} className="rounded-3xl border border-[#14263d]/10 bg-white/70 p-7"><span className="text-sm font-black tracking-widest text-[#b99a62]">0{i + 1}</span><h2 className="mt-6 text-xl font-extrabold">{item.title}</h2><p className="mt-3 leading-8 text-[#657184]">{item.description}</p></article>)}</div></section>
    <section className="pb-20"><div className="container rounded-3xl bg-[#e8e3d7] p-8 sm:p-12"><h2 className="text-2xl font-black">{ar ? "هل ترغب في معرفة المزيد؟" : "Would you like to learn more?"}</h2><p className="mt-3 max-w-2xl leading-8 text-[#657184]">{ar ? "تواصل مع المكتب لطرح استفسارك العام ومناقشة الخطوة التالية." : "Contact the office to share a general enquiry and discuss the next step."}</p><a href="mailto:hello@mizan-legal.example" className="mt-6 inline-flex rounded-full bg-[#176b67] px-6 py-3 font-bold text-white">{ar ? "تواصل معنا" : "Contact us"} ↗</a></div></section>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى تعريفي عام ولا يُعد استشارة قانونية." : "Content is general information and is not legal advice."}</div></footer>
  </main>;
}
