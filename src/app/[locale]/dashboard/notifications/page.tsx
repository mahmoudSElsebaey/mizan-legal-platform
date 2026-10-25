import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { deleteAllNotifications, deleteNotification, markNotificationsRead } from "../conversations/actions";

const resultMessages: Record<string, { ar: string; en: string }> = {
  "notifications-failed": { ar: "تعذر تحديث الإشعارات.", en: "Could not update notifications." },
  "notifications-read": { ar: "تم تحديد الإشعارات كمقروءة.", en: "Notifications marked as read." },
  "notification-deleted": { ar: "تم حذف الإشعار.", en: "Notification deleted." },
  "notification-delete-failed": { ar: "تعذر حذف الإشعار.", en: "Could not delete notification." },
  "notifications-deleted": { ar: "تم مسح الإشعارات.", en: "Notifications cleared." },
  "notifications-delete-failed": { ar: "تعذر مسح الإشعارات.", en: "Could not clear notifications." },
};

export default async function NotificationsPage({
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/" + locale + "/login");

  const [{ data: staff }, { data: notifications, error }] = await Promise.all([
    supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle(),
    supabase.from("notifications").select("id,kind,title,body,href,created_at,read_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const unreadCount = (notifications || []).filter((item) => !item.read_at).length;
  const dateTime = (value: string) => new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(value));

  return <main className="mizan-dashboard-page min-h-screen overflow-hidden bg-[#f4f2ec] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar ? "rtl" : "ltr"}>
    <nav className="mizan-dashboard-page-nav mx-auto mb-6 flex max-w-7xl flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar ? "التنقل داخل لوحة التحكم" : "Dashboard navigation"}>
      <Link href={"/" + locale + "/dashboard"}>⌂ <span>{ar ? "لوحة التحكم" : "Overview"}</span></Link>
      <Link href={"/" + locale + "/dashboard/cases"}>▤ <span>{ar ? "ملفات القضايا" : "Cases"}</span></Link>
      <Link href={"/" + locale + "/dashboard/appointments"}>▦ <span>{ar ? "المواعيد" : "Appointments"}</span></Link>
      <Link href={"/" + locale + "/dashboard/conversations"}>◌ <span>{ar ? "المحادثات" : "Conversations"}</span></Link>
      <Link href={"/" + locale + "/dashboard/notifications"}>♧ <span>{ar ? "الإشعارات" : "Notifications"}</span></Link>
      {["owner", "admin"].includes(String(staff?.role || "")) && <><Link href={"/" + locale + "/dashboard/staff"}>♙ <span>{ar ? "المستخدمون" : "Staff"}</span></Link><Link href={"/" + locale + "/dashboard/services"}>⚖ <span>{ar ? "الخدمات" : "Services"}</span></Link><Link href={"/" + locale + "/dashboard/settings"}>⚙ <span>{ar ? "الإعدادات" : "Settings"}</span></Link><Link href={"/" + locale + "/dashboard/audit"}>◷ <span>{ar ? "سجل التدقيق" : "Audit log"}</span></Link></>}
    </nav>

    <div className="mx-auto max-w-7xl">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96" />
        <div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72" />
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <Link href={"/" + locale + "/dashboard"} className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] hover:bg-white/10">{ar ? "← العودة إلى لوحة التحكم" : "← Back to dashboard"}</Link>
            <p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / NOTIFICATIONS</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar ? "الإشعارات" : "Notifications"}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{ar ? "تابع تحديثات حسابك ورسائلك وتنبيهات المكتب في مكان واحد." : "Keep track of account updates, messages, and office alerts in one place."}</p>
          </div>
          <div className="grid min-w-48 grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><span className="text-xs text-slate-300">{ar ? "كل الإشعارات" : "All notifications"}</span><p className="mt-2 text-3xl font-black text-white">{(notifications || []).length}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><span className="text-xs text-slate-300">{ar ? "غير مقروءة" : "Unread"}</span><p className="mt-2 text-3xl font-black text-[#e4d1a7]">{unreadCount}</p></div>
          </div>
        </div>
      </section>

      {result && resultMessages[result] && <p role="status" className="mt-5 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{resultMessages[result][locale]}</p>}
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar ? "تعذر تحميل الإشعارات. حاول تحديث الصفحة." : "Could not load notifications. Try refreshing the page."}</p>}

      <section className="mt-6 rounded-[1.5rem] border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-[#14263d]/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-xl font-black text-[#14263d]">{ar ? "سجل الإشعارات" : "Notification inbox"}</h2><p className="mt-1 text-sm text-[#657184]">{ar ? "يمكنك فتح التنبيه أو تحديد الكل كمقروء أو حذف الإشعارات." : "Open an alert, mark everything as read, or clear notifications."}</p></div>
          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 && <form action={markNotificationsRead}><input type="hidden" name="locale" value={locale} /><button className="rounded-xl bg-[#176b67]/10 px-4 py-2.5 text-sm font-bold text-[#176b67] transition hover:bg-[#176b67]/15">{ar ? "تحديد الكل كمقروء" : "Mark all as read"}</button></form>}
            {!!notifications?.length && <form action={deleteAllNotifications}><input type="hidden" name="locale" value={locale} /><ConfirmSubmitButton message={ar ? "هل تريد حذف جميع إشعارات حسابك؟" : "Delete all notifications in your account?"} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-50">{ar ? "مسح الكل" : "Clear all"}</ConfirmSubmitButton></form>}
          </div>
        </div>

        {!notifications?.length ? <div className="py-16 text-center"><span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f2ec] text-2xl text-[#176b67]">♧</span><h3 className="mt-4 font-bold text-[#14263d]">{ar ? "صندوق الإشعارات فارغ" : "Your inbox is clear"}</h3><p className="mt-2 text-sm text-[#657184]">{ar ? "ستظهر هنا الإشعارات الجديدة عند وصولها." : "New notifications will appear here when they arrive."}</p></div> : <ul className="divide-y divide-[#14263d]/10">
          {notifications.map((notification) => <li key={notification.id} className={"group flex items-start gap-3 py-5 sm:gap-4 " + (!notification.read_at ? "bg-[#f8faf8] " : "")}>
            <span aria-hidden="true" className={"mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + (!notification.read_at ? "bg-[#176b67]/10 text-[#176b67]" : "bg-[#f4f2ec] text-[#657184]")}>{!notification.read_at ? "●" : "✓"}</span>
            <div className="min-w-0 flex-1">
              <Link href={notification.href || ("/" + locale + "/dashboard")} className="block rounded-lg hover:text-[#176b67]"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-[#14263d]">{notification.title}</span>{!notification.read_at && <span className="rounded-full bg-[#176b67]/10 px-2 py-1 text-[11px] font-bold text-[#176b67]">{ar ? "جديد" : "Unread"}</span>}</div>{notification.body && <p className="mt-1 text-sm font-normal leading-6 text-[#657184]">{notification.body}</p>}<p className="mt-2 text-xs font-normal text-[#657184]">{dateTime(notification.created_at)}</p></Link>
            </div>
            <form action={deleteNotification} className="shrink-0"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="notificationId" value={notification.id} /><ConfirmSubmitButton message={ar ? "هل تريد حذف هذا الإشعار؟" : "Delete this notification?"} ariaLabel={ar ? "حذف الإشعار" : "Delete notification"} title={ar ? "حذف الإشعار" : "Delete notification"} className="rounded-xl px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50">×</ConfirmSubmitButton></form>
          </li>)}
        </ul>}
      </section>
    </div>
  </main>;
}
