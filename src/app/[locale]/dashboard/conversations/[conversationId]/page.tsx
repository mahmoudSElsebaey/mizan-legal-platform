import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { changeConversationStatus } from "../actions";
import { ConversationThreadClient } from "@/components/conversations/conversation-thread-client";

export default async function ConversationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { locale, conversationId } = await params;
  const { result } = await searchParams;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/" + locale + "/login");

  const [{ data: conversation, error: conversationError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase.from("conversations").select("id,client_id,staff_id,subject,status,created_at,last_message_at").eq("id", conversationId).maybeSingle(),
    supabase.from("conversation_messages").select("id,conversation_id,sender_id,body,created_at,attachments,edited_at,deleted_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(300),
  ]);
  if (conversationError || !conversation) notFound();
  const { data: staff } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  const isActiveStaff = staff?.status === "active" && ["owner","admin","lawyer","assistant"].includes(staff.role);
  const isClient = conversation.client_id === user.id;
  const canSend = conversation.status === "open" && (isClient || isActiveStaff);
  const t = ar ? {
    back:"كل المحادثات", office:"فريق المكتب", client:"العميل", open:"مفتوحة", closed:"مغلقة",
    title:"المحادثة", intro:"استخدم هذه المساحة للتواصل بشأن استفسارك. لا ترسل بيانات دخول أو معلومات دفع حساسة.",
    messages:"الرسائل", empty:"لا توجد رسائل بعد. اكتب رسالتك الأولى أدناه.",
    placeholder:"اكتب رسالتك هنا...", send:"إرسال الرسالة", close:"إغلاق المحادثة", reopen:"إعادة فتح المحادثة",
    closedNotice:"هذه المحادثة مغلقة. أعد فتحها لإرسال رسالة جديدة.",
    sent:"تم إرسال الرسالة.", "send-failed":"تعذر إرسال الرسالة. قد تكون المحادثة مغلقة أو لا تملك صلاحية الوصول.",
    "status-updated":"تم تحديث حالة المحادثة.", "status-failed":"تعذر تحديث حالة المحادثة.",
    noMessages:"تعذر تحميل الرسائل. تحقق من ترحيل المرحلة السابعة."
  } : {
    back:"All conversations", office:"Office team", client:"Client", open:"Open", closed:"Closed",
    title:"Conversation", intro:"Use this space to discuss your inquiry. Do not send passwords or sensitive payment details.",
    messages:"Messages", empty:"No messages yet. Write your first message below.",
    placeholder:"Write your message here...", send:"Send message", close:"Close conversation", reopen:"Reopen conversation",
    closedNotice:"This conversation is closed. Reopen it before sending another message.",
    sent:"Message sent.", "send-failed":"Could not send the message. The conversation may be closed or you may not have access.",
    "status-updated":"Conversation status updated.", "status-failed":"Could not update the conversation status.",
    noMessages:"Could not load messages. Confirm the Phase 7 migration is applied."
  } as Record<string,string>;
  const resultText = result ? t[result] : "";
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar ? "rtl" : "ltr"}>
    <div className="mx-auto max-w-4xl">
      <Link href={"/" + locale + "/dashboard/conversations"} className="text-sm font-bold text-[#176b67] hover:underline">← {t.back}</Link>
      <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / PRIVATE CONVERSATION</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-black text-[#14263d]">{conversation.subject}</h1><p className="mt-2 text-sm text-[#657184]">{t.title} · {isClient ? t.office : t.client}</p></div>
        <span className={"rounded-full px-3 py-1.5 text-xs font-bold " + (conversation.status === "open" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{conversation.status === "open" ? t.open : t.closed}</span>
      </div>
      <p className="mt-4 max-w-3xl leading-7 text-[#657184]">{t.intro}</p>
      {resultText && <p role="status" className={"mt-5 rounded-xl p-4 text-sm font-semibold " + (result?.endsWith("failed") ? "bg-red-50 text-red-800" : "border border-[#176b67]/20 bg-white text-[#176b67]")}>{resultText}</p>}
      {messagesError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{t.noMessages}</p>}
      <section className="mt-7 rounded-2xl border border-[#14263d]/10 bg-white p-4 sm:p-7">
        <h2 className="text-lg font-black text-[#14263d]">{t.messages}</h2>
        <ConversationThreadClient locale={locale} conversationId={conversation.id} userId={user.id} initialMessages={(messages || []) as Array<{ id: string; conversation_id: string; sender_id: string; body: string; created_at: string; attachments: Array<{ path: string; name: string; mime_type: string; size: number }>; edited_at: string | null; deleted_at: string | null }>} canSend={canSend} />
        {!canSend && <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{t.closedNotice}</p>}
        {(isClient || isActiveStaff) && <form action={changeConversationStatus} className="mt-4 border-t border-[#14263d]/10 pt-4">
          <input type="hidden" name="locale" value={locale}/><input type="hidden" name="conversationId" value={conversation.id}/>
          <input type="hidden" name="status" value={conversation.status === "open" ? "closed" : "open"}/>
          <button className="rounded-xl border border-[#14263d]/15 px-4 py-2.5 text-sm font-bold text-[#14263d] hover:border-[#176b67]">{conversation.status === "open" ? t.close : t.reopen}</button>
        </form>}
      </section>
    </div>
  </main>;
}
