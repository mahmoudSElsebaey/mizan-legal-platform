import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export default async function AuditLogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; if (!isLocale(locale)) notFound();
  const ar = locale === "ar"; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: actor } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  if (!actor || actor.status !== "active" || !["owner","admin"].includes(actor.role)) redirect(`/${locale}/dashboard`);
  const { data: logs, error } = await supabase.from("audit_logs").select("id,actor_id,action,entity_table,entity_id,created_at,old_data,new_data").order("created_at",{ascending:false}).limit(100);
  const actionLabels: Record<string,{ar:string;en:string}> = { INSERT:{ar:"إنشاء",en:"Created"}, UPDATE:{ar:"تعديل",en:"Updated"}, DELETE:{ar:"حذف",en:"Deleted"} };
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar?"rtl":"ltr"}><div className="mx-auto max-w-6xl">
    <Link href={`/${locale}/dashboard`} className="text-sm font-bold text-[#176b67] hover:underline">{ar?"← لوحة التحكم":"← Dashboard"}</Link>
    <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / SECURITY</p><h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{ar?"سجل التدقيق":"Audit log"}</h1>
    <p className="mt-3 leading-7 text-[#657184]">{ar?"سجل للعمليات التي تغير صلاحيات الموظفين أو الخدمات أو إعدادات المكتب. يُعرض أحدث 100 حدث.":"A trace of staff access, practice-area, and office-setting changes. The latest 100 events are shown."}</p>
    {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar?"تعذر قراءة السجل. تأكد من تطبيق ترحيل المرحلة الرابعة.":"Could not read audit history. Confirm the Phase 4 migration is applied."}</p>}
    <section className="mt-8 overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white"><div className="border-b border-[#14263d]/10 px-5 py-4"><h2 className="font-extrabold text-[#14263d]">{ar?"الأحداث الأخيرة":"Recent events"} ({logs?.length??0})</h2></div>
      {!logs?.length && !error ? <p className="p-8 text-center text-sm text-[#657184]">{ar?"لا توجد تغييرات مسجلة حتى الآن.":"No recorded changes yet."}</p> : <div className="divide-y divide-[#14263d]/10">{(logs??[]).map((log)=>{ const data = (log.new_data ?? log.old_data ?? {}) as Record<string,unknown>; const label = actionLabels[log.action] ?? {ar:log.action,en:log.action}; return <article key={log.id} className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#176b67]/10 px-3 py-1 text-xs font-bold text-[#176b67]">{label[locale]}</span><span className="text-sm font-extrabold text-[#14263d]">{log.entity_table}</span></div><p className="mt-2 break-all text-xs text-[#657184]">{ar?"المعرّف: ":"Entity ID: "}{log.entity_id??"—"}</p><p className="mt-1 break-all text-xs text-[#657184]">{ar?"بواسطة: ":"Actor: "}{log.actor_id??(ar?"غير معروف":"Unknown")}</p></div>
        <div className="text-sm text-[#657184]"><p>{ar?"الدور: ":"Role: "}{String(data.role??"—")}</p><p className="mt-1">{ar?"الحالة: ":"Status: "}{String(data.status??"—")}</p><p className="mt-1">{ar?"العنوان: ":"Title: "}{String(data.title_en??data.title_ar??"—")}</p></div>
        <time className="text-xs text-[#657184]">{new Date(log.created_at).toLocaleString(locale==="ar"?"ar-EG":"en-GB")}</time>
      </article>})}</div>}
    </section>
    <p className="mt-5 text-xs leading-6 text-[#657184]">{ar?"السجل مخصص للقراءة من واجهة الموقع، ويُكتب تلقائيًا بواسطة مشغلات قاعدة البيانات.":"The UI is read-only; audit records are written automatically by database triggers."}</p>
  </div></main>;
}
