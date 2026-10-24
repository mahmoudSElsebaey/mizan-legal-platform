"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; icon: string; ar: string; en: string };

export function DashboardSidebar({ locale, isAdmin }: { locale: "ar" | "en"; isAdmin: boolean }) {
  const pathname = usePathname() || "/" + locale + "/dashboard";
  const ar = locale === "ar";
  const base = "/" + locale + "/dashboard";
  const nav: Item[] = [
    { href: "", icon: "⌂", ar: "الرئيسية", en: "Overview" },
    { href: "/cases", icon: "▤", ar: "ملفات القضايا", en: "Cases" },
    { href: "/appointments", icon: "▦", ar: "المواعيد", en: "Appointments" },
    { href: "/conversations", icon: "◌", ar: "المحادثات", en: "Conversations" },
  ];
  const adminNav: Item[] = [
    { href: "/staff", icon: "♙", ar: "الموظفون والصلاحيات", en: "Staff & access" },
    { href: "/services", icon: "⚖", ar: "الخدمات القانونية", en: "Legal services" },
    { href: "/settings", icon: "⚙", ar: "إعدادات المكتب", en: "Office settings" },
    { href: "/audit", icon: "◷", ar: "سجل التدقيق", en: "Audit log" },
  ];
  const link = (item: Item) => {
    const href = base + item.href;
    const active = item.href === "" ? pathname === base : pathname === href || pathname.startsWith(href + "/");
    return <Link key={item.href || "overview"} href={href} aria-current={active ? "page" : undefined} className={"mizan-workspace-link" + (active ? " is-active" : "")}><span>{item.icon}</span><span>{ar ? item.ar : item.en}</span></Link>;
  };
  return <aside className="mizan-workspace-sidebar" aria-label={ar ? "قائمة لوحة التحكم" : "Dashboard sidebar"}>
    <div className="mizan-workspace-sidebar-label">{ar ? "مساحة العمل" : "WORKSPACE"}</div>
    {nav.map(link)}
    {isAdmin && <><div className="mizan-workspace-sidebar-label is-spaced">{ar ? "إدارة المكتب" : "OFFICE MANAGEMENT"}</div>{adminNav.map(link)}</>}
    <div className="mizan-workspace-sidebar-bottom"><span>§</span><p>{ar ? "مساحة عمل آمنة ومنظمة" : "A considered space for legal work"}</p></div>
  </aside>;
}
