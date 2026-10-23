"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";
type Thread = { id: string; client_id: string; staff_id: string; subject: string; status: string; last_message_at: string };
type Attachment = { path: string; name: string; mime_type: string; size: number };
type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; attachments: Attachment[]; edited_at: string | null; deleted_at: string | null };
type Person = { id: string; full_name: string | null };

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
  const [threads, setThreads] = useState<Thread[]>([]);
  const [people, setPeople] = useState<Record<string, string>>({});
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  const seen = useRef(new Set<string>());
  const bottomRef = useRef<HTMLDivElement>(null);
  const labels = useMemo(() => ar ? {
    title: "المحادثات", subtitle: "تواصل مباشر وآمن مع فريق المكتب", search: "ابحث في المحادثات",
    empty: "لا توجد محادثات حتى الآن", choose: "اختر محادثة لعرض الرسائل",
    placeholder: "اكتب رسالتك...", send: "إرسال", loading: "جارٍ تحميل المحادثات...",
    online: "مراسلة آمنة", sound: "صوت الإشعار", openFull: "فتح صفحة المحادثات",
    closed: "مغلقة", noMessages: "ابدأ المحادثة برسالتك الأولى", failed: "تعذر تحميل البيانات أو إرسال الرسالة.",
    you: "أنت", today: "اليوم", copy: "نسخ", edit: "تعديل", remove: "حذف", save: "حفظ", cancel: "إلغاء", edited: "تم التعديل", deleted: "تم حذف هذه الرسالة", attach: "إرفاق ملفات أو صور", filesLimit: "يمكن إرفاق 5 ملفات كحد أقصى، بحد 10 ميجابايت لكل ملف.", uploadFailed: "تعذر رفع الملف. حاول مرة أخرى.", editFailed: "تعذر تعديل الرسالة.", deleteFailed: "تعذر حذف الرسالة.", copied: "تم نسخ الرسالة", removeConfirm: "هل تريد حذف هذه الرسالة؟",
  } : {
    title: "Messages", subtitle: "A private, direct line to your legal team", search: "Search conversations",
    empty: "No conversations yet", choose: "Choose a conversation to view messages",
    placeholder: "Write a message...", send: "Send", loading: "Loading conversations...",
    online: "Secure messaging", sound: "Notification sound", openFull: "Open conversations page",
    closed: "Closed", noMessages: "Start the conversation with your first message", failed: "Could not load data or send the message.",
    you: "You", today: "Today", copy: "Copy", edit: "Edit", remove: "Delete", save: "Save", cancel: "Cancel", edited: "Edited", deleted: "This message was deleted", attach: "Attach files or images", filesLimit: "Up to 5 files, 10 MB per file.", uploadFailed: "Could not upload the file. Please try again.", editFailed: "Could not edit this message.", deleteFailed: "Could not delete this message.", copied: "Message copied", removeConfirm: "Delete this message?",
  }, [ar]);

  const loadThreads = useCallback(async (uid: string, playSound = false) => {
    const supabase = createClient();
    const { data, error: queryError } = await supabase.from("conversations")
      .select("id,client_id,staff_id,subject,status,last_message_at")
      .order("last_message_at", { ascending: false }).limit(60);
    if (queryError) { setError(labels.failed); return; }
    const rows = (data || []) as Thread[];
    setThreads(rows);
    const ids = Array.from(new Set(rows.flatMap((thread) => [thread.client_id, thread.staff_id])));
    if (ids.length) {
      const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      setPeople(Object.fromEntries(((profiles || []) as Person[]).map((person) => [person.id, person.full_name || (ar ? "مستخدم" : "User")])));
    }
    const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("kind", "new_message").is("read_at", null);
    setUnread(count || 0);
    if (!selected && rows[0]) setSelected(rows[0].id);
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
    void createClient().from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", uid).eq("conversation_id", threadId).is("read_at", null).eq("kind", "new_message");
    void loadThreads(uid);
  }, [labels.failed, loadThreads, soundOn]);

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
          if (selected !== message.conversation_id && soundOn) playIncomingTone();
          if (selected === message.conversation_id) void loadMessages(message.conversation_id, userId);
          else void loadThreads(userId);
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        const notice = payload.new as { user_id?: string; kind?: string };
        if (notice.user_id === userId) {
          setUnread((count) => count + 1);
          void loadThreads(userId);
        }
      }).subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [pathname, loadThreads, loadMessages, selected, soundOn, userId]);

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
    } catch {
      if (uploaded.length) void supabase.storage.from("conversation-attachments").remove(uploaded.map((file) => file.path));
      setError(pendingFiles.length ? labels.uploadFailed : labels.failed);
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
  const otherName = people[otherId] || (ar ? "المحامي / العميل" : "Lawyer / Client");
  const formatTime = (value: string) => new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(value));
  const initials = (name: string) => (name.trim().charAt(0) || "?").toLocaleUpperCase(ar ? "ar-EG" : "en-US");

  return <>
    <button type="button" className="mizan-chat-launcher" aria-label={labels.title} onClick={() => { setOpen(true); if (userId) void loadThreads(userId); }}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4a7.5 7.5 0 1 1 16-3.5Z"/><path d="M8 11h8M8 14h5"/></svg>
      {unread > 0 && <span className="mizan-chat-launcher-count">{unread > 99 ? "99+" : unread}</span>}
    </button>
    {open && <div className="mizan-chat-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setOpen(false); setExpanded(false); } }}>
      <section className={"mizan-chat-drawer" + (expanded ? " is-expanded" : "")} dir={ar ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-label={labels.title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="mizan-chat-drawer-controls"><button type="button" className="mizan-chat-window-control" onClick={() => setExpanded((value) => !value)} aria-label={expanded ? (ar ? "استعادة حجم النافذة" : "Restore panel size") : (ar ? "ملء الشاشة" : "Expand to full screen")} title={expanded ? (ar ? "استعادة الحجم" : "Restore size") : (ar ? "ملء الشاشة" : "Full screen")}>{expanded ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v5H3M16 3v5h5M3 16h5v5M21 16h-5v5"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg>}</button><button type="button" className="mizan-chat-window-control" onClick={() => { setOpen(false); setExpanded(false); }} aria-label={ar ? "إغلاق نافذة المحادثات" : "Close conversations"} title={ar ? "إغلاق" : "Close"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
        <aside className="mizan-chat-sidebar">
          <div className="mizan-chat-sidebar-head"><div><span className="mizan-chat-eyebrow">MIZAN · PRIVATE</span><h2>{labels.title}</h2><p>{labels.subtitle}</p></div><button type="button" className="mizan-chat-close" aria-label={ar ? "إغلاق" : "Close"} onClick={() => { setOpen(false); setExpanded(false); }}>×</button></div>
          <label className="mizan-chat-sound"><input type="checkbox" checked={soundOn} onChange={(event) => setSoundOn(event.target.checked)}/>{labels.sound}</label>
          <label className="mizan-chat-search-label"><span className="sr-only">{labels.search}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={labels.search} /></label>
          <div className="mizan-chat-thread-list">{filteredThreads.length === 0 ? <p className="mizan-chat-empty">{threads.length === 0 ? labels.empty : (ar ? "لا توجد نتائج مطابقة" : "No matching conversations")}</p> : filteredThreads.map((thread) => {
            const participant = thread.client_id === userId ? thread.staff_id : thread.client_id;
            return <button type="button" key={thread.id} onClick={() => setSelected(thread.id)} className={"mizan-chat-thread" + (selected === thread.id ? " is-active" : "")}>
              <span className="mizan-chat-avatar">{initials(people[participant] || (ar ? "م" : "M"))}</span><span className="mizan-chat-thread-copy"><strong>{people[participant] || (ar ? "مستخدم" : "User")}</strong><small>{thread.subject}</small><time>{formatTime(thread.last_message_at)}</time></span><span className={"mizan-chat-status-dot" + (thread.status === "open" ? " is-open" : "")}/>
            </button>;
          })}</div>
          <a className="mizan-chat-full-link" href={"/" + locale + "/dashboard/conversations"}>{labels.openFull} ↗</a>
        </aside>
        <div className="mizan-chat-main">
          {active ? <>
            <header className="mizan-chat-conversation-head"><span className="mizan-chat-avatar is-large">{initials(otherName)}</span><div className="mizan-chat-conversation-identity"><strong>{otherName}</strong><p><span className={"mizan-chat-status-dot" + (active.status === "open" ? " is-open" : "")}/>{active.status === "open" ? labels.online : labels.closed}</p><small>{active.subject}</small></div><button type="button" className="mizan-chat-close mizan-chat-mobile-close" onClick={() => { setOpen(false); setExpanded(false); }} aria-label={ar ? "إغلاق المحادثات" : "Close messages"}>×</button></header>
            <div className="mizan-chat-messages">{messages.length === 0 ? <p className="mizan-chat-empty">{labels.noMessages}</p> : messages.map((message) => {
              const own = message.sender_id === userId;
              const senderName = own ? (people[userId] || labels.you) : otherName;
              return <article key={message.id} className={"mizan-chat-message-row" + (own ? " is-own" : " is-other")}><span className="mizan-chat-avatar is-message-avatar">{initials(senderName)}</span><div className={"mizan-chat-bubble" + (own ? " is-own" : " is-other") + (message.deleted_at ? " is-deleted" : "")}>{message.deleted_at ? <p className="mizan-chat-deleted">{labels.deleted}</p> : editingId === message.id ? <div className="mizan-chat-edit-form"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={4000} rows={3} aria-label={labels.edit}/><div><button type="button" disabled={busy || !editDraft.trim()} onClick={() => void saveMessageEdit(message)}>{labels.save}</button><button type="button" disabled={busy} onClick={() => { setEditingId(""); setEditDraft(""); }}>{labels.cancel}</button></div></div> : <>{message.body && <p>{message.body}</p>}{(message.attachments || []).map((attachment) => { const url = attachmentUrls[attachment.path]; const isImage = attachment.mime_type.startsWith("image/"); return <a className={"mizan-chat-attachment" + (isImage ? " is-image" : "")} href={url || "#"} key={attachment.path} target="_blank" rel="noreferrer" onClick={(event) => { if (!url) event.preventDefault(); }}>{isImage && url ? <img src={url} alt={attachment.name} loading="lazy"/> : <span className="mizan-chat-attachment-icon">↗</span>}<span><strong>{attachment.name}</strong><small>{(attachment.size / 1024 / 1024).toFixed(2)} MB</small></span></a>; })}{own && <details className="mizan-chat-message-menu"><summary aria-label={ar ? "خيارات الرسالة" : "Message options"}>⋯</summary><div><button type="button" onClick={() => void copyMessage(message)}>{labels.copy}</button><button type="button" onClick={() => { setEditingId(message.id); setEditDraft(message.body); }}>{labels.edit}</button><button type="button" className="is-danger" onClick={() => void deleteMessage(message)}>{labels.remove}</button></div></details>}</>}{!message.deleted_at && <time dateTime={message.created_at}>{formatTime(message.created_at)}{message.edited_at ? ` · ${labels.edited}` : ""}</time>}</div></article>;
            })}<div ref={bottomRef}/></div>
            <form className="mizan-chat-composer" onSubmit={sendMessage}><input ref={fileInputRef} className="mizan-chat-file-input" type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.ods,.ppt,.pptx" onChange={(event) => { const selectedFiles = Array.from(event.target.files || []); if (selectedFiles.length > 5 || selectedFiles.some((file) => file.size > 10 * 1024 * 1024)) { setError(labels.filesLimit); event.target.value = ""; return; } setPendingFiles(selectedFiles); setError(""); }}/><button type="button" className="mizan-chat-attach-button" disabled={busy || active.status !== "open"} aria-label={labels.attach} title={labels.attach} onClick={() => fileInputRef.current?.click()}>＋</button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={2} disabled={active.status !== "open"} placeholder={active.status === "open" ? labels.placeholder : labels.closed}/><button type="submit" disabled={busy || (!draft.trim() && pendingFiles.length === 0) || active.status !== "open"} aria-label={labels.send}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg></button>{pendingFiles.length > 0 && <span className="mizan-chat-pending-files">{pendingFiles.length} {ar ? "ملف/ملفات جاهزة" : "file(s) ready"} <button type="button" onClick={() => { setPendingFiles([]); if (fileInputRef.current) fileInputRef.current.value = ""; }}>×</button></span>}</form>
          </> : <div className="mizan-chat-no-selection"><span>✦</span><h3>{labels.choose}</h3><p>{labels.online}</p></div>}
          {error && <p role="alert" className="mizan-chat-error">{error}</p>}
        </div>
      </section>
    </div>}
  </>;
}
