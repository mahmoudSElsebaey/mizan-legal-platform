import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

type AuditLog = {
  id: number;
  actor_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  created_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

const roleLabels: Record<string, { ar: string; en: string }> = {
  owner: { ar: "مالك المكتب", en: "Office owner" },
  admin: { ar: "مدير المكتب", en: "Office administrator" },
  lawyer: { ar: "محامٍ", en: "Lawyer" },
  assistant: { ar: "مساعد", en: "Assistant" },
  client: { ar: "عميل", en: "Client" },
};
const statusLabels: Record<string, { ar: string; en: string }> = {
  active: { ar: "نشط", en: "Active" },
  pending: { ar: "قيد المراجعة", en: "Pending" },
  suspended: { ar: "موقوف", en: "Suspended" },
  open: { ar: "مفتوح", en: "Open" },
  closed: { ar: "مغلق", en: "Closed" },
};
const tableLabels: Record<string, { ar: string; en: string }> = {
  office_settings: { ar: "إعدادات المكتب", en: "Office settings" },
  office_services: { ar: "الخدمات القانونية", en: "Legal services" },
  staff_members: { ar: "حسابات الموظفين والصلاحيات", en: "Staff accounts & permissions" },
  profiles: { ar: "بيانات الحساب", en: "Account profile" },
};
const actionLabels: Record<string, { ar: string; en: string }> = {
  INSERT: { ar: "إنشاء", en: "Created" },
  UPDATE: { ar: "تعديل", en: "Updated" },
  DELETE: { ar: "حذف", en: "Deleted" },
};

function textValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

export default async function AuditLogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: actor } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  if (!actor || actor.status !== "active" || !["owner", "admin"].includes(actor.role)) redirect(`/${locale}/dashboard`);

  const { data: rawLogs, error } = await supabase.from("audit_logs")
    .select("id,actor_id,action,entity_table,entity_id,created_at,old_data,new_data")
    .order("created_at", { ascending: false }).limit(100);
  const logs = (rawLogs || []) as AuditLog[];
  const actorIds = Array.from(new Set(logs.map((log) => log.actor_id).filter((id): id is string => !!id)));
  const [{ data: profiles }, { data: staffRows }] = actorIds.length ? await Promise.all([
    supabase.from("profiles").select("id,full_name,email").in("id", actorIds),
    supabase.from("staff_members").select("profile_id,role,status").in("profile_id", actorIds),
  ]) : [{ data: [] as { id: string; full_name: string | null; email: string | null }[] }, { data: [] as { profile_id: string; role: string; status: string }[] }];
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const staffMap = new Map((staffRows || []).map((row) => [row.profile_id, row]));
  const fmt = (value: string) => new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(value));

  const insertLabel = ar ? "إنشاء" : "Created";
  const updateLabel = ar ? "تعديل" : "Updated";
  const deleteLabel = ar ? "حذف" : "Deleted";
  const insertCount = logs.filter((log) => log.action === "INSERT").length;
  const updateCount = logs.filter((log) => log.action === "UPDATE").length;
  const deleteCount = logs.filter((log) => log.action === "DELETE").length;
  const navItems = [
    { href: "", icon: "⌂", ar: "الرئيسية", en: "Overview" },
    { href: "/cases", icon: "▤", ar: "ملفات القضايا", en: "Cases" },
    { href: "/appointments", icon: "▦", ar: "المواعيد", en: "Appointments" },
    { href: "/conversations", icon: "◌", ar: "المحادثات", en: "Conversations" },
    { href: "/notifications", icon: "♧", ar: "الإشعارات", en: "Notifications" },
    { href: "/staff", icon: "♙", ar: "المستخدمون والصلاحيات", en: "Users & access" },
    { href: "/services", icon: "⚖", ar: "الخدمات القانونية", en: "Legal services" },
    { href: "/settings", icon: "⚙", ar: "إعدادات المكتب", en: "Office settings" },
    { href: "/audit", icon: "◷", ar: "سجل التدقيق", en: "Audit log" },
  ];

  return (
    <main className="mizan-dashboard-page min-h-screen overflow-hidden bg-[#f4f2ec] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl">
        <nav className="mizan-dashboard-page-nav mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar ? "التنقل داخل لوحة التحكم" : "Dashboard navigation"}>
          {navItems.filter((item) => !["/staff", "/services", "/settings", "/audit"].includes(item.href) || ["owner", "admin"].includes(actor.role)).map((item) => (
            <a key={item.href || "overview"} href={"/" + locale + "/dashboard" + item.href} aria-current={item.href === "/audit" ? "page" : undefined}>{item.icon} <span>{item[locale]}</span></a>
          ))}
        </nav>

        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96" />
          <div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-1 w-36 bg-[#d8b878]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <p className="text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / SECURITY</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar ? "سجل التدقيق" : "Audit log"}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{ar ? "تابع التغييرات الإدارية على إعدادات المكتب والخدمات وحسابات الموظفين من سجل واحد واضح. تُعرض أحدث 100 عملية مسجلة." : "Review administrative changes to office settings, services and staff accounts in one clear record. The latest 100 events are displayed."}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#d8b878]/35 bg-[#d8b878]/10 px-4 py-3 text-sm font-bold text-[#f1dfb7]"><span className="h-2 w-2 rounded-full bg-[#d8b878]" />{ar ? "سجل للقراءة فقط" : "Read-only log"}</span>
              <span className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white">{logs.length} / 100</span>
            </div>
          </div>
        </section>

        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل سجل التدقيق. تحقق من إعدادات قاعدة البيانات ثم حاول تحديث الصفحة." : "Could not load the audit log. Check your database configuration and refresh the page."}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#657184]">{ar ? "إجمالي الأحداث المعروضة" : "Events displayed"}</p><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-black tabular-nums text-[#14263d]">{logs.length}</strong><span className="rounded-xl bg-[#14263d]/5 p-2 text-xl text-[#14263d]">◷</span></div><p className="mt-2 text-xs text-[#657184]">{ar ? "من أحدث 100 حدث" : "Of the latest 100 events"}</p></div>
          <div className="rounded-2xl border border-[#176b67]/15 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#657184]">{ar ? "عمليات الإنشاء" : "Created records"}</p><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-black tabular-nums text-[#176b67]">{insertCount}</strong><span className="rounded-xl bg-[#176b67]/10 p-2 text-xl text-[#176b67]">＋</span></div><p className="mt-2 text-xs text-[#657184]">{insertLabel}</p></div>
          <div className="rounded-2xl border border-[#d8b878]/35 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#657184]">{ar ? "عمليات التعديل" : "Updated records"}</p><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-black tabular-nums text-[#9a7130]">{updateCount}</strong><span className="rounded-xl bg-[#fbf3df] p-2 text-xl text-[#9a7130]">✎</span></div><p className="mt-2 text-xs text-[#657184]">{updateLabel}</p></div>
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-[#657184]">{ar ? "عمليات الحذف" : "Deleted records"}</p><div className="mt-3 flex items-end justify-between gap-3"><strong className="text-3xl font-black tabular-nums text-red-700">{deleteCount}</strong><span className="rounded-xl bg-red-50 p-2 text-xl text-red-700">⌫</span></div><p className="mt-2 text-xs text-[#657184]">{deleteLabel}</p></div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-[#14263d]/10 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#14263d]/10 bg-[#fbfaf7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{ar ? "مراجعة النشاط" : "ACTIVITY REVIEW"}</p><h2 className="mt-1 text-xl font-black text-[#14263d] sm:text-2xl">{ar ? "أحدث العمليات" : "Recent activity"}</h2><p className="mt-2 text-sm text-[#657184]">{ar ? "كل عملية تعرض المنفذ ونوع التغيير والوقت المسجل." : "Each event shows the actor, change type and recorded time."}</p></div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#176b67]/10 px-3 py-1.5 text-xs font-extrabold text-[#176b67]"><span className="h-2 w-2 rounded-full bg-[#176b67]" />{ar ? "أحدث أولًا" : "Newest first"}</span>
          </div>
          {!logs.length && !error ? (
            <div className="px-5 py-14 text-center sm:px-8"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f2ec] text-2xl text-[#176b67]">◷</span><h3 className="mt-4 font-extrabold text-[#14263d]">{ar ? "لا توجد تغييرات مسجلة حتى الآن" : "No recorded changes yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#657184]">{ar ? "ستظهر هنا الأحداث الإدارية التي تسجلها قاعدة البيانات عند حدوث تغييرات." : "Database-recorded administrative events will appear here as changes occur."}</p></div>
          ) : (
            <div className="divide-y divide-[#14263d]/10">
              {logs.map((log) => {
                const data = (log.new_data ?? log.old_data ?? {}) as Record<string, unknown>;
                const table = tableLabels[log.entity_table] || { ar: log.entity_table, en: log.entity_table };
                const action = actionLabels[log.action] || { ar: log.action, en: log.action };
                const profile = log.actor_id ? profileMap.get(log.actor_id) : null;
                const staffActor = log.actor_id ? staffMap.get(log.actor_id) : null;
                const actorName = profile?.full_name?.trim() || profile?.email || (ar ? "حساب غير متاح" : "Account unavailable");
                const role = staffActor ? roleLabels[staffActor.role]?.[locale] || staffActor.role : (ar ? "عميل / مستخدم" : "Client / user");
                const statusValue = textValue(data.status);
                const status = statusValue ? (statusLabels[statusValue]?.[locale] || statusValue) : (ar ? "لا ينطبق على هذا النوع" : "Not applicable");
                const isOfficeProfile = log.entity_table === "office_settings" && (log.entity_id === "office.profile" || data.key === "office.profile");
                const identifier = isOfficeProfile ? (ar ? "ملف المكتب العام" : "Public office profile") : log.entity_id || (ar ? "غير محدد" : "Not specified");
                const value = (data.value && typeof data.value === "object" ? data.value : {}) as Record<string, unknown>;
                const title = isOfficeProfile
                  ? textValue(ar ? value.nameAr : value.nameEn) || textValue(value.nameAr) || textValue(value.nameEn) || (ar ? "بيانات التعريف والتواصل للمكتب" : "Office identity and contact details")
                  : textValue(data.title_ar) || textValue(data.title_en) || textValue(data.title) || textValue(data.full_name) || textValue(data.email) || textValue(data.slug) || "";
                const officeDetails = isOfficeProfile ? [
                  [ar ? "اسم المكتب" : "Office name", textValue(ar ? value.nameAr : value.nameEn) || textValue(value.nameAr) || textValue(value.nameEn)],
                  [ar ? "البريد الإلكتروني" : "Email", textValue(value.email)],
                  [ar ? "الهاتف" : "Phone", textValue(value.phone)],
                  [ar ? "العنوان" : "Address", textValue(ar ? value.addressAr : value.addressEn) || textValue(value.addressAr) || textValue(value.addressEn)],
                ].filter((entry) => entry[1]) : [];
                return (
                  <article key={log.id} className="grid gap-4 p-4 transition hover:bg-[#fbfaf7] sm:p-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2"><span className={"rounded-full px-3 py-1 text-xs font-extrabold " + (log.action === "DELETE" ? "bg-red-50 text-red-700" : log.action === "UPDATE" ? "bg-[#fbf3df] text-[#8b682e]" : "bg-[#176b67]/10 text-[#176b67]")}>{action[locale]}</span><span className="text-sm font-extrabold text-[#14263d]">{table[locale]}</span></div>
                      <p className="mt-3 break-words text-sm font-bold text-[#14263d]">{identifier}</p>
                      {title && <p className="mt-1 break-words text-sm leading-6 text-[#657184]">{title}</p>}
                      <div className="mt-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8b878]/50 bg-[#fbf3df] text-sm font-black text-[#14263d]">{actorName.charAt(0).toLocaleUpperCase()}</span><div className="min-w-0"><p className="text-[11px] font-semibold text-[#657184]">{ar ? "تمت العملية بواسطة" : "Performed by"}</p><p className="mt-1 break-words text-sm font-bold text-[#14263d]">{actorName}</p>{profile?.email && profile?.full_name && <p className="mt-1 break-all text-xs text-[#657184]">{profile.email}</p>}</div></div>
                    </div>
                    <div className="grid content-start gap-2 rounded-2xl border border-[#14263d]/5 bg-[#f7f8f5] p-4 text-sm">
                      <p><span className="text-[#657184]">{ar ? "دور المنفذ: " : "Actor role: "}</span><strong className="text-[#14263d]">{role}</strong></p>
                      <p><span className="text-[#657184]">{ar ? "حالة السجل: " : "Record status: "}</span><strong className="text-[#14263d]">{status}</strong></p>
                      {officeDetails.map(([label, detail]) => <p key={label}><span className="text-[#657184]">{label}: </span><strong className="break-words text-[#14263d]">{detail}</strong></p>)}
                      {log.entity_table === "staff_members" && <p><span className="text-[#657184]">{ar ? "الدور المسجل: " : "Assigned role: "}</span><strong className="text-[#14263d]">{roleLabels[textValue(data.role)]?.[locale] || textValue(data.role) || "—"}</strong></p>}
                    </div>
                    <time className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#14263d]/10 bg-white px-3 py-2 text-xs font-semibold text-[#657184]" dateTime={log.created_at}><span aria-hidden="true">◷</span>{fmt(log.created_at)}</time>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <footer className="mt-5 flex flex-col gap-2 rounded-2xl border border-[#14263d]/10 bg-white/70 px-4 py-4 text-xs leading-6 text-[#657184] sm:flex-row sm:items-center sm:justify-between sm:px-5"><span>{ar ? "سجل التدقيق للقراءة فقط، وتُسجل الأحداث تلقائيًا بواسطة قاعدة البيانات." : "The audit log is read-only; events are recorded automatically by database triggers."}</span><span className="font-bold text-[#176b67]">{ar ? "الوصول مخصص لمالك المكتب والمدير" : "Restricted to owner and administrator"}</span></footer>
      </div>
    </main>
  );
}
