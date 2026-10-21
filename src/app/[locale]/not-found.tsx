import Link from "next/link";
export default async function LocaleNotFound({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const ar = locale === "ar";
  return <main className="container flex min-h-[65vh] flex-col items-start justify-center py-16">
    <p className="text-sm font-black tracking-widest text-[#b99a62]">404</p>
    <h1 className="mt-4 text-4xl font-black text-[#14263d]">{ar ? "الصفحة غير موجودة" : "Page not found"}</h1>
    <p className="mt-4 max-w-xl leading-8 text-[#657184]">{ar ? "قد يكون الرابط غير صحيح أو أن الصفحة نُقلت." : "The link may be incorrect or the page may have moved."}</p>
    <Link href={"/" + (ar ? "ar" : "en")} className="mt-7 rounded-full bg-[#176b67] px-6 py-3 font-bold text-white">{ar ? "العودة للرئيسية" : "Back home"}</Link>
  </main>;
}
