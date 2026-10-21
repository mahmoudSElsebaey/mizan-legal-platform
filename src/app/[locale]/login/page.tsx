import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main className="min-h-[70vh] bg-stone-50 px-4 py-14 sm:py-20">
      <div className="mx-auto mb-6 max-w-md text-center">
        <a href={`/${locale}`} className="text-sm font-medium text-stone-600 underline-offset-4 hover:text-amber-800 hover:underline">
          {locale === "ar" ? "العودة إلى الموقع" : "Back to website"}
        </a>
      </div>
      <AuthForm locale={locale} mode="login" />
    </main>
  );
}
