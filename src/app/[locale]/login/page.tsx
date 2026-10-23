import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  // Only enable this on an isolated portfolio/demo Supabase project. Credentials are sent to the browser when enabled.
  const demoPassword = process.env.ENABLE_DEMO_ACCOUNTS === "true" ? process.env.DEMO_SEED_PASSWORD : undefined;
  const demoAccounts = demoPassword ? [
    { label: locale === "ar" ? "عميل" : "Client", email: "mizan.demo.client@example.com", password: demoPassword },
    { label: locale === "ar" ? "محامٍ" : "Lawyer", email: "mizan.demo.lawyer@example.com", password: demoPassword },
    { label: locale === "ar" ? "مساعد" : "Assistant", email: "mizan.demo.assistant@example.com", password: demoPassword },
    { label: locale === "ar" ? "مدير" : "Administrator", email: "mizan.demo.admin@example.com", password: demoPassword },
    { label: locale === "ar" ? "مالك المكتب" : "Office owner", email: "mizan.demo.owner@example.com", password: demoPassword },
  ] : [];

  return (
    <main className="mizan-auth-page min-h-screen px-4 py-8 sm:py-12">
      <div className="mizan-auth-back mx-auto mb-7 w-full max-w-5xl">
        <a href={`/${locale}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[#0f2d2b] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
          {locale === "ar" ? "العودة إلى الموقع" : "Back to website"}
        </a>
      </div>
      <AuthForm locale={locale} mode="login" demoAccounts={demoAccounts} />
    </main>
  );
}
