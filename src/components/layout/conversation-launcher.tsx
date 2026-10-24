"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";
type Thread = { id: string; client_id: string; staff_id: string; subject: string; status: string; conversation_type: "client" | "staff"; last_message_at: string };
type Attachment = { path: string; name: string; mime_type: string; size: number };
type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; attachments: Attachment[]; edited_at: string | null; deleted_at: string | null };
type Person = { id: string; full_name: string | null };
type Contact = { profile_id: string; full_name: string | null; role: string };

function describeError(value: unknown): string {
  if (value instanceof Error && value.message) return value.message;
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    const parts = [item.message, item.details, item.hint, item.code ? `code: ${item.code}` : null]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length) return parts.join(" · ");
    try { return JSON.stringify(value); } catch { return "Unknown error"; }
  }
  return typeof value === "string" ? value : "Unknown error";
}

function playIncomingTone() {
  try {
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, ctx.currentTime);
    oscillator.frequency.setValueAtTime(990, ctx.currentTime + 0.11);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    oscillator.connect(gain); gain.connect(ctx.destination);
    oscillator.start(); oscillator.stop(ctx.currentTime + 0.3);
    oscillator.onended = () => void ctx.close();
  } catch { /* Audio may be unavailable or blocked until user interaction. */ }
}

export function ConversationLauncher({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [userId, setUserId] = useState("");
  const [currentStaffRole, setCurrentStaffRole] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
  const [personRoles, setPersonRoles] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState("");
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hidingConversationId, setHidingConversationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const seen = useRef(new Set<string>());
  const bottomRef = useRef<HTMLDivElement>(null);
  const labels = useMemo(() => ar ? {
    title: "الرسائل", subtitle: "", search: "ابحث في المحادثات",
    empty: "لا توجد محادثات حتى الآن", choose: "اختر محادثة لعرض الرسائل",
    placeholder: "اكتب رسالتك...", send: "إرسال", loading: "جارٍ تحميل المحادثات...",
    online: "مراسلة آمنة", sound: "صوت الإشعار", openFull: "فتح صفحة المحادثات",
    closed: "مغلقة", newConversation: "بدء محادثة جديدة", noMessages: "ابدأ المحادثة برسالتك الأولى", failed: "تعذر تحميل البيانات أو إرسال الرسالة.",
    you: "أنت", today: "اليوم", newModalTitle: "ابدأ محادثة جديدة", topic: "موضوع المحادثة", interlocutor: "اختر المحاور", start: "إنشاء المحادثة", noContacts: "لا يوجد أعضاء فريق نشطون متاحون حاليًا.", privateConversation: "محادثة داخلية خاصة", privateHint: "هذه المحادثة خاصة بينك وبين الموظف الذي تختاره فقط.", viewOnly: "يمكنك الاطلاع على هذه المحادثة فقط، ولا يمكن إرسال رسائل إلا من طرفيها.", subjectPlaceholder: "مثال: استفسار عن قضية أو موعد", copy: "نسخ", edit: "تعديل", remove: "حذف", save: "حفظ", cancel: "إلغاء", edited: "تم التعديل", deleted: "تم حذف هذه الرسالة", attach: "إرفاق ملفات أو صور", filesLimit: "يمكن إرفاق 5 ملفات كحد أقصى، بحد 10 ميجابايت لكل ملف.", uploadFailed: "تعذر رفع الملف. حاول مرة أخرى.", editFailed: "تعذر تعديل الرسالة.", deleteFailed: "تعذر حذف الرسالة.", copied: "تم نسخ الرسالة", removeConfirm: "هل تريد حذف هذه الرسالة؟", hideConversation: "إخفاء المحادثة من قائمتي", conversationActions: "خيارات المحادثة", hideConversationConfirm: "سيتم إخفاء المحادثة من قائمتك فقط. سيظل الطرف الآخر قادرًا على إرسال الرسائل، وستظهر المحادثة مجددًا عند وصول رسالة جديدة.", hideConversationFailed: "تعذر إخفاء المحادثة.",
  } : {
    title: "Messages", subtitle: "", search: "Search conversations",
    empty: "No conversations yet", choose: "Choose a conversation to view messages",
    placeholder: "Write a message...", send: "Send", loading: "Loading conversations...",
    online: "Secure messaging", sound: "Notification sound", openFull: "Open conversations page",
    closed: "Closed", newConversation: "Start a new conversation", noMessages: "Start the conversation with your first message", failed: "Could not load data or send the message.",
    you: "You", today: "Today", newModalTitle: "Start a new conversation", topic: "Conversation subject", interlocutor: "Choose a participant", start: "Create conversation", noContacts: "No active office team members are available right now.", privateConversation: "Private staff conversation", privateHint: "This conversation is private between you and the selected staff member only.", viewOnly: "You can view this conversation, but only its two participants can send messages.", subjectPlaceholder: "e.g. Question about a case or appointment", copy: "Copy", edit: "Edit", remove: "Delete", save: "Save", cancel: "Cancel", edited: "Edited", deleted: "This message was deleted", attach: "Attach files or images", filesLimit: "Up to 5 files, 10 MB per file.", uploadFailed: "Could not upload the file. Please try again.", editFailed: "Could not edit this message.", deleteFailed: "Could not delete this message.", copied: "Message copied", removeConfirm: "Delete this message?", hideConversation: "Hide from my list", conversationActions: "Conversation actions", hideConversationConfirm: "This hides the conversation from your list only. The other participant can still message, and the conversation will reappear when a new message arrives.", hideConversationFailed: "Could not hide the conversation.",
  }, [ar]);

  const loadThreads = useCallback(async (uid: string, playSound = false) => {
    const supabase = createClient();
    const [{ data, error: queryError }, { data: hiddenRows }] = await Promise.all([
      supabase.from("conversations").select("id,client_id,staff_id,subject,status,conversation_type,last_message_at").order("last_message_at", { ascending: false }).limit(60),
      supabase.from("conversation_hidden_for_user").select("conversation_id").eq("user_id", uid),
    ]);
    if (queryError) { setError(labels.failed); return; }
    const { data: ownStaff } = await supabase.from("staff_members").select("role,status").eq("profile_id", uid).maybeSingle();
    const activeRole = ownStaff?.status === "active" ? ownStaff.role : "";
    setCurrentStaffRole(activeRole);
    const hiddenIds = new Set((hiddenRows || []).map((item) => item.conversation_id));
    const rows = ((data || []) as Thread[]).filter((thread) => !hiddenIds.has(thread.id));
    setThreads(rows);
    if (selected && hiddenIds.has(selected)) setSelected("");
    const ids = Array.from(new Set(rows.flatMap((thread) => [thread.client_id, thread.staff_id])));
    if (ids.length) {
      const [profilesResult, staffResult] = await Promise.all([
        supabase.from("profiles").select("id,full_name").in("id", ids),
        activeRole ? supabase.rpc("list_contactable_staff_recipients") : supabase.rpc("list_contactable_staff"),
      ]);
      const nextPeople: Record<string, string> = Object.fromEntries(
        ((profilesResult.data || []) as Person[]).map((person) => [person.id, person.full_name?.trim() || ""]),
      );
      const nextRoles: Record<string, string> = {};
      const staffRows = (staffResult.data || []) as Contact[];
      for (const staff of staffRows) {
        if (!ids.includes(staff.profile_id)) continue;
        if (staff.full_name?.trim()) nextPeople[staff.profile_id] = staff.full_name.trim();
        nextRoles[staff.profile_id] = staff.role;
      }
      setPeople(nextPeople);
      setPersonRoles(nextRoles);
    }
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("kind", "new_message").is("read_at", null);
    setUnread(count || 0);
    if (!selected && rows[0] && !window.matchMedia("(max-width: 680px)").matches) setSelected(rows[0].id);
    if (playSound && soundOn) playIncomingTone();
  }, [ar, labels.failed, selected, soundOn]);

  const loadMessages = useCallback(async (threadId: string, uid: string, playSound = false) => {
    if (!threadId) return;
    const supabase = createClient();
    const { data, error: queryError } = await supabase.from("conversation_messages")
      .select("id,conversation_id,sender_id,body,created_at,attachments,edited_at,deleted_at").eq("conversation_id", threadId)
      .order("created_at", { ascending: true }).limit(300);
    if (queryError) { setError(labels.failed); return; }
    const next = ((data || []) as Message[]).map((message) => ({ ...message, attachments: message.attachments || [] }));
    const incoming = next.filter((message) => message.sender_id !== uid && !seen.current.has(message.id));
    next.forEach((message) => seen.current.add(message.id));
    setMessages(next);
    if (playSound && incoming.length && soundOn) playIncomingTone();
    await createClient().from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", uid).eq("conversation_id", threadId).is("read_at", null).eq("kind", "new_message");
    await loadThreads(uid);
  }, [labels.failed, loadThreads, soundOn]);

  useEffect(() => {
    const openFromFloatingAction = () => {
      setSelected("");
      setOpen(true);
      if (userId) void loadThreads(userId);
    };
    window.addEventListener("mizan:open-conversations", openFromFloatingAction);
    return () => window.removeEventListener("mizan:open-conversations", openFromFloatingAction);
  }, [userId, loadThreads]);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      if (!alive || !data.user) return;
      setUserId(data.user.id);
      void loadThreads(data.user.id);
    });
    const channel = supabase.channel("mizan-message-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages" }, (payload) => {
        const message = payload.new as Message;
        if (message.sender_id !== userId && seen.current.has(message.id) === false) {
          // When the drawer is closed, keep notifying even if this thread remains selected.
          // When open on this thread, the thread-scoped channel plays the sound instead.
          if ((!open || selected !== message.conversation_id) && soundOn) playIncomingTone();
          if (open && selected === message.conversation_id) void loadMessages(message.conversation_id, userId);
          else void loadThreads(userId);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_messages" }, (payload) => {
        const updated = payload.new as Message;
        setMessages((current) => current.map((item) => item.id === updated.id ? { ...updated, attachments: updated.attachments || [] } : item));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const notice = payload.new as { user_id?: string; kind?: string };
        if (notice.user_id === userId && notice.kind === "new_message") void loadThreads(userId);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" }, (payload) => {
        const notice = payload.new as { user_id?: string };
        if (notice.user_id === userId) void loadThreads(userId);
      }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [pathname, loadThreads, loadMessages, selected, soundOn, userId, open]);

  useEffect(() => {
    const closeMessageMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      document.querySelectorAll<HTMLDetailsElement>(".mizan-chat-message-menu[open]").forEach((menu) => {
        if (!menu.contains(target) || !(target instanceof Element && target.closest("summary"))) menu.removeAttribute("open");
      });
    };
    document.addEventListener("click", closeMessageMenus);
    return () => document.removeEventListener("click", closeMessageMenus);
  }, []);

  useEffect(() => {
    if (!open || !selected || !userId) return;
    void loadMessages(selected, userId);
    const channel = createClient().channel("mizan-thread-" + selected)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: "conversation_id=eq." + selected }, (payload) => {
        const message = payload.new as Message;
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        if (message.sender_id !== userId && soundOn) playIncomingTone();
      }).subscribe();
    return () => { void createClient().removeChannel(channel); };
  }, [open, selected, userId, loadMessages, soundOn]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, open]);

  useEffect(() => {
    let active = true;
    const paths = Array.from(new Set(messages.flatMap((message) => message.attachments || []).map((attachment) => attachment.path))).filter((path) => !attachmentUrls[path]);
    if (!paths.length) return;
    const supabase = createClient();
    void Promise.all(paths.map(async (path) => {
      const { data } = await supabase.storage.from("conversation-attachments").createSignedUrl(path, 3600);
      return data?.signedUrl ? [path, data.signedUrl] as const : null;
    })).then((results) => {
      if (!active) return;
      setAttachmentUrls((current) => ({ ...current, ...Object.fromEntries(results.filter((item): item is readonly [string, string] => !!item)) }));
    });
    return () => { active = false; };
  }, [messages, attachmentUrls]);

  async function openNewConversation() {
    setNewModalOpen(true);
    setError("");
    if (!userId || contactsLoading) return;
    setContactsLoading(true);
    const supabase = createClient();
    const { data: ownStaff, error: staffError } = await supabase.from("staff_members")
      .select("role,status").eq("profile_id", userId).maybeSingle();
    if (staffError) {
      setError(labels.failed + " " + describeError(staffError));
      setContactsLoading(false);
      return;
    }
    if (ownStaff && ownStaff.status !== "active") {
      setCurrentStaffRole("");
      setContacts([]);
      setNewRecipient("");
      setError(ar ? "حساب الموظف غير نشط، ولا يمكنه بدء محادثات جديدة." : "Your staff account is inactive and cannot start conversations.");
      setContactsLoading(false);
      return;
    }
    const activeRole = ownStaff?.status === "active" ? ownStaff.role : "";
    setCurrentStaffRole(activeRole);
    const { data, error: contactsError } = await supabase.rpc(activeRole ? "list_contactable_staff_recipients" : "list_contactable_staff");
    if (contactsError) {
      setError(labels.failed + " " + describeError(contactsError));
    } else {
      const available = (data || []) as Contact[];
      setContacts(available);
      setNewRecipient(available[0]?.profile_id || "");
    }
    setContactsLoading(false);
  }

  async function createConversation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = newSubject.trim();
    if (!userId || subject.length < 3 || subject.length > 160 || !newRecipient || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { data: ownStaff, error: staffError } = await supabase.from("staff_members")
      .select("role,status").eq("profile_id", userId).maybeSingle();
    if (staffError) {
      setError(labels.failed + " " + describeError(staffError));
      setBusy(false);
      return;
    }
    if (ownStaff && ownStaff.status !== "active") {
      setError(ar ? "حساب الموظف غير نشط، ولا يمكنه بدء محادثات جديدة." : "Your staff account is inactive and cannot start conversations.");
      setBusy(false);
      return;
    }
    const activeRole = ownStaff?.status === "active" ? ownStaff.role : "";
    setCurrentStaffRole(activeRole);
    const { data, error: createError } = await supabase.from("conversations")
      .insert({ client_id: userId, staff_id: newRecipient, subject, status: "open", conversation_type: activeRole ? "staff" : "client" })
      .select("id,client_id,staff_id,subject,status,conversation_type,last_message_at").single();
    if (createError || !data) {
      setError(labels.failed + (createError ? " " + describeError(createError) : " No conversation record was returned."));
      setBusy(false);
      return;
    }
    const thread = data as Thread;
    setThreads((current) => [thread, ...current.filter((item) => item.id !== thread.id)]);
    const contact = contacts.find((item) => item.profile_id === newRecipient);
    if (contact) setPeople((current) => ({ ...current, [contact.profile_id]: contact.full_name || (ar ? "عضو فريق المكتب" : "Office team member") }));
    setSelected(thread.id);
    setMessages([]);
    setNewModalOpen(false);
    setNewSubject("");
    setNewRecipient("");
    setBusy(false);
  }

  async function hideConversation(thread: Thread) {
    if (!userId || hidingConversationId || !window.confirm(labels.hideConversationConfirm)) return;
    setHidingConversationId(thread.id);
    setError("");
    const { error: hideError } = await createClient().from("conversation_hidden_for_user")
      .upsert({ conversation_id: thread.id, user_id: userId }, { onConflict: "conversation_id,user_id", ignoreDuplicates: true });
    if (hideError) setError(labels.hideConversationFailed);
    else {
      setThreads((current) => current.filter((item) => item.id !== thread.id));
      if (selected === thread.id) { setSelected(""); setMessages([]); }
    }
    setHidingConversationId(null);
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && pendingFiles.length === 0) || !selected || !userId || busy) return;
    if (pendingFiles.length > 5 || pendingFiles.some((file) => file.size > 10 * 1024 * 1024)) { setError(labels.filesLimit); return; }
    setBusy(true); setError("");
    const supabase = createClient();
    const uploaded: Attachment[] = [];
    try {
      for (const file of pendingFiles) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "attachment";
        const path = `${selected}/${userId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("conversation-attachments").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push({ path, name: file.name, mime_type: file.type || "application/octet-stream", size: file.size });
      }
      const { data, error: insertError } = await supabase.from("conversation_messages")
        .insert({ conversation_id: selected, sender_id: userId, body, attachments: uploaded }).select("id,conversation_id,sender_id,body,created_at,attachments,edited_at,deleted_at").single();
      if (insertError || !data) throw insertError || new Error("Message insert failed");
      const message = { ...(data as Message), attachments: (data as Message).attachments || [] };
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setDraft(""); setPendingFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; void loadThreads(userId);
    } catch (caught) {
      if (uploaded.length) void supabase.storage.from("conversation-attachments").remove(uploaded.map((file) => file.path));
      const detail = describeError(caught);
      setError((pendingFiles.length ? labels.uploadFailed : labels.failed) + (detail ? " " + detail : ""));
    } finally { setBusy(false); }
  }

  async function copyMessage(message: Message) {
    try { await navigator.clipboard.writeText(message.body); } catch { setError(labels.failed); }
  }

  async function saveMessageEdit(message: Message) {
    const body = editDraft.trim();
    if (!body || !userId || busy) return;
    setBusy(true); setError("");
    const editedAt = new Date().toISOString();
    const { data, error: updateError } = await createClient().from("conversation_messages").update({ body, edited_at: editedAt }).eq("id", message.id).eq("sender_id", userId).is("deleted_at", null).select("id").maybeSingle();
    if (updateError || !data) setError(labels.editFailed);
    else { setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body, edited_at: editedAt } : item)); setEditingId(""); setEditDraft(""); }
    setBusy(false);
  }

  async function deleteMessage(message: Message) {
    if (!userId || busy || !window.confirm(labels.removeConfirm)) return;
    setBusy(true); setError("");
    const deletedAt = new Date().toISOString();
    const { data, error: updateError } = await createClient().from("conversation_messages").update({ body: "", attachments: [], deleted_at: deletedAt }).eq("id", message.id).eq("sender_id", userId).is("deleted_at", null).select("id").maybeSingle();
    if (updateError || !data) setError(labels.deleteFailed);
    else { setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: "", attachments: [], deleted_at: deletedAt } : item)); if (message.attachments?.length) void createClient().storage.from("conversation-attachments").remove(message.attachments.map((attachment) => attachment.path)); setEditingId(""); }
    setBusy(false);
  }

  const active = threads.find((thread) => thread.id === selected);
  const filteredThreads = threads.filter((thread) => {
    const participant = thread.client_id === userId ? thread.staff_id : thread.client_id;
    const query = searchQuery.trim().toLocaleLowerCase(ar ? "ar-EG" : "en-US");
    return !query || `${people[participant] || ""} ${thread.subject}`.toLocaleLowerCase(ar ? "ar-EG" : "en-US").includes(query);
  });
  const otherId = active ? (active.client_id === userId ? active.staff_id : active.client_id) : "";
  const roleLabel = (role?: string) => {
    const labelsByRole: Record<string, string> = ar
      ? { owner: "مدير المكتب", admin: "مدير", lawyer: "محامٍ", assistant: "مساعد", user: "مستخدم", client: "مستخدم" }
      : { owner: "Office owner", admin: "Admin", lawyer: "Lawyer", assistant: "Assistant", user: "User", client: "User" };
    return labelsByRole[role || "user"] || labelsByRole.user;
  };
  const displayPerson = (id: string) => people[id]?.trim() || roleLabel(personRoles[id] || "user");
  const otherName = displayPerson(otherId);
  const canSendActive = !!active && active.status === "open" && (active.conversation_type === "staff" ? (currentStaffRole !== "" && (active.client_id === userId || active.staff_id === userId)) : (active.client_id === userId || (active.staff_id === userId && currentStaffRole !== "")));
  const formatTime = (value: string) => new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(value));
  const initials = (name: string) => (name.trim().charAt(0) || "?").toLocaleUpperCase(ar ? "ar-EG" : "en-US");

  return <>
    <button type="button" className="mizan-icon-button mizan-chat-launcher" aria-label={labels.title} onClick={() => { setSelected(""); setOpen(true); if (userId) void loadThreads(userId); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4a7.5 7.5 0 1 1 16-3.5Z"/><path d="M8 11h8M8 14h5"/></svg>
      {unread > 0 && <span className="mizan-chat-launcher-count">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && typeof document !== "undefined" && createPortal(<div className="mizan-chat-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setOpen(false); setExpanded(false); } }}>
      <section className={"mizan-chat-drawer" + (expanded ? " is-expanded" : "") + (selected ? " has-selected-thread" : "")} dir={ar ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={labels.title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mizan-chat-drawer-controls"><button type="button" className="mizan-chat-window-control" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? (ar ? "استعادة حجم النافذة" : "Restore panel size") : (ar ? "ملء الشاشة" : "Expand to full screen")} title={expanded ? (ar ? "استعادة الحجم" : "Restore size") : (ar ? "ملء الشاشة" : "Full screen")}>{expanded ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v5H3M16 3v5h5M3 16h5v5M21 16h-5v5"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>}</button><button type="button" className="mizan-chat-window-control" onClick={() => { setOpen(false); setExpanded(false); }} aria-label={ar ? "إغلاق نافذة المحادثات" : "Close conversations"} title={ar ? "إغلاق" : "Close"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
        <aside className="mizan-chat-sidebar">
          <div className="mizan-chat-sidebar-head"><div><h2>{labels.title}</h2></div><button type="button" className="mizan-chat-close mizan-chat-sidebar-close" aria-label={ar ? "إغلاق" : "Close"} onClick={() => { setOpen(false); setExpanded(false); }}>×</button></div>
          <div className="mizan-chat-sidebar-tools">
            <button type="button" className={"mizan-chat-tool-icon" + (soundOn ? " is-enabled" : "")} aria-label={labels.sound} title={labels.sound} onClick={() => setSoundOn((value) => { const next = !value; if (next) playIncomingTone(); return next; })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/></svg><span className="sr-only">{labels.sound}</span></button>
            <button type="button" className="mizan-chat-tool-icon" aria-label={labels.search} title={labels.search} onClick={() => { setSearchVisible((value) => !value); if (!searchVisible) window.setTimeout(() => document.getElementById("mizan-chat-search")?.focus(), 0); }}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><span className="sr-only">{labels.search}</span></button>
            <button type="button" className="mizan-chat-tool-icon is-primary" aria-label={labels.newConversation} title={labels.newConversation} onClick={() => void openNewConversation()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg><span className="sr-only">{labels.newConversation}</span></button>
          </div>
          {searchVisible && <label className="mizan-chat-search-label"><span className="sr-only">{labels.search}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input id="mizan-chat-search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={labels.search} /></label>}<div className="mizan-chat-thread-list">{filteredThreads.length === 0 ? <p className="mizan-chat-empty">{threads.length === 0 ? labels.empty : (ar ? "لا توجد نتائج مطابقة" : "No matching conversations")}</p> : filteredThreads.map((thread) => {
            const participant = thread.client_id === userId ? thread.staff_id : thread.client_id;
            return <div key={thread.id} className={"mizan-chat-thread-wrap" + (selected === thread.id ? " is-active" : "")}><button type="button" onClick={() => setSelected(thread.id)} className={"mizan-chat-thread" + (selected === thread.id ? " is-active" : "")}>
              <span className="mizan-chat-avatar">{initials(displayPerson(participant))}</span><span className="mizan-chat-thread-copy"><strong>{displayPerson(participant)}</strong><small>{thread.conversation_type === "staff" ? labels.privateConversation + " · " : ""}{thread.subject}</small><time>{formatTime(thread.last_message_at)}</time></span><span className={"mizan-chat-status-dot" + (thread.status === "open" ? " is-open" : "")}/>
            </button><details className="mizan-chat-actions-menu"><summary aria-label={labels.conversationActions} title={labels.conversationActions}>⋯</summary><div><button type="button" disabled={hidingConversationId === thread.id} onClick={() => { void hideConversation(thread); document.activeElement instanceof HTMLElement && document.activeElement.blur(); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg><span>{labels.hideConversation}</span></button></div></details></div>;
          })}</div>
          <a className="mizan-chat-full-link" href={"/" + locale + "/dashboard/conversations"}>{labels.openFull} ↗</a>
        </aside>
        <div className="mizan-chat-main">
          {active ? <>
            <header className="mizan-chat-conversation-head"><span className="mizan-chat-avatar is-large">{initials(otherName)}</span><div className="mizan-chat-conversation-identity"><strong>{otherName}</strong><small>{active.subject}</small></div><details className="mizan-chat-actions-menu is-header"><summary aria-label={labels.conversationActions} title={labels.conversationActions}>⋯</summary><div><button type="button" disabled={hidingConversationId === active.id} onClick={() => { void hideConversation(active); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5"/></svg><span>{labels.hideConversation}</span></button></div></details><button type="button" className="mizan-chat-close mizan-chat-mobile-close" onClick={() => { setSelected(""); setEditingId(""); setEditDraft(""); setError(""); }} aria-label={ar ? "العودة إلى قائمة المحادثات" : "Back to conversation list"} title={ar ? "قائمة المحادثات" : "Conversation list"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7M7 12h14"/></svg></button></header>
            <div className="mizan-chat-messages">{messages.length === 0 ? <p className="mizan-chat-empty">{labels.noMessages}</p> : messages.map((message) => {
              const own = message.sender_id === userId;
              const senderName = own ? (people[userId]?.trim() || labels.you) : otherName;
              return <article key={message.id} className={"mizan-chat-message-row" + (own ? " is-own" : " is-other")}><span className="mizan-chat-avatar is-message-avatar">{initials(senderName)}</span><div className={"mizan-chat-bubble" + (own ? " is-own" : " is-other") + (message.deleted_at ? " is-deleted" : "")}><small className="mizan-chat-sender-name">{senderName}</small>{message.deleted_at ? <p className="mizan-chat-deleted">{labels.deleted}</p> : editingId === message.id ? <div className="mizan-chat-edit-form"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={4000} rows={3} aria-label={labels.edit}/><div><button type="button" disabled={busy || !editDraft.trim()} onClick={() => void saveMessageEdit(message)}>{labels.save}</button><button type="button" disabled={busy} onClick={() => { setEditingId(""); setEditDraft(""); }}>{labels.cancel}</button></div></div> : <>{message.body && <p>{message.body}</p>}{(message.attachments || []).map((attachment) => { const url = attachmentUrls[attachment.path]; const isImage = attachment.mime_type.startsWith("image/"); return <a className={"mizan-chat-attachment" + (isImage ? " is-image" : "")} href={url || "#"} key={attachment.path} target="_blank" rel="noreferrer" onClick={(event) => { if (!url) event.preventDefault(); }}>{isImage && url ? <img src={url} alt={attachment.name} loading="lazy"/> : <span className="mizan-chat-attachment-icon">↗</span>}<span><strong>{attachment.name}</strong><small>{(attachment.size / 1024 / 1024).toFixed(2)} MB</small></span></a>; })}<details className="mizan-chat-message-menu"><summary aria-label={ar ? "خيارات الرسالة" : "Message options"}>⋯</summary><div><button type="button" onClick={() => void copyMessage(message)}>{labels.copy}</button>{own && <button type="button" onClick={() => { setEditingId(message.id); setEditDraft(message.body); }}>{labels.edit}</button>}{own && <button type="button" className="is-danger" onClick={() => void deleteMessage(message)}>{labels.remove}</button>}</div></details></>}{!message.deleted_at && <time dateTime={message.created_at}>{formatTime(message.created_at)}{message.edited_at ? ` · ${labels.edited}` : ""}</time>}</div></article>;
            })}<div ref={bottomRef}/></div>
            <form className="mizan-chat-composer" onSubmit={sendMessage}><input ref={fileInputRef} className="mizan-chat-file-input" type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.ods,.ppt,.pptx" onChange={(event) => { const selectedFiles = Array.from(event.target.files || []); if (selectedFiles.length > 5 || selectedFiles.some((file) => file.size > 10 * 1024 * 1024)) { setError(labels.filesLimit); event.target.value = ""; return; } setPendingFiles(selectedFiles); setError(""); }}/><button type="button" className="mizan-chat-attach-button" disabled={busy || !canSendActive} aria-label={labels.attach} title={labels.attach} onClick={() => fileInputRef.current?.click()}>＋</button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} disabled={!canSendActive} placeholder={!canSendActive ? (active.status !== "open" ? labels.closed : labels.viewOnly) : labels.placeholder}/><button type="submit" disabled={busy || (!draft.trim() && pendingFiles.length === 0) || !canSendActive} aria-label={labels.send}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button>{pendingFiles.length > 0 && <span className="mizan-chat-pending-files">{pendingFiles.length} {ar ? "ملف/ملفات جاهزة" : "file(s) ready"} <button type="button" onClick={() => { setPendingFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}>×</button></span>}</form>
          </> : <div className="mizan-chat-no-selection"><span>✦</span><h3>{labels.choose}</h3><p>{labels.online}</p></div>}
          {error && <p role="alert" className="mizan-chat-error">{error}</p>}
        </div>
        {newModalOpen && <div className="mizan-chat-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewModalOpen(false); }}>
          <section className="mizan-chat-new-modal" role="dialog" aria-modal="true" aria-labelledby="mizan-new-conversation-title" dir={ar ? "rtl" : "ltr"} onMouseDown={(event) => event.stopPropagation()}>
            <div className="mizan-chat-new-modal-head"><span className="mizan-chat-modal-symbol"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4a7.5 7.5 0 1 1 16-3.5Z"/><path d="M12 8v7M8.5 11.5h7"/></svg></span><button type="button" className="mizan-chat-close" onClick={() => setNewModalOpen(false)} aria-label={ar ? "إغلاق" : "Close"}>×</button><h2 id="mizan-new-conversation-title">{labels.newModalTitle}</h2><p>{currentStaffRole ? labels.privateHint : (ar ? "اختر موضوعًا وعضوًا من فريق المكتب لبدء تواصل آمن." : "Choose a topic and an office team member to start a secure conversation.")}</p></div>
            <form onSubmit={createConversation} className="mizan-chat-new-modal-form">
              <label>{labels.topic}<input autoFocus required minLength={3} maxLength={160} value={newSubject} onChange={(event) => setNewSubject(event.target.value)} placeholder={labels.subjectPlaceholder}/></label>
              <label>{labels.interlocutor}<select required value={newRecipient} onChange={(event) => setNewRecipient(event.target.value)} disabled={contactsLoading || contacts.length === 0}><option value="">{contactsLoading ? (ar ? "جارٍ تحميل فريق المكتب..." : "Loading office team...") : labels.interlocutor}</option>{contacts.map((contact) => <option key={contact.profile_id} value={contact.profile_id}>{contact.full_name || (ar ? "عضو فريق المكتب" : "Office team member")} · {contact.role === "owner" ? (ar ? "رئيس المكتب" : "Office owner") : contact.role === "admin" ? (ar ? "مدير" : "Manager") : contact.role === "lawyer" ? (ar ? "محامٍ" : "Lawyer") : (ar ? "مساعد" : "Assistant")}</option>)}</select></label>
              {contacts.length === 0 && !contactsLoading && <p className="mizan-chat-modal-hint">{labels.noContacts}</p>}
              <div className="mizan-chat-new-modal-actions"><button type="button" className="mizan-chat-modal-cancel" onClick={() => setNewModalOpen(false)}>{labels.cancel}</button><button type="submit" disabled={busy || contactsLoading || !contacts.length || newSubject.trim().length < 3 || !newRecipient}>{busy ? (ar ? "جارٍ الإنشاء..." : "Creating...") : labels.start}</button></div>
            </form>
          </section>
        </div>}
      </section>
    </div>, document.body)}
  </>;
}
