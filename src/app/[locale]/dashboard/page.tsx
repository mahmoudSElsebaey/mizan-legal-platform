import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const copy = {
  ar: {
    dashboard:"لوحة التحكم", welcome:"مرحبًا بعودتك،", email:"البريد الإلكتروني", role:"نوع الحساب", status:"الحالة",
    roles:{owner:"مالك المكتب",admin:"مدير",lawyer:"محامٍ",assistant:"مساعد",client:"عميل"},
    statuses:{pending:"قيد المراجعة",suspended:"موقوف",active:"نشط"},
    clientNote:"حسابك جاهز. ستظهر هنا الحجوزات والمحادثات والملفات عندما تكتمل مراحلها.",
    staffNote:"لوحة العمل المتخصصة لهذا الدور ستُفعّل مع مراحل مساحة العمل والمواعيد.",
    adminTitle:"إدارة المكتب", adminDescription:"إدارة حسابات المكتب والخدمات والإعدادات ومراجعة سجل التغييرات.",
    links:[{href:"staff",title:"المستخدمون والصلاحيات",description:"إدارة أدوار الموظفين وحالات الوصول."},{href:"services",title:"الخدمات القانونية",description:"إدارة مجالات الممارسة والنشر على الموقع."},{href:"settings",title:"إعدادات المكتب",description:"تحديث بيانات التعريف الأساسية للمكتب."},{href:"audit",title:"سجل التدقيق",description:"مراجعة التغييرات الإدارية الأخيرة."}],
    home:"العودة إلى الموقع", restricted:"حساب الموظف غير نشط. تواصل مع مالك المكتب لمراجعة صلاحياتك."
  },
  en: {
    dashboard:"Dashboard",welcome:"Welcome back,",email:"Email address",role:"Account type",status:"Status",
    roles:{owner:"Office owner",admin:"Administrator",lawyer:"Lawyer",assistant:"Assistant",client:"Client"},
    statuses:{pending:"Pending",suspended:"Suspended",active:"Active"},
    clientNote:"Your account is ready. Appointments, conversations, and case files will appear as those features are delivered.",
    staffNote:"The dedicated workspace for this role will be enabled in the upcoming workspace and appointments phases.",
    adminTitle:"Office administration",adminDescription:"Manage office accounts, services, settings, and review the audit trail.",
    links:[{href:"staff",title:"Users & access",description:"Manage staff roles and access status."},{href:"services",title:"Legal services",description:"Manage practice areas and public publishing."},{href:"settings",title:"Office settings",description:"Update the firm's core profile details."},{href:"audit",title:"Audit log",description:"Review recent administrative changes."}],
    home:"Return to website",restricted:"Your staff account is inactive. Contact the office owner to review your access."
  }
} as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(`/${locale}/login`);
  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("full_name, locale").eq("id", user.id).maybeSingle(),
    supabase.from("staff_members").select("role, status").eq("profile_id", user.id).maybeSingle()
  ]);
  const t = copy[locale];
  const role = staff?.role && staff.role in t.roles ? t.roles[staff.role as keyof typeof t.roles] : t.roles.client;
  const status = staff?.status && staff.status in t.statuses ? t.statuses[staff.status as keyof typeof t.statuses] : null;
  const name = profile?.full_name || user.email || (locale === "ar" ? "حسابك" : "Your account");
  const isAdmin = !!staff && staff.status === "active" && ["owner","admin"].includes(staff.role);
  const isInactiveStaff = !!staff && staff.status !== "active";
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={locale==="ar"?"rtl":"ltr"}>
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-[#14263d]/10 bg-white p-6 sm:p-9">
        <div><p className="text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / ACCOUNT</p><h1 className="mt-3 text-3xl font-black text-[#14263d] sm:text-4xl">{t.dashboard}</h1><p className="mt-3 text-[#657184]">{t.welcome} <span className="font-bold text-[#14263d]">{name}</span></p></div>
        <SignOutButton locale={locale}/>
      </header>
      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5"><p className="text-sm text-[#657184]">{t.email}</p><p className="mt-2 break-all font-bold text-[#14263d]">{user.email}</p></div>
        <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5"><p className="text-sm text-[#657184]">{t.role}</p><p className="mt-2 font-bold text-[#14263d]">{role}</p>{status && <p className="mt-1 text-xs text-[#657184]">{t.status}: {status}</p>}</div>
      </section>
      {isAdmin ? <section className="mt-10"><div className="mb-5"><h2 className="text-2xl font-black text-[#14263d]">{t.adminTitle}</h2><p className="mt-2 text-sm leading-7 text-[#657184]">{t.adminDescription}</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{t.links.map((item)=> <Link key={item.href} href={`/${locale}/dashboard/${item.href}`} className="group rounded-2xl border border-[#14263d]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-[#176b67]/40"><span className="text-xs font-black tracking-widest text-[#b99a62]">MIZAN / 0{t.links.findIndex((link)=>link.href===item.href)+1}</span><h3 className="mt-5 font-extrabold text-[#14263d] group-hover:text-[#176b67]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#657184]">{item.description}</p></Link>)}</div></section>
      : <section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-6 leading-7 text-[#657184]">{isInactiveStaff ? t.restricted : staff ? t.staffNote : t.clientNote}</section>}
      <div className="mt-8 border-t border-[#14263d]/10 pt-6"><Link href={`/${locale}`} className="font-bold text-[#176b67] hover:underline">{t.home}</Link></div>
    </div>
  </main>;
}
