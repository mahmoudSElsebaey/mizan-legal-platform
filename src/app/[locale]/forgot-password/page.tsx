import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Reset password" };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main className="mizan-auth-page min-h-screen px-4 py-8 sm:py-12">
      <div className="mizan-auth-back mx-auto mb-7 w-full max-w-5xl">
        <a href={`/${locale}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#0f2d2b] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
          {locale === "ar" ? "العودة إلى الموقع" : "Back to website"}
        </a>
      </div>
      <AuthForm locale={locale} mode="forgot-password" />
    </main>
  );
}
