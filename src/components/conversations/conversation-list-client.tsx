"use client";

import Link from "next/link";
import { useState } from "react";

type Locale = "ar" | "en";
type Conversation = {
  id: string;
  subject: string;
  status: string;
  conversation_type: string;
  last_message_at: string;
};
type Copy = {
  title: string;
  empty: string;
  open: string;
  closed: string;
  last: string;
  view: string;
  staffPrivateTitle: string;
  office: string;
  client: string;
  deleteMode: string;
  cancelSelection: string;
  deleteSelected: string;
  selectedCount: string;
  confirmTitle: string;
  confirmBody: string;
  confirmAction: string;
  cancel: string;
};

export function ConversationListClient({
  locale,
  conversations,
  isClient,
  copy,
  hideAction,
}: {
  locale: Locale;
  conversations: Conversation[];
  isClient: boolean;
  copy: Copy;
  hideAction: (formData: FormData) => void | Promise<void>;
}) {
  const ar = locale === "ar";
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dateLocale = ar ? "ar-EG" : "en-GB";

  function toggleSelected(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function leaveSelectionMode() {
    setSelectionMode(false);
    setSelected([]);
  }

  return <section className="mt-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-black text-[#14263d]">{copy.title}</h2>
      {!!conversations.length && <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => selectionMode ? leaveSelectionMode() : setSelectionMode(true)}
          aria-label={selectionMode ? copy.cancelSelection : copy.deleteMode}
          title={selectionMode ? copy.cancelSelection : copy.deleteMode}
          aria-pressed={selectionMode}
          className={"flex h-10 w-10 items-center justify-center rounded-xl border transition " + (selectionMode ? "border-[#176b67] bg-[#176b67] text-white" : "border-[#14263d]/10 bg-white text-[#657184] hover:border-red-200 hover:bg-red-50 hover:text-red-700")}
        >
          {selectionMode ? <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg> : <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>}
        </button>
        {selectionMode && selected.length > 0 && <button type="button" onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>
          {copy.deleteSelected} ({selected.length})
        </button>}
      </div>}
    </div>
    {selectionMode && <div className="mt-3 rounded-xl border border-[#176b67]/15 bg-[#176b67]/[.05] px-4 py-3 text-sm text-[#176b67]">
      {selected.length ? copy.selectedCount.replace("{count}", String(selected.length)) : (ar ? "حدد محادثة أو أكثر من المربعات بجانبها." : "Select one or more conversations using the checkboxes.")}
    </div>}
    {!conversations.length ? <div className="mt-4 rounded-2xl border border-dashed border-[#14263d]/20 bg-white/70 p-8 text-center text-sm text-[#657184]">{copy.empty}</div> :
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {conversations.map((conversation) => {
          const checked = selected.includes(conversation.id);
          return <article key={conversation.id} className={"rounded-2xl border bg-white p-5 transition " + (checked ? "border-[#176b67] ring-2 ring-[#176b67]/10" : "border-[#14263d]/10 hover:border-[#176b67]/40")}>
            <div className="flex items-start gap-3">
              {selectionMode && <input type="checkbox" checked={checked} onChange={() => toggleSelected(conversation.id)} aria-label={(ar ? "اختيار محادثة: " : "Select conversation: ") + conversation.subject} className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#176b67]"/>}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3"><h3 className="font-extrabold text-[#14263d]">{conversation.subject}</h3><span className={"shrink-0 rounded-full px-3 py-1 text-xs font-bold " + (conversation.status === "open" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600")}>{conversation.status === "open" ? copy.open : copy.closed}</span></div>
                <p className="mt-2 text-sm text-[#657184]">{conversation.conversation_type === "staff" ? copy.staffPrivateTitle : (isClient ? copy.office : copy.client)}</p>
                <p className="mt-4 text-xs text-[#657184]">{copy.last}: {new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(conversation.last_message_at))}</p>
                <div className="mt-4 border-t border-[#14263d]/10 pt-3">
                  <Link href={"/" + locale + "/dashboard/conversations/" + conversation.id} className="inline-flex items-center rounded-lg bg-[#176b67]/[.07] px-3 py-2 text-sm font-bold text-[#176b67] transition hover:bg-[#176b67]/[.13]">{copy.view} →</Link>
                </div>
              </div>
            </div>
          </article>;
        })}
      </div>}
    {confirmOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101c2b]/55 px-4 py-6 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="mizan-delete-conversations-title" className="w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>
        </div>
        <h3 id="mizan-delete-conversations-title" className="mt-5 text-center text-xl font-black text-[#14263d]">{copy.confirmTitle}</h3>
        <p className="mt-3 text-center text-sm leading-7 text-[#657184]">{copy.confirmBody.replace("{count}", String(selected.length))}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" onClick={() => setConfirmOpen(false)} className="flex-1 rounded-xl border border-[#14263d]/15 px-4 py-3 text-sm font-bold text-[#14263d] transition hover:bg-slate-50">{copy.cancel}</button>
          <form action={hideAction} className="flex-1">
            <input type="hidden" name="locale" value={locale}/>
            {selected.map((id) => <input key={id} type="hidden" name="conversationId" value={id}/>)}
            <button type="submit" className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700">{copy.confirmAction}</button>
          </form>
        </div>
      </section>
    </div>}
  </section>;
}
