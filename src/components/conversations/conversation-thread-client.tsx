"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";

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
type Attachment = { path: string; name: string; mime_type: string; size: number };
type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachments: Attachment[];
  edited_at: string | null;
  deleted_at: string | null;
};

export function ConversationThreadClient({
  locale,
  conversationId,
  userId,
  initialMessages,
  canSend,
}: {
  locale: Locale;
  conversationId: string;
  userId: string;
  initialMessages: Message[];
  canSend: boolean;
}) {
  const ar = locale === "ar";
  const [messages, setMessages] = useState<Message[]>(initialMessages.map((m) => ({ ...m, attachments: m.attachments || [] })));
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const t = ar ? {
    copy: "نسخ", edit: "تعديل", remove: "حذف", save: "حفظ", cancel: "إلغاء",
    edited: "تم التعديل", deleted: "تم حذف هذه الرسالة", attach: "إرفاق ملفات أو صور",
    placeholder: "اكتب رسالتك هنا...", send: "إرسال الرسالة", filesLimit: "الحد الأقصى 5 ملفات، 10 ميجابايت لكل ملف.",
    uploadFailed: "تعذر رفع المرفق أو إرسال الرسالة.", editFailed: "تعذر تعديل الرسالة.",
    deleteFailed: "تعذر حذف الرسالة.", confirm: "هل تريد حذف هذه الرسالة؟",
    noMessages: "لا توجد رسائل بعد. اكتب رسالتك الأولى أدناه.", error: "حدث خطأ. حاول مرة أخرى.",
    filesReady: "ملفات جاهزة", openFile: "فتح الملف"
  } : {
    copy: "Copy", edit: "Edit", remove: "Delete", save: "Save", cancel: "Cancel",
    edited: "Edited", deleted: "This message was deleted", attach: "Attach files or images",
    placeholder: "Write your message here...", send: "Send message", filesLimit: "Up to 5 files, 10 MB each.",
    uploadFailed: "Could not upload the attachment or send the message.", editFailed: "Could not edit the message.",
    deleteFailed: "Could not delete the message.", confirm: "Delete this message?",
    noMessages: "No messages yet. Write your first message below.", error: "Something went wrong. Please try again.",
    filesReady: "file(s) ready", openFile: "Open file"
  };

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("mizan-full-thread-" + conversationId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "conversation_messages", filter: "conversation_id=eq." + conversationId }, (payload) => {
        const incoming = payload.new as Message;
        setMessages((current) => current.some((message) => message.id === incoming.id) ? current : [...current, { ...incoming, attachments: incoming.attachments || [] }]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_messages", filter: "conversation_id=eq." + conversationId }, (payload) => {
        const updated = payload.new as Message;
        setMessages((current) => current.map((message) => message.id === updated.id ? { ...updated, attachments: updated.attachments || [] } : message));
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    const closeMessageMenus = (event: MouseEvent) => {
      const target = event.target as Node;
      document.querySelectorAll<HTMLDetailsElement>(".mizan-thread-menu[open]").forEach((menu) => {
        if (!menu.contains(target) || !(target instanceof Element && target.closest("summary"))) menu.removeAttribute("open");
      });
    };
    document.addEventListener("click", closeMessageMenus);
    return () => document.removeEventListener("click", closeMessageMenus);
  }, []);

  useEffect(() => {
    let active = true;
    const paths = Array.from(new Set(messages.flatMap((message) => message.attachments).map((item) => item.path))).filter((path) => !urls[path]);
    if (!paths.length) return;
    const supabase = createClient();
    void Promise.all(paths.map(async (path) => {
      const { data } = await supabase.storage.from("conversation-attachments").createSignedUrl(path, 3600);
      return data?.signedUrl ? [path, data.signedUrl] as const : null;
    })).then((results) => {
      if (active) setUrls((current) => ({ ...current, ...Object.fromEntries(results.filter((item): item is readonly [string, string] => !!item)) }));
    });
    return () => { active = false; };
  }, [messages, urls]);

  function formatTime(value: string) {
    return new Intl.DateTimeFormat(ar ? "ar-EG" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo",
    }).format(new Date(value));
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if ((!body && !files.length) || busy) return;
    if (files.length > 5 || files.some((file) => file.size > 10 * 1024 * 1024)) {
      setError(t.filesLimit);
      return;
    }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const uploaded: Attachment[] = [];
    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "attachment";
        const path = `${conversationId}/${userId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("conversation-attachments").upload(path, file, {
          contentType: file.type || "application/octet-stream", upsert: false,
        });
        if (uploadError) throw uploadError;
        uploaded.push({ path, name: file.name, mime_type: file.type || "application/octet-stream", size: file.size });
      }
      const { data, error: insertError } = await supabase.from("conversation_messages")
        .insert({ conversation_id: conversationId, sender_id: userId, body, attachments: uploaded })
        .select("id,conversation_id,sender_id,body,created_at,attachments,edited_at,deleted_at").single();
      if (insertError || !data) throw insertError || new Error("Message insert failed");
      setMessages((current) => [...current, { ...(data as Message), attachments: (data as Message).attachments || [] }]);
      setDraft("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (caught) {
      if (uploaded.length) void supabase.storage.from("conversation-attachments").remove(uploaded.map((item) => item.path));
      const detail = describeError(caught);
      setError(t.uploadFailed + (detail ? " " + detail : ""));
    } finally {
      setBusy(false);
    }
  }

  async function copyMessage(message: Message) {
    try { await navigator.clipboard.writeText(message.body); } catch { setError(t.error); }
  }

  async function saveEdit(message: Message) {
    const body = editDraft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError("");
    const editedAt = new Date().toISOString();
    const { data, error: updateError } = await createClient().from("conversation_messages")
      .update({ body, edited_at: editedAt }).eq("id", message.id).eq("sender_id", userId)
      .is("deleted_at", null).select("id").maybeSingle();
    if (updateError || !data) setError(t.editFailed);
    else {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body, edited_at: editedAt } : item));
      setEditingId("");
      setEditDraft("");
    }
    setBusy(false);
  }

  async function deleteMessage(message: Message) {
    if (busy || !window.confirm(t.confirm)) return;
    setBusy(true);
    setError("");
    const deletedAt = new Date().toISOString();
    const { data, error: updateError } = await createClient().from("conversation_messages")
      .update({ body: "", attachments: [], deleted_at: deletedAt }).eq("id", message.id)
      .eq("sender_id", userId).is("deleted_at", null).select("id").maybeSingle();
    if (updateError || !data) setError(t.deleteFailed);
    else {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: "", attachments: [], deleted_at: deletedAt } : item));
      if (message.attachments.length) void createClient().storage.from("conversation-attachments").remove(message.attachments.map((item) => item.path));
      setEditingId("");
    }
    setBusy(false);
  }

  return <div className="mizan-thread-client">
    <div className="mizan-thread-messages">
      {!messages.length ? <p className="mizan-thread-empty">{t.noMessages}</p> : messages.map((message) => {
        const own = message.sender_id === userId;
        return <article key={message.id} className={"mizan-thread-row " + (own ? "is-own" : "is-other")}>
          <div className={"mizan-thread-bubble " + (own ? "is-own" : "is-other") + (message.deleted_at ? " is-deleted" : "")}>
            {message.deleted_at ? <p className="mizan-thread-deleted">{t.deleted}</p> : editingId === message.id ? <div className="mizan-thread-edit">
              <textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={4000} rows={3} aria-label={t.edit}/>
              <div><button type="button" disabled={busy || !editDraft.trim()} onClick={() => void saveEdit(message)}>{t.save}</button><button type="button" disabled={busy} onClick={() => { setEditingId(""); setEditDraft(""); }}>{t.cancel}</button></div>
            </div> : <>
              {message.body && <p className="mizan-thread-body">{message.body}</p>}
              {message.attachments.map((attachment) => {
                const url = urls[attachment.path];
                const image = attachment.mime_type.startsWith("image/");
                return <a className={"mizan-thread-attachment" + (image ? " is-image" : "")} key={attachment.path} href={url || "#"} target="_blank" rel="noreferrer" onClick={(event) => { if (!url) event.preventDefault(); }}>
                  {image && url ? <img src={url} alt={attachment.name} loading="lazy"/> : <span className="mizan-thread-file-icon">↗</span>}
                  <span><strong>{attachment.name}</strong><small>{(attachment.size / 1024 / 1024).toFixed(2)} MB</small></span>
                </a>;
              })}
              {own && <details className="mizan-thread-menu"><summary aria-label={ar ? "خيارات الرسالة" : "Message options"}>⋯</summary><div>
                <button type="button" onClick={() => void copyMessage(message)}>{t.copy}</button>
                <button type="button" onClick={() => { setEditingId(message.id); setEditDraft(message.body); }}>{t.edit}</button>
                <button type="button" className="is-danger" onClick={() => void deleteMessage(message)}>{t.remove}</button>
              </div></details>}
            </>}
            {!message.deleted_at && <time>{formatTime(message.created_at)}{message.edited_at ? " · " + t.edited : ""}</time>}
          </div>
        </article>;
      })}
    </div>
    {canSend && <form className="mizan-thread-composer" onSubmit={sendMessage}>
      <input ref={fileRef} type="file" multiple className="mizan-thread-file-input" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.ods,.ppt,.pptx" onChange={(event) => {
        const selected = Array.from(event.target.files || []);
        if (selected.length > 5 || selected.some((file) => file.size > 10 * 1024 * 1024)) { setError(t.filesLimit); event.target.value = ""; return; }
        setFiles(selected); setError("");
      }}/>
      <button type="button" className="mizan-thread-attach-button" aria-label={t.attach} title={t.attach} disabled={busy} onClick={() => fileRef.current?.click()}>＋</button>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4000} rows={3} placeholder={t.placeholder}/>
      <button type="submit" disabled={busy || (!draft.trim() && !files.length)}>{t.send}</button>
      {files.length > 0 && <span className="mizan-thread-pending">{files.length} {t.filesReady}<button type="button" onClick={() => { setFiles([]); if (fileRef.current) fileRef.current.value = ""; }}>×</button></span>}
    </form>}
    {error && <p role="alert" className="mizan-thread-error">{error}</p>}
  </div>;
}
