import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { saveOfficeSettings } from "../actions";

export default async function OfficeSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { locale } = await params;
  const { result } = await searchParams;
  if (!isLocale(locale)) notFound();

  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: actor } = await supabase
    .from("staff_members")
    .select("role,status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!actor || actor.status !== "active" || !["owner", "admin"].includes(actor.role)) {
    redirect(`/${locale}/dashboard`);
  }

  const { data: row, error } = await supabase
    .from("office_settings")
    .select("value,updated_at")
    .eq("key", "office.profile")
    .maybeSingle();

  const current = (row?.value ?? {}) as Record<string, string>;
  const message = result === "saved"
    ? (ar ? "تم حفظ بيانات المكتب بنجاح." : "Office details saved successfully.")
    : result
      ? (ar ? "تعذر الحفظ. تأكد من تطبيق ترحيل المرحلة الرابعة وصلاحيات قاعدة البيانات." : "Save failed. Confirm the Phase 4 migration and database permissions.")
      : "";

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
          {navItems.filter((item) => item.href !== "/staff" && item.href !== "/services" && item.href !== "/settings" && item.href !== "/audit" || ["owner", "admin"].includes(actor.role)).map((item) => {
            const href = `/${locale}/dashboard${item.href}`;
            return <Link key={item.href || "overview"} href={href} aria-current={item.href === "/settings" ? "page" : undefined}>{item.icon} <span>{item[locale]}</span></Link>;
          })}
        </nav>

        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96" />
          <div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-1 w-36 bg-[#d8b878]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <Link href={`/${locale}/dashboard`} className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] transition hover:bg-white/10">{ar ? "← العودة إلى لوحة التحكم" : "← Back to dashboard"}</Link>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / OFFICE PROFILE</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar ? "إعدادات المكتب" : "Office settings"}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{ar ? "اجعل بيانات مكتبك دقيقة ومتناسقة في كل نقاط التواصل. يمكنك تحديث الاسم ومعلومات الاتصال والعنوان باللغتين من مكان واحد." : "Keep your firm's identity consistent across contact points. Manage the office name, contact information and address in both languages from one workspace."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#d8b878]/35 bg-[#d8b878]/10 px-4 py-3 text-sm font-bold text-[#f1dfb7]"><span className="h-2 w-2 rounded-full bg-[#d8b878]" />{ar ? "إدارة المكتب" : "Office management"}</span>
              <Link href={`/${locale}/dashboard/audit`} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15">{ar ? "سجل التدقيق ↗" : "Audit log ↗"}</Link>
            </div>
          </div>
        </section>

        {message && <p role="status" className="mt-5 rounded-2xl border border-[#176b67]/20 bg-white p-4 text-sm font-bold text-[#176b67] shadow-sm">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر قراءة إعدادات المكتب. تأكد من تطبيق ترحيل المرحلة الرابعة وصلاحيات حسابك." : "Could not load office settings. Confirm the Phase 4 migration and your account permissions."}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,.8fr)] lg:items-start">
          <section className="overflow-hidden rounded-[1.5rem] border border-[#14263d]/10 bg-white shadow-sm">
            <div className="border-b border-[#14263d]/10 bg-[#fbfaf7] px-5 py-5 sm:px-7">
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{ar ? "هوية المكتب" : "FIRM IDENTITY"}</p>
              <h2 className="mt-1 text-xl font-black text-[#14263d] sm:text-2xl">{ar ? "البيانات الأساسية" : "Core details"}</h2>
              <p className="mt-2 text-sm leading-6 text-[#657184]">{ar ? "استخدم بيانات رسمية واضحة، وراجع النسختين العربية والإنجليزية قبل الحفظ." : "Use clear, official details and review both language versions before saving."}</p>
            </div>
            <form action={saveOfficeSettings} className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <input type="hidden" name="locale" value={locale} />
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "اسم المكتب بالعربية" : "Office name (Arabic)"}<input name="nameAr" required minLength={2} maxLength={160} defaultValue={current.nameAr ?? "ميزان للمحاماة والاستشارات القانونية"} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder="ميزان للمحاماة والاستشارات القانونية" /></label>
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "اسم المكتب بالإنجليزية" : "Office name (English)"}<input name="nameEn" required minLength={2} maxLength={160} defaultValue={current.nameEn ?? "Mizan Legal"} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder="Mizan Legal" /></label>
              <div className="sm:col-span-2 flex items-center gap-2 border-t border-[#14263d]/10 pt-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e5f2ed] text-[#176b67]">✉</span><div><h3 className="text-sm font-extrabold text-[#14263d]">{ar ? "قنوات التواصل" : "Contact channels"}</h3><p className="mt-1 text-xs text-[#657184]">{ar ? "بيانات يستطيع العملاء استخدامها للتواصل مع المكتب." : "Contact details clients can use to reach your office."}</p></div></div>
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "البريد الإلكتروني" : "Contact email"}<input name="email" type="email" maxLength={254} defaultValue={current.email ?? ""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder="office@example.com" /></label>
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "رقم الهاتف" : "Phone number"}<input name="phone" maxLength={40} defaultValue={current.phone ?? ""} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder="+20 ..." /></label>
              <div className="sm:col-span-2 flex items-center gap-2 border-t border-[#14263d]/10 pt-5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fbf3df] text-[#9a7130]">⌖</span><div><h3 className="text-sm font-extrabold text-[#14263d]">{ar ? "عنوان المكتب" : "Office address"}</h3><p className="mt-1 text-xs text-[#657184]">{ar ? "أضف العنوان باللغتين لعرضه بصورة مناسبة للزوار." : "Provide both language versions for visitors."}</p></div></div>
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "العنوان بالعربية" : "Address (Arabic)"}<textarea name="addressAr" rows={4} maxLength={300} defaultValue={current.addressAr ?? ""} className="mt-2 w-full resize-y rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal leading-6 text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder={ar ? "الشارع، المنطقة، المدينة" : "Arabic address"} /></label>
              <label className="block text-sm font-bold text-[#14263d]">{ar ? "العنوان بالإنجليزية" : "Address (English)"}<textarea name="addressEn" rows={4} maxLength={300} defaultValue={current.addressEn ?? ""} className="mt-2 w-full resize-y rounded-xl border border-[#14263d]/15 bg-white px-4 py-3 font-normal leading-6 text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" placeholder="Street, district, city" /></label>
              <div className="sm:col-span-2 flex flex-col gap-3 border-t border-[#14263d]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-lg text-xs leading-5 text-[#657184]">{ar ? "تُحفظ هذه البيانات ضمن إعدادات المكتب، وقد تظهر بيانات التواصل في القسم المخصص لها بالموقع العام." : "These details are stored in office settings; contact information may appear in the public site's contact section."}</p>
                <button type="submit" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14263d] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#176b67] focus:outline-none focus:ring-2 focus:ring-[#176b67]/30"><span aria-hidden="true">✓</span>{ar ? "حفظ إعدادات المكتب" : "Save office settings"}</button>
              </div>
              {row?.updated_at && <p className="text-xs text-[#657184] sm:col-span-2">{ar ? "آخر تحديث: " : "Last updated: "}{new Date(row.updated_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB", { timeZone: "Africa/Cairo" })}</p>}
            </form>
          </section>

          <aside className="grid gap-4">
            <section className="rounded-[1.5rem] bg-[#14263d] p-5 text-white shadow-sm sm:p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d8b878]/30 bg-[#d8b878]/10 text-2xl text-[#e4d1a7]">⚖</span>
              <h2 className="mt-4 text-lg font-black">{ar ? "هوية متسقة تبني الثقة" : "A consistent identity builds trust"}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-300">{ar ? "تأكد من كتابة اسم المكتب ووسائل التواصل بدقة، واستخدم الصياغة نفسها في جميع صفحات الموقع." : "Keep your office name and contact information accurate and consistent across the website."}</p>
              <div className="mt-5 h-px bg-white/10" />
              <div className="mt-4 flex items-center justify-between gap-3 text-sm"><span className="text-slate-300">{ar ? "لغة الموقع" : "Site languages"}</span><span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-[#e4d1a7]">العربية · English</span></div>
            </section>
            <section className="rounded-[1.5rem] border border-[#d8b878]/35 bg-[#fbf7eb] p-5 sm:p-6">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14263d] text-lg text-[#e4d1a7]">⌑</span><h2 className="font-extrabold text-[#14263d]">{ar ? "نصيحة قبل الحفظ" : "Before you save"}</h2></div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#657184]">
                <li className="flex gap-2"><span className="font-black text-[#176b67]">✓</span><span>{ar ? "تأكد من صحة البريد ورقم الهاتف." : "Verify the email and phone number."}</span></li>
                <li className="flex gap-2"><span className="font-black text-[#176b67]">✓</span><span>{ar ? "راجع العنوان بالعربية والإنجليزية." : "Review both address versions."}</span></li>
                <li className="flex gap-2"><span className="font-black text-[#176b67]">✓</span><span>{ar ? "لا تضع بيانات شخصية غير مخصصة للنشر." : "Avoid entering personal details not intended for publication."}</span></li>
              </ul>
            </section>
            <Link href={`/${locale}/dashboard/audit`} className="flex items-center justify-between gap-3 rounded-2xl border border-[#14263d]/10 bg-white p-4 text-sm font-bold text-[#14263d] transition hover:border-[#176b67]/40 hover:text-[#176b67]"><span>{ar ? "مراجعة سجل التغييرات" : "Review change history"}</span><span aria-hidden="true">↗</span></Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
