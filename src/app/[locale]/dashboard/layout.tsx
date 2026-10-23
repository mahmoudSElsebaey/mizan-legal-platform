import Link from "next/link";
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
  const items = [
    { href: `/${locale}/dashboard`, label: ar ? "نظرة عامة" : "Overview" },
    { href: `/${locale}/dashboard/cases`, label: ar ? "القضايا" : "Cases" },
    { href: `/${locale}/dashboard/appointments`, label: ar ? "المواعيد" : "Appointments" },
    { href: `/${locale}/dashboard/conversations`, label: ar ? "المحادثات" : "Messages" },
  ];

  return (
    <div className="mizan-dashboard" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <header className="mizan-dashboard-header">
        <div className="mizan-dashboard-header-inner">
          <Link href={`/${locale}/dashboard`} className="mizan-dashboard-brand" aria-label={ar ? "ميزان - لوحة التحكم" : "MIZAN dashboard"}>
            <span className="mizan-brand-symbol" aria-hidden="true">M</span>
            <span>
              <strong>MIZAN</strong>
              <small>{ar ? "مساحة العمل القانونية" : "LEGAL WORKSPACE"}</small>
            </span>
          </Link>
          <nav className="mizan-dashboard-nav" aria-label={ar ? "التنقل داخل لوحة التحكم" : "Dashboard navigation"}>
            {items.map((item) => (
              <Link key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
          <Link href={`/${locale}`} className="mizan-dashboard-home">{ar ? "الموقع العام ↗" : "Public site ↗"}</Link>
        </div>
      </header>
      <div className="mizan-dashboard-content">{children}</div>
      <footer className="mizan-dashboard-footer">
        <span>MIZAN · {ar ? "وضوح في كل خطوة" : "Clarity in every step"}</span>
        <Link href={`/${locale}`}>{ar ? "العودة إلى الموقع" : "Back to website"}</Link>
      </footer>
    </div>
  );
}
