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
    clientNote:"تابع ملفات القضايا والتحديثات والمستندات التي يشاركها المكتب معك.",
    staffNote:"تابع القضايا المسندة إليك، وسجل التحديثات، والمستندات المصرح بها.",
    adminTitle:"إدارة المكتب", adminDescription:"إدارة حسابات المكتب والخدمات والإعدادات ومراجعة سجل التغييرات.",
    links:[{href:"staff",title:"المستخدمون والصلاحيات",description:"إدارة أدوار الموظفين وحالات الوصول."},{href:"services",title:"الخدمات القانونية",description:"إدارة مجالات الممارسة والنشر على الموقع."},{href:"settings",title:"إعدادات المكتب",description:"تحديث بيانات التعريف الأساسية للمكتب."},{href:"audit",title:"سجل التدقيق",description:"مراجعة التغييرات الإدارية الأخيرة."},{href:"appointments",title:"المواعيد والحجوزات",description:"متابعة طلبات المواعيد والحجوزات."},{href:"cases",title:"ملفات القضايا",description:"إدارة القضايا وسجل التحديثات والمستندات."},{href:"conversations",title:"المحادثات والإشعارات",description:"التواصل الآمن مع العملاء ومتابعة الإشعارات."}],
    home:"العودة إلى الموقع", appointments:"المواعيد والحجوزات", cases:"ملفات القضايا", conversations:"المحادثات والإشعارات", restricted:"حساب الموظف غير نشط. تواصل مع مالك المكتب لمراجعة صلاحياتك."
  },
  en: {
    dashboard:"Dashboard",welcome:"Welcome back,",email:"Email address",role:"Account type",status:"Status",
    roles:{owner:"Office owner",admin:"Administrator",lawyer:"Lawyer",assistant:"Assistant",client:"Client"},
    statuses:{pending:"Pending",suspended:"Suspended",active:"Active"},
    clientNote:"Track case files, updates, and documents shared with you by the office.",
    staffNote:"Review assigned cases, case timelines, and documents you are authorized to access.",
    adminTitle:"Office administration",adminDescription:"Manage office accounts, services, settings, and review the audit trail.",
    links:[{href:"staff",title:"Users & access",description:"Manage staff roles and access status."},{href:"services",title:"Legal services",description:"Manage practice areas and public publishing."},{href:"settings",title:"Office settings",description:"Update the firm's core profile details."},{href:"audit",title:"Audit log",description:"Review recent administrative changes."},{href:"appointments",title:"Appointments",description:"Review appointment requests and bookings."},{href:"cases",title:"Case workspaces",description:"Manage cases, timelines, and confidential documents."},{href:"conversations",title:"Conversations & notifications",description:"Secure client communication and in-app notifications."}],
    home:"Return to website",appointments:"Appointments & bookings",cases:"Case workspaces",conversations:"Conversations & notifications",restricted:"Your staff account is inactive. Contact the office owner to review your access."
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
  const firstName = String(name).trim().split(/\\s+/)[0];
  const adminIcons: Record<string, string> = { staff: "♙", services: "⚖", settings: "⚙", audit: "◷", appointments: "▦", cases: "▤", conversations: "◌" };
  const clientItems = [
    { href: "cases", title: t.cases, description: locale === "ar" ? "تابع ملفات القضايا والتحديثات والمستندات المتاحة لك." : "Review case files, updates, and available documents.", icon: "▤" },
    { href: "appointments", title: t.appointments, description: locale === "ar" ? "راجع مواعيدك وطلبات الحجز وتفاصيلها." : "Review appointments, booking requests, and details.", icon: "▦" },
    { href: "conversations", title: locale === "ar" ? "المحادثات" : "Conversations", description: locale === "ar" ? "تواصل مع المكتب وتابع رسائلك." : "Contact the office and follow your messages.", icon: "◌" },
    { href: "notifications", title: locale === "ar" ? "الإشعارات" : "Notifications", description: locale === "ar" ? "اطّلع على التنبيهات والتحديثات الخاصة بحسابك." : "View alerts and updates related to your account.", icon: "♧" },
  ];
  const featureItems = isAdmin
    ? [...t.links.map((item) => ({ ...item, icon: adminIcons[item.href] || "◇" })), { href: "notifications", title: locale === "ar" ? "الإشعارات" : "Notifications", description: locale === "ar" ? "متابعة التنبيهات والتحديثات المهمة." : "Keep track of important alerts and updates.", icon: "♧" }]
    : clientItems;

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#14263d]" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="mx-auto min-h-screen max-w-[1600px]">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#14263d]/10 bg-white px-4 py-3 shadow-sm sm:px-5">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{locale === "ar" ? "مساحة العمل" : "WORKSPACE"} / MIZAN</p><h1 className="mt-1 text-xl font-black sm:text-2xl">{t.dashboard}</h1></div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3"><Link href={"/" + (locale === "ar" ? "en" : "ar") + "/dashboard"} className="rounded-xl border border-[#14263d]/10 px-3 py-2 text-xs font-extrabold hover:border-[#176b67]/40">{locale === "ar" ? "EN" : "عربي"}</Link><div className="flex max-w-[190px] items-center gap-2 rounded-xl bg-[#f4f2ec] px-2 py-2 sm:px-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8b878]/60 bg-white text-sm font-black">{String(name).trim().slice(0, 1).toLocaleUpperCase()}</span><span className="min-w-0"><strong className="block truncate text-xs font-extrabold sm:text-sm">{name}</strong><small className="block truncate text-[10px] text-[#657184]">{role}</small></span></div><SignOutButton locale={locale}/></div>
          </header>

          <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10 lg:py-11">
            <div aria-hidden="true" className="pointer-events-none absolute -end-10 -top-20 h-64 w-64 rounded-full border border-[#d8b878]/25 sm:h-80 sm:w-80"/><div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-12 h-48 w-48 rounded-full border border-[#d8b878]/15 sm:h-64 sm:w-64"/><div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-1 w-32 bg-[#d8b878] sm:w-48"/>
            <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-[#d8b878]/30 bg-white/5 px-3 py-1.5 text-[10px] font-black tracking-[.18em] text-[#e4d1a7]"><span className="h-1.5 w-1.5 rounded-full bg-[#d8b878]"/>{locale === "ar" ? "بوابتك القانونية الشخصية" : "YOUR LEGAL WORKSPACE"}</span><h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{t.welcome} <span className="text-[#e4d1a7]">{firstName}</span></h2><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{isInactiveStaff ? t.restricted : isAdmin ? t.adminDescription : staff ? t.staffNote : t.clientNote}</p>{isInactiveStaff && <div role="alert" className="mt-5 rounded-xl border border-red-200/30 bg-red-500/10 p-3 text-sm text-red-100">{t.restricted}</div>}</div><div className="flex flex-wrap gap-2"><Link href={"/" + locale + "/contact"} className="rounded-xl bg-[#d8b878] px-4 py-3 text-sm font-extrabold text-[#14263d] transition hover:bg-[#ead7a8]">{locale === "ar" ? "طلب مساعدة" : "Get support"} ↗</Link><Link href={"/" + locale} className="rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10">{t.home}</Link></div></div>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[#657184]">{t.email}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f2ed] text-lg text-[#176b67]">✉</span></div><strong className="mt-4 block break-all text-sm font-extrabold">{user.email}</strong><p className="mt-2 text-xs text-[#657184]">{locale === "ar" ? "الحساب المستخدم لتسجيل الدخول" : "Account used to sign in"}</p></article>
            <article className="rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[#657184]">{t.role}</span><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbf3df] text-lg text-[#9a7130]">♙</span></div><strong className="mt-4 block text-lg font-black">{role}</strong><p className="mt-2 text-xs text-[#657184]">{status ? t.status + ": " + status : (locale === "ar" ? "حساب عميل" : "Client account")}</p></article>
            <article className="rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-[#657184]">{locale === "ar" ? "حالة الوصول" : "Access status"}</span><span className={"flex h-10 w-10 items-center justify-center rounded-xl " + (isInactiveStaff ? "bg-red-50 text-red-700" : "bg-[#e5f2ed] text-[#176b67]")}>◈</span></div><strong className="mt-4 block text-lg font-black">{isInactiveStaff ? (locale === "ar" ? "مقيّد" : "Restricted") : (locale === "ar" ? "متاح" : "Available")}</strong><p className="mt-2 text-xs text-[#657184]">{locale === "ar" ? "وفقًا لصلاحيات حسابك الحالية" : "Based on your current permissions"}</p></article>
          </section>

          {!isInactiveStaff && <section className="mt-8"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{locale === "ar" ? "وصول سريع" : "QUICK ACCESS"}</p><h2 className="mt-1 text-2xl font-black">{isAdmin ? t.adminTitle : (locale === "ar" ? "اختصارات مساحة العمل" : "Workspace shortcuts")}</h2><p className="mt-2 text-sm leading-6 text-[#657184]">{isAdmin ? t.adminDescription : (locale === "ar" ? "كل أدوات عملك القانونية في مكان واحد." : "Your legal workspace tools, all in one place.")}</p></div><span className="w-fit rounded-full border border-[#14263d]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#657184]">{featureItems.length} {locale === "ar" ? "أقسام" : "sections"}</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{featureItems.map((item,index)=><Link key={item.href} href={"/"+locale+"/dashboard/"+item.href} className="group flex min-h-[205px] flex-col rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#176b67]/30 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f4f2ec] text-xl text-[#176b67] transition group-hover:bg-[#14263d] group-hover:text-[#e4d1a7]">{item.icon}</span><span className="text-xs font-black tracking-widest text-[#c2a46b]">0{index+1}</span></div><h3 className="mt-5 text-base font-extrabold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#657184]">{item.description}</p><span className="mt-auto flex items-center justify-between pt-5 text-xs font-extrabold text-[#176b67]"><span>{locale === "ar" ? "فتح القسم" : "Open section"}</span><span>{locale === "ar" ? "↙" : "↗"}</span></span></Link>)}</div></section>}

          <footer className="mt-8 flex flex-col gap-2 border-t border-[#14263d]/10 py-5 text-xs text-[#657184] sm:flex-row sm:items-center sm:justify-between"><span className="font-black tracking-[.16em] text-[#14263d]">© MIZAN LEGAL</span><span>{locale === "ar" ? "مساحة عمل آمنة ومنظمة" : "A considered space for legal work"}</span><Link href={"/"+locale} className="font-bold text-[#176b67] hover:underline">{t.home} ↗</Link></footer>
      </div>
    </main>
  );
}
