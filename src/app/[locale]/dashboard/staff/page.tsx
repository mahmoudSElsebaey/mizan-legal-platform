import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { saveClientProfile, saveStaffMember } from "../actions";

type SearchParams = Promise<{ result?: string }>;

export default async function StaffManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
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

  const [
    { data: profiles, error: profilesError },
    { data: assignments, error: assignmentsError },
  ] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,locale,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("staff_members").select("profile_id,role,status,updated_at").order("updated_at", { ascending: false }).limit(200),
  ]);

  const assignmentById = new Map((assignments ?? []).map((item) => [item.profile_id, item]));
  const people = profiles ?? [];
  const roles = actor.role === "owner"
    ? [
        { value: "owner", ar: "مالك المكتب", en: "Office owner" },
        { value: "admin", ar: "مدير", en: "Administrator" },
        { value: "lawyer", ar: "محامٍ", en: "Lawyer" },
        { value: "assistant", ar: "مساعد", en: "Assistant" },
      ]
    : [
        { value: "lawyer", ar: "محامٍ", en: "Lawyer" },
        { value: "assistant", ar: "مساعد", en: "Assistant" },
      ];
  const statuses = [
    { value: "pending", ar: "قيد المراجعة", en: "Pending" },
    { value: "active", ar: "نشط", en: "Active" },
    { value: "suspended", ar: "موقوف", en: "Suspended" },
  ];
  const messages: Record<string, { ar: string; en: string }> = {
    saved: { ar: "تم حفظ التغييرات.", en: "Changes saved." },
    "save-failed": { ar: "تعذر الحفظ. راجع الصلاحيات أو تأكد من تطبيق ترحيل المرحلة الرابعة.", en: "Save failed. Check permissions and confirm the Phase 4 migration was applied." },
    forbidden: { ar: "المدير لا يمكنه تعيين مالك أو مدير آخر.", en: "Administrators cannot assign an owner or another administrator." },
    "self-protected": { ar: "لا يمكن تغيير بيانات حسابك أو تعيين صلاحياته من هذه الصفحة.", en: "Your own profile and staff assignment cannot be changed here." },
    "profile-saved": { ar: "تم تحديث بيانات الحساب.", en: "Account profile updated." },
    "profile-save-failed": { ar: "تعذر تحديث بيانات الحساب.", en: "Could not update account profile." },
  };

  const roleLabel = (role?: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      owner: { ar: "مالك المكتب", en: "Office owner" },
      admin: { ar: "مدير", en: "Administrator" },
      lawyer: { ar: "محامٍ", en: "Lawyer" },
      assistant: { ar: "مساعد", en: "Assistant" },
    };
    return role ? labels[role]?.[locale] ?? (ar ? "مستخدم" : "User") : (ar ? "عميل / بلا صلاحية موظف" : "Client / no staff access");
  };

  const statusLabel = (status?: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: "قيد المراجعة", en: "Pending" },
      active: { ar: "نشط", en: "Active" },
      suspended: { ar: "موقوف", en: "Suspended" },
    };
    return status ? labels[status]?.[locale] ?? status : (ar ? "عميل" : "Client");
  };

  const activeStaff = (assignments ?? []).filter((item) => item.status === "active").length;
  const pendingStaff = (assignments ?? []).filter((item) => item.status === "pending").length;
  const suspendedStaff = (assignments ?? []).filter((item) => item.status === "suspended").length;

  return (
    <main className="mizan-dashboard-page min-h-screen overflow-hidden bg-[#f4f2ec] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl">
        <nav className="mizan-dashboard-page-nav mb-6 flex flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar ? "التنقل داخل لوحة التحكم" : "Dashboard navigation"}>
          <Link href={`/${locale}/dashboard`}>⌂ <span>{ar ? "لوحة التحكم" : "Overview"}</span></Link>
          <Link href={`/${locale}/dashboard/cases`}>▤ <span>{ar ? "ملفات القضايا" : "Cases"}</span></Link>
          <Link href={`/${locale}/dashboard/appointments`}>▦ <span>{ar ? "المواعيد" : "Appointments"}</span></Link>
          <Link href={`/${locale}/dashboard/conversations`}>◌ <span>{ar ? "المحادثات" : "Messages"}</span></Link>
          <Link href={`/${locale}/dashboard/notifications`}>♧ <span>{ar ? "الإشعارات" : "Notifications"}</span></Link>
          <Link href={`/${locale}/dashboard/staff`} aria-current="page">♙ <span>{ar ? "المستخدمون والصلاحيات" : "Users & access"}</span></Link>
          <Link href={`/${locale}/dashboard/services`}>⚖ <span>{ar ? "الخدمات" : "Services"}</span></Link>
          <Link href={`/${locale}/dashboard/settings`}>⚙ <span>{ar ? "الإعدادات" : "Settings"}</span></Link>
          <Link href={`/${locale}/dashboard/audit`}>◷ <span>{ar ? "سجل التدقيق" : "Audit log"}</span></Link>
        </nav>

        <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96" />
          <div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-1 w-36 bg-[#d8b878]" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <Link href={`/${locale}/dashboard`} className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] transition hover:bg-white/10">
                {ar ? "← العودة إلى لوحة التحكم" : "← Back to dashboard"}
              </Link>
              <p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / OFFICE GOVERNANCE</p>
              <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar ? "المستخدمون والصلاحيات" : "Users & permissions"}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                {ar ? "إدارة منظمة لفريق المكتب ومستويات الوصول، مع حماية حسابك الحالي وفصل صلاحيات المالك عن المدير." : "A clear workspace for managing office access, with protected self-assignment and a strict separation between owner and administrator permissions."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl border border-[#d8b878]/35 bg-[#d8b878]/10 px-4 py-3 text-sm font-bold text-[#f1dfb7]">
                <span className="me-2 inline-block h-2 w-2 rounded-full bg-[#d8b878]" />
                {ar ? (actor.role === "owner" ? "صلاحية مالك المكتب" : "صلاحية مدير المكتب") : (actor.role === "owner" ? "Office owner access" : "Office administrator")}
              </span>
              <Link href={`/${locale}/dashboard/audit`} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                {ar ? "عرض سجل التدقيق ↗" : "View audit log ↗"}
              </Link>
            </div>
          </div>
        </section>

        {result && messages[result] && <p role="status" className="mt-5 rounded-2xl border border-[#176b67]/20 bg-white p-4 text-sm font-bold text-[#176b67] shadow-sm">{messages[result][locale]}</p>}
        {(profilesError || assignmentsError) && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل بيانات الإدارة. تأكد من تطبيق ترحيل المرحلة الرابعة وأن حسابك نشط." : "Could not load administration data. Confirm the Phase 4 migration is applied and your account is active."}</p>}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={ar ? "ملخص المستخدمين" : "User overview"}>
          <article className="relative overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#657184]">{ar ? "كل الحسابات" : "All accounts"}</p><p className="mt-3 text-3xl font-black tracking-tight text-[#14263d]">{people.length}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "أحدث الحسابات المسجلة" : "Most recent registered profiles"}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#14263d] text-xl text-[#e4d1a7]">♙</span></div>
            <div className="mt-5 h-1 rounded-full bg-[#14263d]/10"><div className="h-1 w-full rounded-full bg-[#14263d]" /></div>
          </article>
          <article className="relative overflow-hidden rounded-2xl border border-[#176b67]/15 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#657184]">{ar ? "موظفون نشطون" : "Active staff"}</p><p className="mt-3 text-3xl font-black tracking-tight text-[#176b67]">{activeStaff}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "لديهم وصول فعّال" : "With active office access"}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f2ed] text-xl text-[#176b67]">✓</span></div>
            <div className="mt-5 h-1 rounded-full bg-[#176b67]/10"><div className="h-1 rounded-full bg-[#176b67]" style={{ width: `${Math.min(100, activeStaff / Math.max(1, assignments?.length ?? 0) * 100)}%` }} /></div>
          </article>
          <article className="relative overflow-hidden rounded-2xl border border-[#d8b878]/30 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#657184]">{ar ? "بانتظار المراجعة" : "Pending review"}</p><p className="mt-3 text-3xl font-black tracking-tight text-[#9a7130]">{pendingStaff}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "لم يتم تفعيلهم بعد" : "Not activated yet"}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fbf3df] text-xl text-[#9a7130]">◷</span></div>
            <div className="mt-5 h-1 rounded-full bg-[#d8b878]/15"><div className="h-1 rounded-full bg-[#d8b878]" style={{ width: `${Math.min(100, pendingStaff / Math.max(1, assignments?.length ?? 0) * 100)}%` }} /></div>
          </article>
          <article className="relative overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#657184]">{ar ? "وصول موقوف" : "Suspended access"}</p><p className="mt-3 text-3xl font-black tracking-tight text-[#a34c42]">{suspendedStaff}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "حسابات موظفين موقوفة" : "Staff accounts suspended"}</p></div><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f9e9e6] text-xl text-[#a34c42]">⊘</span></div>
            <div className="mt-5 h-1 rounded-full bg-[#a34c42]/10"><div className="h-1 rounded-full bg-[#a34c42]" style={{ width: `${Math.min(100, suspendedStaff / Math.max(1, assignments?.length ?? 0) * 100)}%` }} /></div>
          </article>
        </section>

        <section className="mt-7 overflow-hidden rounded-[1.5rem] border border-[#14263d]/10 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#14263d]/10 bg-[#fbfaf7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#176b67]">{ar ? "دليل الحسابات" : "ACCOUNT DIRECTORY"}</p><h2 className="mt-1 text-xl font-black text-[#14263d] sm:text-2xl">{ar ? "الحسابات والأدوار" : "Accounts & roles"}</h2><p className="mt-2 text-sm leading-6 text-[#657184]">{ar ? "أدرجت أحدث 200 حساب. سجّل المستخدم أولًا قبل منحه صلاحية ضمن فريق المكتب." : "Showing up to 200 recent accounts. A user must register before receiving an office staff assignment."}</p></div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#14263d]/10 bg-white px-3 py-2 text-xs font-bold text-[#657184]"><span className="h-2 w-2 rounded-full bg-[#176b67]" />{ar ? "إدارة آمنة" : "Secure access"}</span>
          </div>

          {people.length === 0 ? (
            <div className="px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f2ec] text-2xl text-[#657184]">♙</span><h3 className="mt-4 font-bold text-[#14263d]">{ar ? "لا توجد حسابات للعرض" : "No accounts to display"}</h3><p className="mt-2 text-sm text-[#657184]">{ar ? "ستظهر الحسابات هنا بعد تسجيل المستخدمين." : "Registered profiles will appear here."}</p></div>
          ) : (
            <div className="divide-y divide-[#14263d]/10">
              {people.map((person) => {
                const assignment = assignmentById.get(person.id);
                const self = person.id === user.id;
                return (
                  <article key={person.id} className="p-4 transition-colors hover:bg-[#fbfaf7]/80 sm:p-6 lg:p-7">
                    <div className="flex flex-col gap-5">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#d8b878]/45 bg-[#f7f0df] text-lg font-black text-[#14263d] sm:h-14 sm:w-14">
                          {(person.full_name || person.email || "?").trim().charAt(0).toLocaleUpperCase(locale === "ar" ? "ar-EG" : "en-US")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words font-extrabold text-[#14263d]">{person.full_name || (ar ? "بدون اسم" : "Unnamed account")}</h3>
                            {self && <span className="rounded-full bg-[#e5f2ed] px-2.5 py-1 text-[11px] font-bold text-[#176b67]">{ar ? "حسابك" : "You"}</span>}
                          </div>
                          <p className="mt-1 break-all text-sm text-[#657184]">{person.email || person.id}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[#14263d]/10 bg-white px-3 py-1 text-xs font-bold text-[#14263d]">{roleLabel(assignment?.role)}</span>
                            <span className={"rounded-full px-3 py-1 text-xs font-bold " + (assignment?.status === "active" ? "bg-[#e5f2ed] text-[#176b67]" : assignment?.status === "suspended" ? "bg-[#f9e9e6] text-[#a34c42]" : assignment?.status === "pending" ? "bg-[#fbf3df] text-[#9a7130]" : "bg-[#f1f2f4] text-[#657184]")}>{statusLabel(assignment?.status)}</span>
                            <span className="text-xs text-[#7b8491]">{ar ? "تاريخ التسجيل: " : "Registered: "}{new Date(person.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 rounded-2xl border border-[#14263d]/10 bg-[#fbfaf7] p-4 sm:p-5">
                        <div className="flex items-center gap-2"><span className="h-5 w-1 rounded-full bg-[#d8b878]" /><h4 className="text-sm font-extrabold text-[#14263d]">{ar ? "إدارة الدور والوصول" : "Role & access control"}</h4></div>
                        <form action={saveStaffMember} className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="profileId" value={person.id} />
                          <label className="block text-xs font-bold text-[#657184]">{ar ? "الدور الوظيفي" : "Staff role"}
                            <select name="role" defaultValue={assignment?.role ?? (actor.role === "owner" ? "lawyer" : "assistant")} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10 disabled:cursor-not-allowed disabled:bg-stone-100">
                              {roles.map((role) => <option key={role.value} value={role.value}>{role[locale]}</option>)}
                            </select>
                          </label>
                          <label className="block text-xs font-bold text-[#657184]">{ar ? "حالة الوصول" : "Access status"}
                            <select name="status" defaultValue={assignment?.status ?? "pending"} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10 disabled:cursor-not-allowed disabled:bg-stone-100">
                              {statuses.map((status) => <option key={status.value} value={status.value}>{status[locale]}</option>)}
                            </select>
                          </label>
                          <button type="submit" disabled={self} className="min-h-11 rounded-xl bg-[#14263d] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#176b67] focus:outline-none focus:ring-2 focus:ring-[#176b67]/30 disabled:cursor-not-allowed disabled:opacity-40">{ar ? "حفظ الصلاحيات" : "Save access"}</button>
                        </form>
                        <div className="border-t border-[#14263d]/10 pt-4">
                          <h4 className="text-sm font-extrabold text-[#14263d]">{ar ? "بيانات الحساب" : "Profile details"}</h4>
                          <form action={saveClientProfile} className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,220px)_auto] xl:items-end">
                            <input type="hidden" name="locale" value={locale} />
                            <input type="hidden" name="profileId" value={person.id} />
                            <label className="text-xs font-bold text-[#657184]">{ar ? "اسم الحساب" : "Account name"}
                              <input name="fullName" required minLength={1} maxLength={120} defaultValue={person.full_name ?? ""} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10 disabled:cursor-not-allowed disabled:bg-stone-100" />
                            </label>
                            <label className="text-xs font-bold text-[#657184]">{ar ? "لغة الحساب" : "Account language"}
                              <select name="profileLocale" defaultValue={person.locale} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm font-normal text-[#14263d] outline-none transition focus:border-[#176b67] focus:ring-2 focus:ring-[#176b67]/10 disabled:cursor-not-allowed disabled:bg-stone-100">
                                <option value="ar">العربية</option><option value="en">English</option>
                              </select>
                            </label>
                            <button type="submit" disabled={self} className="min-h-11 rounded-xl border border-[#14263d]/20 bg-white px-4 py-3 text-sm font-bold text-[#14263d] transition hover:border-[#176b67] hover:text-[#176b67] focus:outline-none focus:ring-2 focus:ring-[#176b67]/20 disabled:cursor-not-allowed disabled:opacity-40">{ar ? "تحديث البيانات" : "Update profile"}</button>
                          </form>
                        </div>
                        {self && <p className="text-xs leading-5 text-[#657184]">{ar ? "حماية أمنية: لا يمكن تعديل دور حسابك أو بياناته من هذه الصفحة." : "Security protection: your own role and profile cannot be edited from this page."}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="mt-5 flex gap-3 rounded-2xl border border-[#d8b878]/35 bg-[#fbf7eb] p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14263d] text-lg text-[#e4d1a7]">⌑</span>
          <div><h3 className="text-sm font-extrabold text-[#14263d]">{ar ? "ملاحظة أمنية" : "Security note"}</h3><p className="mt-1 text-sm leading-6 text-[#657184]">{ar ? "هذه الصفحة لا تنشئ حسابات تسجيل دخول جديدة؛ يجب أن يسجل المستخدم أولًا. تعيين الأدوار يخضع لسياسات قاعدة البيانات، ولا يستطيع المدير تعيين مالك أو مدير آخر. حسابك الحالي محمي من التعديل هنا." : "This page does not create new authentication accounts; users must register first. Role assignments are enforced by database policies, and administrators cannot appoint an owner or another administrator. Your own account is protected from edits here."}</p></div>
        </aside>
      </div>
    </main>
  );
}
