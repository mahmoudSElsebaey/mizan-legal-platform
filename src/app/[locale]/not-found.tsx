import Link from "next/link";
export default function LocaleNotFound() {
  return <main className="container flex min-h-[65vh] flex-col items-start justify-center py-16">
    <p className="text-sm font-black tracking-widest text-[#b99a62]">404</p>
    <h1 className="mt-4 text-4xl font-black text-[#14263d]">الصفحة غير موجودة · Page not found</h1>
    <p className="mt-4 max-w-xl leading-8 text-[#657184]">قد يكون الرابط غير صحيح أو أن الصفحة نُقلت. The link may be incorrect or the page may have moved.</p>
    <div className="mt-7 flex flex-wrap gap-3"><Link href="/ar" className="rounded-full bg-[#176b67] px-6 py-3 font-bold text-white">الرئيسية</Link><Link href="/en" className="rounded-full border border-[#14263d]/20 px-6 py-3 font-bold text-[#14263d]">Home</Link></div>
  </main>;
}
