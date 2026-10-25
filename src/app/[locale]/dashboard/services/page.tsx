import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { deleteOfficeService, saveOfficeService, toggleOfficeService } from "../actions";

export default async function ServicesAdminPage({
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

  const { data: services, error } = await supabase
    .from("office_services")
    .select("*")
    .order("sort_order")
    .limit(200);

  const messages: Record<string, { ar: string; en: string }> = {
    saved: { ar: "تم حفظ الخدمة بنجاح.", en: "Service saved successfully." },
    deleted: { ar: "تم حذف الخدمة.", en: "Service deleted." },
    "save-failed": { ar: "تعذر حفظ الخدمة. راجع البيانات وصلاحيات قاعدة البيانات.", en: "Could not save the service. Check the data and database permissions." },
    "delete-failed": { ar: "تعذر حذف الخدمة.", en: "Could not delete the service." },
  };
  const msg = result ? messages[result]?.[locale] ?? (ar ? "تعذر تنفيذ العملية. راجع البيانات وصلاحيات قاعدة البيانات." : "The action failed. Check the data and database permissions.") : "";
  const items = services ?? [];
  const publishedCount = items.filter((service) => service.is_published).length;
  const draftCount = items.length - publishedCount;

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
      <div className="mx-auto max-w-7xl">
        <nav className="mizan-dashboard-page-nav mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar ? "التنقل داخل لوحة التحكم" : "Dashboard navigation"}>
          {navItems.map((item) => {
            const href = `/${locale}/dashboard${item.href}`;
            return <Link key={item.href || "overview"} href={href} aria-current={item.href === "/services" ? "page" : undefined}>{item.icon} <span>{item[locale]}</span></Link>;
          })}
        </nav>

        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96" />
          <div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-1 w-36 bg-[#d8b878]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <Link href={`/${locale}/dashboard`} className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] transition hover:bg-white/10">{ar ? "← العودة إلى لوحة التحكم" : "← Back to dashboard"}</Link>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / PRACTICE AREAS</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar ? "الخدمات القانونية" : "Legal services"}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{ar ? "نظّم مجالات الممارسة القانونية، واكتب محتواها بالعربية والإنجليزية، وتحكم في ظهور كل خدمة على الموقع العام." : "Organize the office practice areas, manage Arabic and English content, and control which services appear on the public website."}</p>
            </div>
            <a href="#add-service" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#d8b878] px-5 py-3 text-sm font-extrabold text-[#14263d] transition hover:bg-[#e7c98e]"><span aria-hidden="true">＋</span>{ar ? "إضافة خدمة" : "Add a service"}</a>
          </div>
        </section>

        {msg && <p role="status" className="mt-5 rounded-2xl border border-[#176b67]/20 bg-white p-4 text-sm font-bold text-[#176b67] shadow-sm">{msg}</p>}
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل الخدمات. تأكد من تطبيق ترحيل المرحلة الرابعة." : "Could not load services. Confirm the Phase 4 migration is applied."}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-3" aria-label={ar ? "ملخص الخدمات" : "Services overview"}>
          <article className="rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#657184]">{ar ? "إجمالي الخدمات" : "Total services"}</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14263d] text-lg text-[#e4d1a7]">⚖</span></div><p className="mt-3 text-3xl font-black text-[#14263d]">{items.length}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "مجالات الممارسة المسجلة" : "Practice areas in the directory"}</p></article>
          <article className="rounded-2xl border border-[#176b67]/15 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#657184]">{ar ? "خدمات منشورة" : "Published"}</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f2ed] text-lg text-[#176b67]">✓</span></div><p className="mt-3 text-3xl font-black text-[#176b67]">{publishedCount}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "ظاهرة على الموقع العام" : "Visible on the public website"}</p></article>
          <article className="rounded-2xl border border-[#d8b878]/30 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[#657184]">{ar ? "مسودات" : "Drafts"}</p><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbf3df] text-lg text-[#9a7130]">◷</span></div><p className="mt-3 text-3xl font-black text-[#9a7130]">{draftCount}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "غير منشورة حتى الآن" : "Not publicly visible yet"}</p></article>
        </section>

        <section id="add-service" className="mt-7 scroll-mt-6 overflow-hidden rounded-[1.5rem] border border-[#14263d]/10 bg-white shadow-sm">
          <div className="border-b border-[#14263d]/10 bg-[#fbfaf7] px-5 py-5 sm:px-7"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{ar ? "إنشاء محتوى" : "CONTENT WORKSPACE"}</p><h2 className="mt-1 text-xl font-black text-[#14263d] sm:text-2xl">{ar ? "إضافة خدمة قانونية" : "Add a legal service"}</h2><p className="mt-2 text-sm leading-6 text-[#657184]">{ar ? "أدخل المحتوى باللغتين لضمان تجربة متناسقة للزوار." : "Provide both language versions for a consistent experience across locales."}</p></div>
          <form action={saveOfficeService} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
            <input type="hidden" name="locale" value={locale} />
            <label className="text-sm font-bold text-[#14263d]">{ar ? "الرابط المختصر" : "URL slug"}<span className="mt-1 block text-xs font-normal text-[#657184]">{ar ? "أحرف إنجليزية صغيرة وأرقام وشرطات فقط" : "Lowercase letters, numbers and hyphens"}</span><input name="slug" required minLength={2} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="civil-law" className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10" /></label>
            <label className="text-sm font-bold text-[#14263d]">{ar ? "ترتيب العرض" : "Display order"}<span className="mt-1 block text-xs font-normal text-[#657184]">{ar ? "الأرقام الأقل تظهر أولًا" : "Lower numbers appear first"}</span><input name="sortOrder" type="number" min="0" max="10000" defaultValue="0" required className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal outline-none focus:border-[#176b67]" /></label>
            <label className="text-sm font-bold text-[#14263d]">{ar ? "عنوان الخدمة بالعربية" : "Arabic title"}<input name="titleAr" required minLength={2} maxLength={160} placeholder={ar ? "مثال: القانون التجاري" : "Arabic service title"} className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-3 py-3 text-sm font-normal outline-none focus:border-[#176b67]" /></label>
            <label className="text-sm font-bold text-[#14263d]">{ar ? "عنوان الخدمة بالإنجليزية" : "English title"}<input name="titleEn" required minLength={2} maxLength={160} placeholder="e.g. Commercial Law" className="mt-2 w-full rounded-xl border border-[#14263d]/15 px-3 py-3 text-sm font-normal outline-none focus:border-[#176b67]" /></label>
            <label className="text-sm font-bold text-[#14263d]">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea name="descriptionAr" maxLength={2000} rows={4} placeholder={ar ? "اكتب نبذة واضحة عن الخدمة..." : "Describe the service in Arabic..."} className="mt-2 w-full resize-y rounded-xl border border-[#14263d]/15 px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-[#176b67]" /></label>
            <label className="text-sm font-bold text-[#14263d]">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea name="descriptionEn" maxLength={2000} rows={4} placeholder="Describe the legal service..." className="mt-2 w-full resize-y rounded-xl border border-[#14263d]/15 px-3 py-3 text-sm font-normal leading-6 outline-none focus:border-[#176b67]" /></label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><button className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#176b67] focus:outline-none focus:ring-2 focus:ring-[#176b67]/30" type="submit">{ar ? "حفظ كمسودة" : "Save as draft"}</button><p className="text-xs leading-5 text-[#657184]">{ar ? "يمكنك مراجعة الخدمة وتعديلها قبل نشرها." : "You can review and edit the service before publishing it."}</p></div>
          </form>
        </section>

        <section className="mt-7 overflow-hidden rounded-[1.5rem] border border-[#14263d]/10 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#14263d]/10 bg-[#fbfaf7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{ar ? "مكتبة المحتوى" : "SERVICE DIRECTORY"}</p><h2 className="mt-1 text-xl font-black text-[#14263d] sm:text-2xl">{ar ? "الخدمات الحالية" : "Existing services"}</h2></div><span className="w-fit rounded-full border border-[#14263d]/10 bg-white px-3 py-1.5 text-xs font-bold text-[#657184]">{items.length} {ar ? "خدمة" : "services"}</span></div>
          {items.length === 0 ? <div className="px-6 py-14 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f2ec] text-2xl text-[#657184]">⚖</span><h3 className="mt-4 font-bold text-[#14263d]">{ar ? "لا توجد خدمات حتى الآن" : "No services yet"}</h3><p className="mt-2 text-sm text-[#657184]">{ar ? "أضف أول مجال ممارسة من النموذج أعلاه." : "Add your first practice area using the form above."}</p></div> : <div className="divide-y divide-[#14263d]/10">
            {items.map((service) => <article key={service.id} className="p-5 transition-colors hover:bg-[#fbfaf7]/70 sm:p-7">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-3 sm:gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#14263d] text-xl text-[#e4d1a7]">⚖</span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#f4f2ec] px-2.5 py-1 text-[11px] font-bold text-[#657184]">{service.slug}</span><span className="text-xs text-[#657184]">{ar ? "ترتيب" : "Order"} #{service.sort_order}</span></div><h3 className="mt-3 break-words text-lg font-black text-[#14263d]">{service.title_ar} <span className="text-[#d8b878]">/</span> {service.title_en}</h3><p className="mt-2 max-w-3xl whitespace-pre-line text-sm leading-7 text-[#657184]">{(ar ? service.description_ar : service.description_en) || service.description_ar || service.description_en || (ar ? "لم يُضف وصف لهذه الخدمة بعد." : "No description has been added yet.")}</p></div></div>
                <span className={"inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold " + (service.is_published ? "bg-[#e5f2ed] text-[#176b67]" : "bg-[#fbf3df] text-[#9a7130]")}><span className={"h-2 w-2 rounded-full " + (service.is_published ? "bg-[#176b67]" : "bg-[#d8b878]")} />{service.is_published ? (ar ? "منشورة" : "Published") : (ar ? "مسودة" : "Draft")}</span>
              </div>
              <details className="mt-5 rounded-2xl border border-[#14263d]/10 bg-[#fbfaf7]">
                <summary className="cursor-pointer list-none px-4 py-3.5 text-sm font-extrabold text-[#176b67] marker:hidden"><span className="me-2" aria-hidden="true">✎</span>{ar ? "تعديل بيانات الخدمة" : "Edit service details"}<span className="float-end text-[#657184]" aria-hidden="true">＋</span></summary>
                <form action={saveOfficeService} className="grid gap-4 border-t border-[#14263d]/10 p-4 sm:grid-cols-2 sm:p-5">
                  <input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={service.id} />
                  <label className="text-xs font-bold text-[#657184]">{ar ? "الرابط المختصر" : "URL slug"}<input name="slug" required minLength={2} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={service.slug} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <label className="text-xs font-bold text-[#657184]">{ar ? "ترتيب العرض" : "Display order"}<input name="sortOrder" type="number" min="0" max="10000" required defaultValue={service.sort_order} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <label className="text-xs font-bold text-[#657184]">{ar ? "العنوان بالعربية" : "Arabic title"}<input name="titleAr" required minLength={2} maxLength={160} defaultValue={service.title_ar} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <label className="text-xs font-bold text-[#657184]">{ar ? "العنوان بالإنجليزية" : "English title"}<input name="titleEn" required minLength={2} maxLength={160} defaultValue={service.title_en} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <label className="text-xs font-bold text-[#657184]">{ar ? "الوصف بالعربية" : "Arabic description"}<textarea name="descriptionAr" maxLength={2000} rows={3} defaultValue={service.description_ar} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <label className="text-xs font-bold text-[#657184]">{ar ? "الوصف بالإنجليزية" : "English description"}<textarea name="descriptionEn" maxLength={2000} rows={3} defaultValue={service.description_en} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d]" /></label>
                  <button className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#176b67] sm:col-span-2 sm:justify-self-start" type="submit">{ar ? "حفظ التعديلات" : "Save changes"}</button>
                </form>
              </details>
              <div className="mt-4 flex flex-wrap gap-3">
                <form action={toggleOfficeService}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={service.id} /><input type="hidden" name="published" value={String(service.is_published)} /><button className={"rounded-xl px-4 py-2.5 text-sm font-extrabold transition " + (service.is_published ? "border border-[#d8b878]/50 bg-[#fbf3df] text-[#805d25] hover:bg-[#f7e9c7]" : "bg-[#176b67] text-white hover:bg-[#125854]")} type="submit">{service.is_published ? (ar ? "إلغاء النشر" : "Unpublish") : (ar ? "نشر الخدمة" : "Publish service")}</button></form>
                <form action={deleteOfficeService}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={service.id} /><button className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50" type="submit">{ar ? "حذف الخدمة" : "Delete service"}</button></form>
              </div>
            </article>)}
          </div>}
        </section>
        <p className="mt-5 text-xs leading-6 text-[#657184]">{ar ? "تأكد من مراجعة النصوص باللغتين قبل النشر. نشر الخدمة يجعلها مؤهلة للظهور على الموقع العام وفق إعدادات العرض." : "Review both language versions before publishing. Published services become eligible for display on the public website according to its content settings."}</p>
      </div>
    </main>
  );
}
