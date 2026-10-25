import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { ConversationListClient } from "@/components/conversations/conversation-list-client";
import { hideConversations, startConversation, startStaffConversation } from "./actions";

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

  const [{ data: staff }, { data: conversations, error: conversationsError }, { data: contacts }, { data: hiddenConversations }, { data: staffRecipients }] = await Promise.all([
    supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle(),
    supabase.from("conversations").select("id,client_id,staff_id,subject,status,conversation_type,last_message_at,created_at").order("last_message_at", { ascending: false }).limit(100),
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
    title: "المحادثات", intro: "تواصل آمن ومنظم بين العميل وفريق المكتب، مع مساحة مستقلة لكل محادثة.",
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
    title: "Conversations", intro: "Secure, organized communication between clients and the office team, with a dedicated space for each conversation.",
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
  return <main className="mizan-dashboard-page min-h-screen overflow-hidden bg-[#f4f2ec] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar ? "rtl" : "ltr"}>
    <nav className="mizan-dashboard-page-nav mx-auto mb-6 flex max-w-7xl flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar?"التنقل داخل لوحة التحكم":"Dashboard navigation"}><Link href={"/"+locale+"/dashboard"}>⌂ <span>{ar?"لوحة التحكم":"Overview"}</span></Link><Link href={"/"+locale+"/dashboard/cases"}>▤ <span>{ar?"ملفات القضايا":"Cases"}</span></Link><Link href={"/"+locale+"/dashboard/appointments"}>▦ <span>{ar?"المواعيد":"Appointments"}</span></Link><Link href={"/"+locale+"/dashboard/conversations"}>◌ <span>{ar?"المحادثات":"Messages"}</span></Link>{["owner","admin"].includes(String(staff?.role||""))&&<><Link href={"/"+locale+"/dashboard/staff"}>♙ <span>{ar?"المستخدمون":"Staff"}</span></Link><Link href={"/"+locale+"/dashboard/services"}>⚖ <span>{ar?"الخدمات":"Services"}</span></Link><Link href={"/"+locale+"/dashboard/settings"}>⚙ <span>{ar?"الإعدادات":"Settings"}</span></Link><Link href={"/"+locale+"/dashboard/audit"}>◷ <span>{ar?"سجل التدقيق":"Audit log"}</span></Link></>}</nav>

    <div className="mx-auto max-w-7xl">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96"/><div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72"/>
        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end"><div className="max-w-3xl"><Link href={"/"+locale+"/dashboard"} className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] hover:bg-white/10">{ar?"← العودة إلى لوحة التحكم":"← Back to dashboard"}</Link><p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL / SECURE MESSAGING</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{t.title}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{t.intro}</p></div><div className="flex flex-wrap gap-2"><Link href={"/"+locale+"/dashboard/conversations"} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-bold text-white">{ar?"المحادثات":"Conversations"}</Link><Link href={"/"+locale+"/dashboard/notifications"} className="rounded-xl border border-[#d8b878]/40 bg-[#d8b878]/10 px-4 py-3 text-sm font-bold text-[#f1dfb7]">{ar?"الإشعارات":"Notifications"}</Link></div></div>
      </section>
      {result && t.results[result] && <p role="status" className="mt-5 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{t.results[result]}</p>}
      {conversationsError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{t.loadingError}</p>}
      {isClient && <section className="mt-6 rounded-[1.5rem] border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
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
      {isStaff && activeStaff && <section className="mt-6 rounded-[1.5rem] border border-[#176b67]/20 bg-[#f0f7f4] p-5 shadow-sm sm:p-7 lg:p-8">
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
    </div>
  </main>;
}
