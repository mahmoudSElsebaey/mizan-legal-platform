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
    <main className="min-h-[70vh] bg-stone-50 px-4 py-14 sm:py-20">
      <div className="mx-auto mb-6 max-w-md text-center">
        <a href={`/${locale}`} className="text-sm font-medium text-stone-600 underline-offset-4 hover:text-amber-800 hover:underline">
          {locale === "ar" ? "العودة إلى الموقع" : "Back to website"}
        </a>
      </div>
      <AuthForm locale={locale} mode="login" demoAccounts={demoAccounts} />
    </main>
  );
}
