import { DashboardHeader } from "@/components/layout/dashboard-header";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

export default async function DashboardLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";

  return (
    <div className="mizan-dashboard" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <DashboardHeader locale={locale} />
      <div className="mizan-dashboard-content">{children}</div>

    </div>
  );
}
