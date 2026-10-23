import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { createClient } from "@/lib/supabase/server";
import { isLocale } from "@/lib/i18n/config";

export default async function DashboardLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: staff } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  const isAdmin = staff?.status === "active" && ["owner", "admin"].includes(staff.role);
  const nav = [
    { href: "", icon: "⌂", ar: "الرئيسية", en: "Overview" },
    { href: "/cases", icon: "▤", ar: "ملفات القضايا", en: "Cases" },
    { href: "/appointments", icon: "▦", ar: "المواعيد", en: "Appointments" },
    { href: "/conversations", icon: "◌", ar: "المحادثات", en: "Conversations" },
  ];
  const adminNav = [
    { href: "/staff", icon: "♙", ar: "الموظفون والصلاحيات", en: "Staff & access" },
    { href: "/services", icon: "⚖", ar: "الخدمات القانونية", en: "Legal services" },
    { href: "/settings", icon: "⚙", ar: "إعدادات المكتب", en: "Office settings" },
    { href: "/audit", icon: "◷", ar: "سجل التدقيق", en: "Audit log" },
  ];
  return <div className="mizan-dashboard" dir={ar ? "rtl" : "ltr"} lang={locale}>
    <DashboardHeader locale={locale} />
    <div className="mizan-dashboard-workspace">
      <aside className="mizan-workspace-sidebar" aria-label={ar ? "قائمة لوحة التحكم" : "Dashboard sidebar"}>
        <div className="mizan-workspace-sidebar-label">{ar ? "مساحة العمل" : "WORKSPACE"}</div>
        {nav.map((item) => <Link key={item.href || "overview"} href={`/${locale}/dashboard${item.href}`} className={item.href === "" ? "mizan-workspace-link is-overview" : "mizan-workspace-link"}><span>{item.icon}</span><span>{ar ? item.ar : item.en}</span></Link>)}
        {isAdmin && <>
          <div className="mizan-workspace-sidebar-label is-spaced">{ar ? "إدارة المكتب" : "OFFICE MANAGEMENT"}</div>
          {adminNav.map((item) => <Link key={item.href} href={`/${locale}/dashboard${item.href}`} className="mizan-workspace-link"><span>{item.icon}</span><span>{ar ? item.ar : item.en}</span></Link>)}
        </>}
        <div className="mizan-workspace-sidebar-bottom"><span>§</span><p>{ar ? "مساحة عمل آمنة ومنظمة" : "A considered space for legal work"}</p></div>
      </aside>
      <main className="mizan-dashboard-content">{children}</main>
    </div>
  </div>;
}
