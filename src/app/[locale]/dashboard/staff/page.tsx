import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { saveStaffMember } from "../actions";

type SearchParams = Promise<{ result?: string }>;
export default async function StaffManagementPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: SearchParams }) {
  const { locale } = await params;
  const { result } = await searchParams;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: actor } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  if (!actor || actor.status !== "active" || !["owner", "admin"].includes(actor.role)) redirect(`/${locale}/dashboard`);

  const [{ data: profiles, error: profilesError }, { data: assignments, error: assignmentsError }] = await Promise.all([
    supabase.from("profiles").select("id,email,full_name,locale,created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("staff_members").select("profile_id,role,status,updated_at").order("updated_at", { ascending: false }).limit(200)
  ]);
  const assignmentById = new Map((assignments ?? []).map((item) => [item.profile_id, item]));
  const people = profiles ?? [];
  const roles = actor.role === "owner"
    ? [{ value: "owner", ar: "مالك المكتب", en: "Office owner" }, { value: "admin", ar: "مدير", en: "Administrator" }, { value: "lawyer", ar: "محامٍ", en: "Lawyer" }, { value: "assistant", ar: "مساعد", en: "Assistant" }]
    : [{ value: "lawyer", ar: "محامٍ", en: "Lawyer" }, { value: "assistant", ar: "مساعد", en: "Assistant" }];
  const statuses = [{ value: "pending", ar: "قيد المراجعة", en: "Pending" }, { value: "active", ar: "نشط", en: "Active" }, { value: "suspended", ar: "موقوف", en: "Suspended" }];
  const messages: Record<string, { ar: string; en: string }> = {
    saved: { ar: "تم حفظ التغييرات.", en: "Changes saved." },
    "save-failed": { ar: "تعذر الحفظ. راجع الصلاحيات أو تأكد من تطبيق ترحيل المرحلة الرابعة.", en: "Save failed. Check permissions and confirm the Phase 4 migration was applied." },
    forbidden: { ar: "المدير لا يمكنه تعيين مالك أو مدير آخر.", en: "Administrators cannot assign an owner or another administrator." },
    "self-protected": { ar: "لا يمكن تغيير تعيين صلاحيات حسابك من هذه الصفحة.", en: "Your own staff assignment cannot be changed here." }
  };
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar ? "rtl" : "ltr"}>
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div><Link href={`/${locale}/dashboard`} className="text-sm font-bold text-[#176b67] hover:underline">{ar ? "← لوحة التحكم" : "← Dashboard"}</Link><p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / ADMIN</p><h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{ar ? "إدارة المستخدمين والصلاحيات" : "Users & access management"}</h1><p className="mt-3 max-w-2xl leading-7 text-[#657184]">{ar ? "عيّن أدوار المكتب وحالات الوصول. إنشاء حساب جديد لا يمنحه صلاحيات موظف تلقائيًا." : "Assign office roles and access status. New registrations never receive staff access automatically."}</p></div>
        <span className="rounded-full border border-[#176b67]/20 bg-white px-4 py-2 text-sm font-bold text-[#176b67]">{ar ? (actor.role === "owner" ? "مالك المكتب" : "مدير") : actor.role}</span>
      </header>
      {result && messages[result] && <p role="status" className="mt-6 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{messages[result][locale]}</p>}
      {(profilesError || assignmentsError) && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل بيانات الإدارة. تأكد من تطبيق ترحيل المرحلة الرابعة وأن حسابك نشط." : "Could not load administration data. Confirm the Phase 4 migration is applied and your account is active."}</p>}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5"><p className="text-sm text-[#657184]">{ar ? "الحسابات" : "Accounts"}</p><p className="mt-2 text-3xl font-black text-[#14263d]">{people.length}</p></div>
        <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5"><p className="text-sm text-[#657184]">{ar ? "الموظفون المسجلون" : "Staff assignments"}</p><p className="mt-2 text-3xl font-black text-[#14263d]">{assignments?.length ?? 0}</p></div>
        <div className="rounded-2xl border border-[#14263d]/10 bg-white p-5"><p className="text-sm text-[#657184]">{ar ? "الحسابات النشطة" : "Active staff"}</p><p className="mt-2 text-3xl font-black text-[#14263d]">{(assignments ?? []).filter((item) => item.status === "active").length}</p></div>
      </section>
      <section className="mt-8 overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white">
        <div className="border-b border-[#14263d]/10 px-5 py-4 sm:px-6"><h2 className="font-extrabold text-[#14263d]">{ar ? "الحسابات والصلاحيات" : "Accounts and roles"}</h2><p className="mt-1 text-sm text-[#657184]">{ar ? "يتم عرض أحدث 200 حساب. لا تغيّر صلاحيات حسابك الحالي من هنا." : "Showing up to 200 recent accounts. Your own assignment is protected."}</p></div>
        {people.length === 0 ? <p className="p-6 text-sm text-[#657184]">{ar ? "لا توجد حسابات للعرض." : "No accounts to display."}</p> : <div className="divide-y divide-[#14263d]/10">
          {people.map((person) => {
            const assignment = assignmentById.get(person.id);
            const self = person.id === user.id;
            return <form key={person.id} action={saveStaffMember} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_150px_150px_auto] md:items-center sm:px-6">
              <input type="hidden" name="locale" value={locale}/><input type="hidden" name="profileId" value={person.id}/>
              <div className="min-w-0"><p className="truncate font-bold text-[#14263d]">{person.full_name || (ar ? "بدون اسم" : "Unnamed account")}{self && <span className="ms-2 text-xs text-[#176b67]">({ar ? "أنت" : "You"})</span>}</p><p className="mt-1 break-all text-sm text-[#657184]">{person.email || person.id}</p><p className="mt-1 text-xs text-[#657184]">{ar ? "أُنشئ: " : "Created: "}{new Date(person.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}</p></div>
              <label className="block text-xs font-bold text-[#657184]">{ar ? "الدور" : "Role"}<select name="role" defaultValue={assignment?.role ?? (actor.role === "owner" ? "lawyer" : "assistant")} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-2.5 text-sm text-[#14263d] disabled:bg-stone-100">{roles.map((role) => <option key={role.value} value={role.value}>{role[locale]}</option>)}</select></label>
              <label className="block text-xs font-bold text-[#657184]">{ar ? "الحالة" : "Status"}<select name="status" defaultValue={assignment?.status ?? "pending"} disabled={self} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-2.5 text-sm text-[#14263d] disabled:bg-stone-100">{statuses.map((status) => <option key={status.value} value={status.value}>{status[locale]}</option>)}</select></label>
              <button type="submit" disabled={self} className="rounded-xl bg-[#14263d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#176b67] disabled:cursor-not-allowed disabled:opacity-40">{ar ? "حفظ" : "Save"}</button>
            </form>;
          })}
        </div>}
      </section>
      <p className="mt-5 text-xs leading-6 text-[#657184]">{ar ? "ملاحظة أمنية: هذه الواجهة لا تنشئ حسابات Auth جديدة؛ المستخدم يجب أن يسجل أولًا. كل تغيير صلاحيات يمر عبر سياسات RLS ويُسجل في سجل التدقيق." : "Security note: this page does not create Auth accounts. Users must register first. Role changes are enforced by RLS and recorded in the audit log."}</p>
    </div>
  </main>;
}
