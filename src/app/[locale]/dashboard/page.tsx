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
  return <main className="mizan-dashboard-redesign" dir={locale==="ar"?"rtl":"ltr"}>
    <div className="mizan-dashboard-redesign-shell">
      <aside className="mizan-dashboard-sidebar">
        <Link href={"/"+locale} className="mizan-dashboard-logo"><span className="mizan-dashboard-logo-mark">§</span><span><strong>MIZAN</strong><small>LEGAL WORKSPACE</small></span></Link>
        <div className="mizan-dashboard-side-label">{locale==="ar"?"مساحة العمل":"WORKSPACE"}</div>
        <Link href={"/"+locale+"/dashboard"} className="mizan-dashboard-side-link is-current"><span>⌂</span>{t.dashboard}<b>↗</b></Link>
        <Link href={"/"+locale+"/dashboard/cases"} className="mizan-dashboard-side-link"><span>▤</span>{t.cases}</Link>
        <Link href={"/"+locale+"/dashboard/appointments"} className="mizan-dashboard-side-link"><span>▦</span>{t.appointments}</Link>
        <Link href={"/"+locale+"/dashboard/conversations"} className="mizan-dashboard-side-link"><span>◌</span>{t.conversations}</Link>
        {isAdmin && <><div className="mizan-dashboard-side-label">{locale==="ar"?"إدارة المكتب":"OFFICE MANAGEMENT"}</div>{t.links.map((item)=><Link key={item.href} href={"/"+locale+"/dashboard/"+item.href} className="mizan-dashboard-side-link"><span>{({"staff":"♙","services":"⚖","settings":"⚙","audit":"◷","appointments":"▦","cases":"▤","conversations":"◌"} as Record<string,string>)[item.href]||"◇"}</span>{item.title}</Link>)}</>}
        <div className="mizan-dashboard-sidebar-bottom"><div className="mizan-dashboard-help-mark">✳</div><strong>{locale==="ar"?"تحتاج إلى مساعدة؟":"Need a hand?"}</strong><p>{locale==="ar"?"تواصل مع فريق المكتب للحصول على الدعم.":"Contact the office team for support."}</p><Link href={"/"+locale+"/contact"}>{locale==="ar"?"تواصل معنا":"Contact us"} ↗</Link></div>
      </aside>
      <section className="mizan-dashboard-main">
        <header className="mizan-dashboard-topbar"><div><span className="mizan-dashboard-breadcrumb">{locale==="ar"?"مساحة العمل":"WORKSPACE"} <span>/</span> {t.dashboard}</span><h1>{t.dashboard}</h1></div><div className="mizan-dashboard-top-actions"><Link href={"/"+(locale==="ar"?"en":"ar")+"/dashboard"} className="mizan-dashboard-language">{locale==="ar"?"EN":"عربي"}</Link><span className="mizan-dashboard-top-avatar">{String(name).trim().slice(0,1).toLocaleUpperCase()}</span><div className="mizan-dashboard-user-meta"><strong>{name}</strong><small>{role}</small></div><SignOutButton locale={locale}/></div></header>
        <div className="mizan-dashboard-welcome"><div><span className="mizan-dashboard-overline">{locale==="ar"?"بوابتك القانونية الشخصية":"YOUR LEGAL WORKSPACE"}</span><h2>{t.welcome} <em>{String(name).split(/\s+/)[0]}</em></h2><p>{isInactiveStaff?t.restricted:isAdmin?t.adminDescription:staff?t.staffNote:t.clientNote}</p></div><div className="mizan-dashboard-welcome-art"><span>§</span><i></i><b></b></div></div>
        <div className="mizan-dashboard-summary-grid">
          <article className="mizan-dashboard-summary-card"><span className="mizan-dashboard-summary-icon">✉</span><span className="mizan-dashboard-summary-label">{t.email}</span><strong className="mizan-dashboard-email">{user.email}</strong><small>{locale==="ar"?"بيانات الحساب المسجل":"Signed-in account"}</small></article>
          <article className="mizan-dashboard-summary-card"><span className="mizan-dashboard-summary-icon">♙</span><span className="mizan-dashboard-summary-label">{t.role}</span><strong>{role}</strong><small>{status ? t.status+": "+status : (locale==="ar"?"حساب عميل":"Client account")}</small></article>
          <article className="mizan-dashboard-summary-card"><span className="mizan-dashboard-summary-icon">◈</span><span className="mizan-dashboard-summary-label">{locale==="ar"?"الوصول":"ACCESS"}</span><strong>{isInactiveStaff?(locale==="ar"?"مقيّد":"Restricted"):(locale==="ar"?"متاح":"Available")}</strong><small>{locale==="ar"?"بحسب صلاحيات حسابك":"Based on your account permissions"}</small></article>
        </div>
        {isInactiveStaff ? <section className="mizan-dashboard-notice"><span>!</span><p>{t.restricted}</p></section> : <>
          <div className="mizan-dashboard-section-heading"><div><span className="mizan-dashboard-overline">{locale==="ar"?"كل ما تحتاجه في مكان واحد":"EVERYTHING IN ONE PLACE"}</span><h2>{isAdmin?t.adminTitle:(locale==="ar"?"اختصارات مساحة العمل":"Workspace shortcuts")}</h2><p>{isAdmin?t.adminDescription:(locale==="ar"?"تابع ملفاتك ومواعيدك وتواصل مع المكتب بسهولة.":"Access your case files, appointments, and conversations.")}</p></div><span className="mizan-dashboard-section-count">{isAdmin?"0"+t.links.length:"03"} {locale==="ar"?"أقسام":"SECTIONS"}</span></div>
          <div className="mizan-dashboard-feature-grid">{(isAdmin?t.links:[{href:"cases",title:t.cases,description:locale==="ar"?"تابع ملفات القضايا والتحديثات والمستندات المتاحة لك.":"Review case files, updates, and available documents."},{href:"appointments",title:t.appointments,description:locale==="ar"?"راجع مواعيدك وطلبات الحجز وتفاصيلها.":"Review appointments, booking requests, and details."},{href:"conversations",title:t.conversations,description:locale==="ar"?"تواصل مع المكتب وتابع الرسائل والإشعارات.":"Contact the office and follow messages and notifications."}]).map((item,index)=><Link key={item.href} href={"/"+locale+"/dashboard/"+item.href} className="mizan-dashboard-feature-card"><div className="mizan-dashboard-feature-top"><span className="mizan-dashboard-feature-icon">{["▤","▦","◌","♙","⚖","⚙","◷"][index%7]}</span><span className="mizan-dashboard-feature-number">0{index+1}</span></div><h3>{item.title}</h3><p>{item.description}</p><span className="mizan-dashboard-feature-cta">{locale==="ar"?"فتح القسم":"Open section"} <b>↗</b></span></Link>)}</div>
        </>}
        <footer className="mizan-dashboard-redesign-footer"><span>© MIZAN LEGAL</span><span>{locale==="ar"?"مساحة عمل آمنة ومنظمة":"A considered space for legal work"}</span><Link href={"/"+locale}>{t.home} ↗</Link></footer>
      </section>
    </div>
  </main>;
}
