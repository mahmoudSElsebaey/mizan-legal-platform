import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
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
  const isAdmin = staff?.status === "active" && ["owner", "admin"].includes(staff.role);
  return <div className="mizan-dashboard" dir={ar ? "rtl" : "ltr"} lang={locale}>
    <DashboardHeader locale={locale} />
    <div className="mizan-dashboard-workspace">
      <DashboardSidebar locale={locale} isAdmin={isAdmin} />
      <main className="mizan-dashboard-content">{children}</main>
    </div>
  </div>;
}
