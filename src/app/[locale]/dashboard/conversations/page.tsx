import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { ConversationListClient } from "@/components/conversations/conversation-list-client";
import { deleteAllNotifications, deleteNotification, hideConversations, markNotificationsRead, startConversation, startStaffConversation } from "./actions";

export default async function ConversationsPage({
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

  const [{ data: staff }, { data: conversations, error: conversationsError }, { data: notifications }, { data: contacts }, { data: hiddenConversations }, { data: staffRecipients }] = await Promise.all([
    supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle(),
    supabase.from("conversations").select("id,client_id,staff_id,subject,status,conversation_type,last_message_at,created_at").order("last_message_at", { ascending: false }).limit(100),
    supabase.from("notifications").select("id,kind,title,body,href,created_at,read_at").order("created_at", { ascending: false }).limit(10),
    supabase.rpc("list_contactable_staff"),
    supabase.from("conversation_hidden_for_user").select("conversation_id").eq("user_id", user.id),
    supabase.rpc("list_contactable_staff_recipients"),
  ]);
  const hiddenConversationIds = new Set((hiddenConversations || []).map((item) => item.conversation_id));
  const visibleConversations = (conversations || []).filter((conversation) => !hiddenConversationIds.has(conversation.id));
  const isStaff = !!staff;
  const activeStaff = staff?.status === "active";
  const isClient = !isStaff;
  const t = ar ? {
    title: "المحادثات والإشعارات", intro: "تواصل آمن بين العميل وفريق المكتب، مع إشعارات داخل حسابك.",
    dashboard: "لوحة التحكم", newTitle: "ابدأ محادثة جديدة", subject: "موضوع المحادثة",
    recipient: "اختر المحامي أو المساعد", start: "بدء المحادثة", conversations: "محادثاتك",
    empty: "لا توجد محادثات حتى الآن.", office: "فريق المكتب", client: "العميل",
    open: "مفتوحة", closed: "مغلقة", last: "آخر نشاط", view: "فتح المحادثة",
    notifications: "آخر الإشعارات", noNotifications: "لا توجد إشعارات حتى الآن.",
    markRead: "تحديد الكل كمقروء", unread: "جديد", deleteConversation: "حذف المحادثة من حسابي", deleteNotification: "حذف الإشعار", deleteAllNotifications: "مسح كل الإشعارات", staffPrivateTitle: "محادثة داخلية خاصة", staffPrivateIntro: "ابدأ محادثة خاصة مع المدير أو مالك المكتب أو أحد أعضاء الفريق. لا يمكن لبقية الموظفين الاطلاع على هذه المحادثة.", staffRecipient: "اختر عضو فريق المكتب", noStaffRecipients: "لا يوجد أعضاء فريق آخرون نشطون متاحون حاليًا.", confirmDeleteConversation: "هل تريد إخفاء هذه المحادثة من حسابك؟ ستظل ظاهرة للطرف الآخر.", confirmDeleteNotification: "هل تريد حذف هذا الإشعار؟", confirmDeleteAllNotifications: "هل تريد حذف جميع إشعارات حسابك؟", loadingError: "تعذر تحميل المحادثات. تحقق من ترحيل المرحلة السابعة.",
    inactive: "حساب الموظف غير نشط. تواصل مع مالك المكتب لمراجعة الصلاحيات.",
    results: { "start-failed":"تعذر بدء المحادثة. تأكد من اختيار موظف نشط.", "notifications-failed":"تعذر تحديث الإشعارات.", "notifications-read":"تم تحديد الإشعارات كمقروءة.", "conversation-hidden":"تم إخفاء المحادثة من حسابك.", "conversation-delete-failed":"تعذر حذف المحادثة من حسابك.", "notification-deleted":"تم حذف الإشعار.", "notification-delete-failed":"تعذر حذف الإشعار.", "notifications-deleted":"تم مسح الإشعارات.", "notifications-delete-failed":"تعذر مسح الإشعارات.", "staff-conversation-failed":"تعذر إنشاء المحادثة الداخلية. تأكد من صلاحيات الحساب وأن المستلم نشط." } as Record<string,string>,
    subjectPlaceholder: "مثال: استفسار عن موعد الاستشارة",
  } : {
    title: "Conversations & notifications", intro: "Secure client-to-office communication with in-account notifications.",
    dashboard: "Dashboard", newTitle: "Start a conversation", subject: "Conversation subject",
    recipient: "Choose a lawyer or assistant", start: "Start conversation", conversations: "Your conversations",
    empty: "No conversations yet.", office: "Office team", client: "Client",
    open: "Open", closed: "Closed", last: "Last activity", view: "Open conversation",
    notifications: "Recent notifications", noNotifications: "No notifications yet.",
    markRead: "Mark all as read", unread: "New", deleteConversation: "Remove from my account", deleteNotification: "Delete notification", deleteAllNotifications: "Clear all notifications", staffPrivateTitle: "Private staff conversation", staffPrivateIntro: "Start a private conversation with the office owner, manager, or another active team member. Other staff cannot read this conversation.", staffRecipient: "Choose a staff member", noStaffRecipients: "No other active staff members are available.", confirmDeleteConversation: "Hide this conversation from your account? It will remain visible to the other participant.", confirmDeleteNotification: "Delete this notification?", confirmDeleteAllNotifications: "Delete all notifications in your account?", loadingError: "Could not load conversations. Confirm the Phase 7 migration is applied.",
    inactive: "Your staff account is inactive. Contact the office owner to review access.",
    results: { "start-failed":"Could not start the conversation. Choose an active staff member.", "notifications-failed":"Could not update notifications.", "notifications-read":"Notifications marked as read.", "conversation-hidden":"Conversation hidden from your account.", "conversation-delete-failed":"Could not hide the conversation.", "notification-deleted":"Notification deleted.", "notification-delete-failed":"Could not delete the notification.", "notifications-deleted":"Notifications cleared.", "notifications-delete-failed":"Could not clear notifications.", "staff-conversation-failed":"Could not create the private staff conversation. Confirm your access and that the recipient is active." } as Record<string,string>,
    subjectPlaceholder: "e.g. Question about my consultation",
  };
  const unreadCount = (notifications || []).filter(n => !n.read_at).length;
  return <main className="mizan-dashboard-page min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar ? "rtl" : "ltr"}>
    <nav className="mizan-dashboard-page-nav" aria-label={ar?"التنقل داخل لوحة التحكم":"Dashboard navigation"}><Link href={"/"+locale+"/dashboard"}>⌂ <span>{ar?"لوحة التحكم":"Overview"}</span></Link><Link href={"/"+locale+"/dashboard/cases"}>▤ <span>{ar?"ملفات القضايا":"Cases"}</span></Link><Link href={"/"+locale+"/dashboard/appointments"}>▦ <span>{ar?"المواعيد":"Appointments"}</span></Link><Link href={"/"+locale+"/dashboard/conversations"}>◌ <span>{ar?"المحادثات":"Messages"}</span></Link>{["owner","admin"].includes(String(staff?.role||""))&&<><Link href={"/"+locale+"/dashboard/staff"}>♙ <span>{ar?"المستخدمون":"Staff"}</span></Link><Link href={"/"+locale+"/dashboard/services"}>⚖ <span>{ar?"الخدمات":"Services"}</span></Link><Link href={"/"+locale+"/dashboard/settings"}>⚙ <span>{ar?"الإعدادات":"Settings"}</span></Link><Link href={"/"+locale+"/dashboard/audit"}>◷ <span>{ar?"سجل التدقيق":"Audit log"}</span></Link></>}</nav>

    <div className="mx-auto max-w-6xl">
      <Link href={"/" + locale + "/dashboard"} className="text-sm font-bold text-[#176b67] hover:underline">← {t.dashboard}</Link>
      <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / SECURE MESSAGING</p>
      <h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{t.title}</h1>
      <p className="mt-3 max-w-3xl leading-7 text-[#657184]">{t.intro}</p>
      {result && t.results[result] && <p role="status" className="mt-5 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{t.results[result]}</p>}
      {conversationsError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{t.loadingError}</p>}
      {isClient && <section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-black text-[#14263d]">{t.newTitle}</h2>
        <form action={startConversation} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={locale}/>
          <label className="text-sm font-bold text-[#14263d]">{t.subject}
            <input required minLength={3} maxLength={160} name="subject" placeholder={t.subjectPlaceholder} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-[#14263d]">{t.recipient}
            <select required name="staffId" defaultValue="" className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 font-normal">
              <option value="" disabled>{t.recipient}</option>
              {(contacts || []).map((contact: {profile_id:string;full_name:string;role:string}) => <option key={contact.profile_id} value={contact.profile_id}>{contact.full_name || (ar ? "عضو فريق المكتب" : "Office team member")} · {contact.role === "lawyer" ? (ar ? "محامٍ" : "Lawyer") : (ar ? "مساعد" : "Assistant")}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2"><button type="submit" disabled={!contacts?.length} className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#176b67] disabled:cursor-not-allowed disabled:opacity-50">{t.start}</button></div>
          {!contacts?.length && <p className="sm:col-span-2 text-sm text-[#657184]">{ar ? "لا يوجد محامون أو مساعدين نشطون متاحون حاليًا." : "No active lawyers or assistants are available right now."}</p>}
        </form>
      </section>}
      {isStaff && !activeStaff && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{t.inactive}</p>}
      {isStaff && activeStaff && <section className="mt-8 rounded-2xl border border-[#176b67]/20 bg-[#f0f7f4] p-5 sm:p-7">
        <div className="flex items-start gap-3"><span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#14263d] text-lg text-white">🔒</span><div><h2 className="text-xl font-black text-[#14263d]">{t.staffPrivateTitle}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#657184]">{t.staffPrivateIntro}</p></div></div>
        <form action={startStaffConversation} className="mt-5 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="locale" value={locale}/>
          <label className="text-sm font-bold text-[#14263d]">{t.subject}
            <input required minLength={3} maxLength={160} name="subject" placeholder={t.subjectPlaceholder} className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-[#14263d]">{t.staffRecipient}
            <select required name="recipientId" defaultValue="" className="mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 font-normal">
              <option value="" disabled>{t.staffRecipient}</option>
              {(staffRecipients || []).map((contact: {profile_id:string;full_name:string;role:string}) => <option key={contact.profile_id} value={contact.profile_id}>{contact.full_name || (ar ? "عضو فريق المكتب" : "Office team member")} · {contact.role === "owner" ? (ar ? "رئيس المكتب" : "Office owner") : contact.role === "admin" ? (ar ? "مدير" : "Manager") : contact.role === "lawyer" ? (ar ? "محامٍ" : "Lawyer") : (ar ? "مساعد" : "Assistant")}</option>)}
            </select>
          </label>
          <div className="sm:col-span-2"><button type="submit" disabled={!staffRecipients?.length} className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#176b67] disabled:cursor-not-allowed disabled:opacity-50">{t.start}</button></div>
          {!staffRecipients?.length && <p className="sm:col-span-2 text-sm text-[#657184]">{t.noStaffRecipients}</p>}
        </form>
      </section>}
      <ConversationListClient
        locale={locale}
        conversations={visibleConversations}
        isClient={isClient}
        hideAction={hideConversations}
        copy={{
          title: t.conversations,
          empty: t.empty,
          open: t.open,
          closed: t.closed,
          last: t.last,
          view: t.view,
          staffPrivateTitle: t.staffPrivateTitle,
          office: t.office,
          client: t.client,
          deleteMode: ar ? "تحديد محادثات للحذف" : "Select conversations to delete",
          cancelSelection: ar ? "إلغاء التحديد" : "Cancel selection",
          deleteSelected: ar ? "حذف المحدد" : "Delete selected",
          selectedCount: ar ? "تم تحديد {count} محادثة." : "{count} conversation(s) selected.",
          confirmTitle: ar ? "تأكيد حذف المحادثات" : "Confirm conversation removal",
          confirmBody: ar
            ? "هل تريد إزالة {count} محادثة من حسابك؟ لن تُحذف عند الطرف الآخر، ويمكن أن تظل رسائلها محفوظة لديه."
            : "Remove {count} conversation(s) from your account? They will remain available to the other participant.",
          confirmAction: ar ? "نعم، احذف من حسابي" : "Yes, remove from my account",
          cancel: ar ? "رجوع" : "Cancel",
        }}
      />
      <section className="mt-10 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black text-[#14263d]">{t.notifications} {unreadCount > 0 && <span className="ms-2 rounded-full bg-[#176b67]/10 px-2 py-1 text-xs text-[#176b67]">{unreadCount} {t.unread}</span>}</h2>
          <div className="flex flex-wrap items-center gap-3">{unreadCount > 0 && <form action={markNotificationsRead}><input type="hidden" name="locale" value={locale}/><button className="text-sm font-bold text-[#176b67] hover:underline">{t.markRead}</button></form>}{!!notifications?.length && <form action={deleteAllNotifications}><input type="hidden" name="locale" value={locale}/><ConfirmSubmitButton message={t.confirmDeleteAllNotifications} className="text-sm font-bold text-red-700 hover:underline">{t.deleteAllNotifications}</ConfirmSubmitButton></form>}</div>
        </div>
        {!notifications?.length ? <p className="mt-4 text-sm text-[#657184]">{t.noNotifications}</p> : <ul className="mt-4 divide-y divide-[#14263d]/10">
          {notifications.map((notification) => <li key={notification.id} className={"flex items-start justify-between gap-3 py-4 " + (!notification.read_at ? "font-semibold" : "")}>
            <Link href={notification.href} className="block min-w-0 flex-1 rounded-lg hover:text-[#176b67]"><div className="flex items-start justify-between gap-3"><span className="text-sm text-[#14263d]">{notification.title}</span>{!notification.read_at && <span className="rounded-full bg-[#176b67]/10 px-2 py-1 text-[11px] text-[#176b67]">{t.unread}</span>}</div>
              {notification.body && <p className="mt-1 text-sm font-normal text-[#657184]">{notification.body}</p>}
              <p className="mt-2 text-xs font-normal text-[#657184]">{new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(notification.created_at))}</p>
            </Link>
            <form action={deleteNotification} className="shrink-0"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="notificationId" value={notification.id}/><ConfirmSubmitButton message={t.confirmDeleteNotification} ariaLabel={t.deleteNotification} title={t.deleteNotification} className="rounded-lg px-2 py-1 text-sm font-bold text-red-700 hover:bg-red-50">×</ConfirmSubmitButton></form>
          </li>)}
        </ul>}
      </section>
    </div>
  </main>;
}
