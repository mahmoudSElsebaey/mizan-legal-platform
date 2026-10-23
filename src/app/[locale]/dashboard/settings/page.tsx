import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { saveOfficeSettings } from "../actions";

export default async function OfficeSettingsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ result?: string }> }) {
  const { locale } = await params; const { result } = await searchParams;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar"; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: actor } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  if (!actor || actor.status !== "active" || !["owner","admin"].includes(actor.role)) redirect(`/${locale}/dashboard`);
  const { data: row, error } = await supabase.from("office_settings").select("value,updated_at").eq("key","office.profile").maybeSingle();
  const current = (row?.value ?? {}) as Record<string,string>;
  const message = result === "saved" ? (ar?"تم حفظ بيانات المكتب.":"Office details saved.") : result ? (ar?"تعذر الحفظ. تأكد من تطبيق ترحيل المرحلة الرابعة.":"Save failed. Confirm the Phase 4 migration is applied.") : "";
  return <main className="mizan-dashboard-page min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar?"rtl":"ltr"}>
    <nav className="mizan-dashboard-page-nav" aria-label={ar?"التنقل داخل لوحة التحكم":"Dashboard navigation"}><Link href={"/"+locale+"/dashboard"}>⌂ <span>{ar?"لوحة التحكم":"Overview"}</span></Link><Link href={"/"+locale+"/dashboard/cases"}>▤ <span>{ar?"ملفات القضايا":"Cases"}</span></Link><Link href={"/"+locale+"/dashboard/appointments"}>▦ <span>{ar?"المواعيد":"Appointments"}</span></Link><Link href={"/"+locale+"/dashboard/conversations"}>◌ <span>{ar?"المحادثات":"Messages"}</span></Link>{["owner","admin"].includes(String(actor?.role||""))&&<><Link href={"/"+locale+"/dashboard/staff"}>♙ <span>{ar?"المستخدمون":"Staff"}</span></Link><Link href={"/"+locale+"/dashboard/services"}>⚖ <span>{ar?"الخدمات":"Services"}</span></Link><Link href={"/"+locale+"/dashboard/settings"}>⚙ <span>{ar?"الإعدادات":"Settings"}</span></Link><Link href={"/"+locale+"/dashboard/audit"}>◷ <span>{ar?"سجل التدقيق":"Audit log"}</span></Link></>}</nav>
<div className="mx-auto max-w-4xl">
    <Link href={`/${locale}/dashboard`} className="text-sm font-bold text-[#176b67] hover:underline">{ar?"← لوحة التحكم":"← Dashboard"}</Link>
    <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / SETTINGS</p><h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{ar?"إعدادات المكتب":"Office settings"}</h1>
    <p className="mt-3 leading-7 text-[#657184]">{ar?"عدّل بيانات التعريف الأساسية للمكتب. بيانات التواصل المحفوظة هنا تظهر في قسم التواصل بالموقع العام.":"Manage the firm's core profile. Saved contact details are displayed in the public homepage contact section."}</p>
    {message && <p role="status" className="mt-5 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{message}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar?"تعذر قراءة الإعدادات. طبّق ترحيل المرحلة الرابعة.":"Could not load settings. Apply the Phase 4 migration."}</p>}
    <form action={saveOfficeSettings} className="mt-8 grid gap-5 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:grid-cols-2 sm:p-8"><input type="hidden" name="locale" value={locale}/>
      <label className="text-sm font-bold text-[#14263d]">{ar?"اسم المكتب بالعربية":"Office name (Arabic)"}<input name="nameAr" required minLength={2} maxLength={160} defaultValue={current.nameAr??"ميزان للمحاماة والاستشارات القانونية"} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal"/></label>
      <label className="text-sm font-bold text-[#14263d]">{ar?"اسم المكتب بالإنجليزية":"Office name (English)"}<input name="nameEn" required minLength={2} maxLength={160} defaultValue={current.nameEn??"Mizan Legal"} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal"/></label>
      <label className="text-sm font-bold text-[#14263d]">{ar?"البريد الإلكتروني":"Contact email"}<input name="email" type="email" maxLength={254} defaultValue={current.email??""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal" placeholder="office@example.com"/></label>
      <label className="text-sm font-bold text-[#14263d]">{ar?"رقم الهاتف":"Phone number"}<input name="phone" maxLength={40} defaultValue={current.phone??""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal" placeholder="+20 ..."/></label>
      <label className="text-sm font-bold text-[#14263d]">{ar?"العنوان بالعربية":"Address (Arabic)"}<textarea name="addressAr" rows={3} maxLength={300} defaultValue={current.addressAr??""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal"/></label>
      <label className="text-sm font-bold text-[#14263d]">{ar?"العنوان بالإنجليزية":"Address (English)"}<textarea name="addressEn" rows={3} maxLength={300} defaultValue={current.addressEn??""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-4 py-3 font-normal"/></label>
      <div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white hover:bg-[#176b67]">{ar?"حفظ الإعدادات":"Save settings"}</button>{row?.updated_at && <p className="mt-3 text-xs text-[#657184]">{ar?"آخر تحديث: ":"Last updated: "}{new Date(row.updated_at).toLocaleString(locale==="ar"?"ar-EG":"en-GB")}</p>}</div>
    </form>
  </div></main>;
}
