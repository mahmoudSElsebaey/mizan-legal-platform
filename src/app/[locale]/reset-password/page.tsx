import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocale } from "@/lib/i18n/config";

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <main className="min-h-[70vh] bg-stone-50 px-4 py-14 sm:py-20"><AuthForm locale={locale} mode="reset-password" /></main>;
}
