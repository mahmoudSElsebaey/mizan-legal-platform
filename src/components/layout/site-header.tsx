import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function SiteHeader({ locale, officeName }: { locale: Locale; officeName: string }) {
  const ar = locale === "ar";
  const items = [
    { href: "#home", label: ar ? "الرئيسية" : "Home" },
    { href: "#services", label: ar ? "الخدمات" : "Services" },
    { href: "/office", label: ar ? "المكتب" : "The Office" },
    { href: "/lawyer", label: ar ? "المحامي" : "Lawyer" },
    { href: "/insights", label: ar ? "المقالات" : "Insights" },
    { href: "#contact", label: ar ? "تواصل معنا" : "Contact" },
  ];
  return <header className="mizan-site-header">
    <div className="mizan-site-header-inner">
      <Link href={`/${locale}`} className="mizan-site-brand" aria-label={ar ? "ميزان - الرئيسية" : "MIZAN home"}>
        <span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 39V8l19 17L43 8v31M5 8l19 17L43 8M14 39V25m20 14V25" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/></svg></span>
        <span className="mizan-site-brand-copy"><strong>MIZAN</strong><small>{ar ? "منصة قانونية" : "LEGAL PLATFORM"}</small></span>
      </Link>
      <nav className="mizan-site-nav" aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>{items.map((item) => <Link key={item.href} href={item.href.startsWith("#") ? item.href : `/${locale}${item.href}`}>{item.label}</Link>)}</nav>
      <div className="mizan-site-actions">
        <Link className="mizan-language" href={ar ? "/en" : "/ar"} lang={ar ? "en" : "ar"} aria-label={ar ? "Switch to English" : "التغيير إلى العربية"}><span aria-hidden="true">◎</span> {ar ? "EN" : "عربي"} <span aria-hidden="true">⌄</span></Link>
        <Link className="mizan-login" href={`/${locale}/login`}>{ar ? "تسجيل الدخول" : "Sign in"}</Link>
        <Link className="mizan-register" href={`/${locale}/register`}>{ar ? "إنشاء حساب" : "Create account"}</Link>
      </div>
    </div>
  </header>;
}
