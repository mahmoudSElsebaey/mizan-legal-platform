"use client";
import { useParams } from "next/navigation";
export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const ar = params?.locale === "ar";
  return <main className="container flex min-h-[60vh] flex-col items-start justify-center py-16">
    <p className="eyebrow">{ar ? "حدث خطأ" : "SOMETHING WENT WRONG"}</p>
    <h1 className="mt-4 text-3xl font-black text-[#14263d]">{ar ? "تعذّر تحميل هذه الصفحة" : "This page could not be loaded"}</h1>
    <p className="mt-4 max-w-xl leading-8 text-[#657184]">{ar ? "حاول تحديث الصفحة. إذا استمرت المشكلة، يمكنك العودة لاحقًا." : "Try again. If the issue continues, please return later."}</p>
    <button onClick={() => reset()} className="mt-7 rounded-full bg-[#176b67] px-6 py-3 font-bold text-white">{ar ? "إعادة المحاولة" : "Try again"}</button>
  </main>;
}
