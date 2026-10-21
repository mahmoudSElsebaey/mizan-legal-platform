import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { lawyerContent } from "@/lib/content/public-site";
export default async function LawyerPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const content = lawyerContent[locale];
  return <main className="min-h-screen">
    <header className="border-b border-[#14263d]/10"><div className="container flex min-h-[76px] items-center justify-between"><Link className="font-black tracking-wide text-[#14263d]" href={"/" + locale}>MIZAN <span className="text-[#176b67]">LEGAL</span></Link><nav className="flex items-center gap-4 text-sm font-semibold"><Link href={"/" + locale}>{ar ? "الرئيسية" : "Home"}</Link><Link href={"/" + locale + "/office"}>{ar ? "عن المكتب" : "Office"}</Link><Link href={locale === "ar" ? "/en/lawyer" : "/ar/lawyer"}>{ar ? "EN" : "عربي"}</Link></nav></div></header>
    <section className="bg-[#14263d] py-20 text-white sm:py-28"><div className="container"><p className="eyebrow !text-[#d8c39b]">{ar ? "تعريف مهني" : "PROFESSIONAL PROFILE"}</p><h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">{content.title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{content.intro}</p></div></section>
    <section className="section"><div className="container"><div role="note" className="rounded-2xl border border-[#b99a62]/50 bg-[#b99a62]/10 p-5 leading-8">{content.notice}</div><div className="mt-8 grid gap-5 md:grid-cols-3">{content.sections.map((item, i) => <article key={item.title} className="rounded-3xl border border-[#14263d]/10 bg-white/70 p-7"><span className="text-sm font-black tracking-widest text-[#b99a62]">0{i + 1}</span><h2 className="mt-6 text-xl font-extrabold">{item.title}</h2><p className="mt-3 leading-8 text-[#657184]">{item.description}</p></article>)}</div><a href="mailto:hello@mizan-legal.example" className="mt-9 inline-flex rounded-full bg-[#176b67] px-6 py-4 font-bold text-white">{ar ? "التواصل مع المكتب" : "Contact the office"} ↗</a></div></section>
    <footer className="border-t border-[#14263d]/10 py-7"><div className="container text-xs text-[#657184]">{ar ? "المحتوى تعريفي عام ولا يُعد استشارة قانونية." : "Content is general information and is not legal advice."}</div></footer>
  </main>;
}
