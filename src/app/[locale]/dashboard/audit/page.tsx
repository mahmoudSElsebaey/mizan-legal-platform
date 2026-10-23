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

  return <main className="mizan-dashboard-page min-h-screen bg-[#f7f4ed] px-4 py-6 sm:px-6 sm:py-9" dir={ar ? "rtl" : "ltr"}>
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / SECURITY</p>
      <h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{ar ? "سجل التدقيق" : "Audit log"}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657184]">{ar ? "سجل واضح للتغييرات الإدارية التي تمت على حسابات الموظفين والخدمات وإعدادات المكتب. يُعرض أحدث 100 حدث." : "A readable record of administrative changes to staff accounts, services, and office settings. The latest 100 events are shown."}</p>
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل سجل التدقيق. حاول تحديث الصفحة." : "Could not load the audit log. Try refreshing the page."}</p>}
      <section className="mt-7 overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14263d]/10 px-5 py-4">
          <h2 className="font-extrabold text-[#14263d]">{ar ? "أحدث العمليات" : "Recent activity"}</h2>
          <span className="rounded-full bg-[#176b67]/10 px-3 py-1 text-xs font-bold text-[#176b67]">{logs.length} / 100</span>
        </div>
        {!logs.length && !error ? <p className="p-8 text-center text-sm text-[#657184]">{ar ? "لا توجد تغييرات مسجلة حتى الآن." : "No recorded changes yet."}</p> :
          <div className="divide-y divide-[#14263d]/10">{logs.map((log) => {
            const data = (log.new_data ?? log.old_data ?? {}) as Record<string, unknown>;
            const table = tableLabels[log.entity_table] || { ar: log.entity_table, en: log.entity_table };
            const action = actionLabels[log.action] || { ar: log.action, en: log.action };
            const profile = log.actor_id ? profileMap.get(log.actor_id) : null;
            const staffActor = log.actor_id ? staffMap.get(log.actor_id) : null;
            const actorName = profile?.full_name?.trim() || profile?.email || (ar ? "حساب غير متاح" : "Account unavailable");
            const role = staffActor ? roleLabels[staffActor.role]?.[locale] || staffActor.role : (ar ? "عميل / مستخدم" : "Client / user");
            const statusValue = log.entity_table === "staff_members" ? textValue(data.status) : textValue(data.status);
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
            return <article key={log.id} className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#176b67]/10 px-3 py-1 text-xs font-bold text-[#176b67]">{action[locale]}</span><span className="text-sm font-extrabold text-[#14263d]">{table[locale]}</span></div>
                <p className="mt-3 text-sm font-bold text-[#14263d]">{identifier}</p>
                {title && <p className="mt-1 break-words text-sm text-[#657184]">{title}</p>}
                <p className="mt-3 text-xs text-[#657184]">{ar ? "بواسطة" : "Performed by"}</p>
                <p className="mt-1 break-words text-sm font-semibold text-[#14263d]">{actorName}</p>
                {profile?.email && profile?.full_name && <p className="mt-1 break-all text-xs text-[#657184]">{profile.email}</p>}
              </div>
              <div className="grid gap-2 rounded-xl bg-[#f7f8f5] p-3 text-sm">
                <p><span className="text-[#657184]">{ar ? "دور المنفذ: " : "Actor role: "}</span><strong className="text-[#14263d]">{role}</strong></p>
                <p><span className="text-[#657184]">{ar ? "حالة السجل: " : "Record status: "}</span><strong className="text-[#14263d]">{status}</strong></p>
                {officeDetails.map(([label, detail]) => <p key={label}><span className="text-[#657184]">{label}: </span><strong className="break-words text-[#14263d]">{detail}</strong></p>)}
                {log.entity_table === "staff_members" && <p><span className="text-[#657184]">{ar ? "الدور المسجل: " : "Assigned role: "}</span><strong>{roleLabels[textValue(data.role)]?.[locale] || textValue(data.role) || "—"}</strong></p>}
              </div>
              <time className="text-xs text-[#657184]" dateTime={log.created_at}>{fmt(log.created_at)}</time>
            </article>;
          })}</div>}
      </section>
      <p className="mt-5 text-xs leading-6 text-[#657184]">{ar ? "سجل التدقيق للقراءة فقط، وتُسجل الأحداث تلقائيًا بواسطة قاعدة البيانات." : "The audit log is read-only; events are recorded automatically by database triggers."}</p>
    </div>
  </main>;
}
