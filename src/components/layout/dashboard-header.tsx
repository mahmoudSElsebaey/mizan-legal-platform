"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConversationLauncher } from "@/components/layout/conversation-launcher";

type Locale = "ar" | "en";
type Notice = { id: string; kind: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null };

export function DashboardHeader({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const pathname = usePathname() || `/${locale}/dashboard`;
  const router = useRouter();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [noticeFilter, setNoticeFilter] = useState<"all" | "unread">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unread = notices.filter((notice) => !notice.read_at).length;
  const visibleNotices = noticeFilter === "unread" ? notices.filter((notice) => !notice.read_at) : notices;
  const switchPath = (next: Locale) => pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${next}`);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    async function loadNotifications() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!alive) return;
        setUserId(user?.id ?? null);
        if (!user) { setNotices([]); return; }
        const { data, error } = await supabase
          .from("notifications")
          .select("id,kind,title,body,href,created_at,read_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (alive) setNotices((data || []) as Notice[]);
      } catch {
        if (alive) setNotices([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    void loadNotifications();
    return () => { alive = false; };
  }, [pathname]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-notifications-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("id,kind,title,body,href,created_at,read_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (!error) setNotices((data || []) as Notice[]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!languageRef.current?.contains(target)) setLanguageOpen(false);
      if (!notificationRef.current?.contains(target)) setNotificationsOpen(false);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setLanguageOpen(false); setNotificationsOpen(false); } };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, []);

  async function markAllRead() {
    if (!userId || unread === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    const readAt = new Date().toISOString();
    const previousNotices = notices;
    setNotices((current) => current.map((notice) => notice.read_at ? notice : { ...notice, read_at: readAt }));
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .is("read_at", null);
      if (error) throw error;
      const { data, error: reloadError } = await supabase
        .from("notifications")
        .select("id,kind,title,body,href,created_at,read_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (reloadError) throw reloadError;
      setNotices((data || []) as Notice[]);
    } catch {
      setNotices(previousNotices);
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function deleteOneNotification(notice: Notice) {
    if (!userId || deletingNotificationId || !window.confirm(ar ? "هل تريد حذف هذا الإشعار؟" : "Delete this notification?")) return;
    setDeletingNotificationId(notice.id);
    const previous = notices;
    setNotices((current) => current.filter((item) => item.id !== notice.id));
    const { error } = await createClient().from("notifications").delete().eq("id", notice.id).eq("user_id", userId);
    if (error) setNotices(previous);
    setDeletingNotificationId(null);
  }

  async function clearAllNotifications() {
    if (!userId || clearingNotifications || notices.length === 0 || !window.confirm(ar ? "هل تريد مسح كل إشعارات حسابك؟" : "Clear all notifications in your account?")) return;
    setClearingNotifications(true);
    const previous = notices;
    setNotices([]);
    const { error } = await createClient().from("notifications").delete().eq("user_id", userId);
    if (error) setNotices(previous);
    setClearingNotifications(false);
  }

  function noticeHref(notice: Notice) {
    const fallback = `/${locale}/dashboard/conversations`;
    if (!notice.href || !notice.href.startsWith("/") || notice.href.startsWith("//")) return fallback;
    return notice.href.startsWith("/ar/") || notice.href.startsWith("/en/") ? notice.href.replace(/^\/(ar|en)(?=\/|$)/, `/${locale}`) : fallback;
  }

  return (
    <header className="mizan-site-header mizan-dashboard-header" dir={ar ? "rtl" : "ltr"}>
      <div className="mizan-site-header-inner mizan-dashboard-header-inner mizan-dashboard-header-compact">
        <Link href={`/${locale}`} className="mizan-site-brand" aria-label={ar ? "ميزان - الصفحة الرئيسية" : "MIZAN homepage"}>
          <span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M32 8v40M19 16h26M12 20l-7 16h14L12 20Zm40 0-7 16h14L52 20ZM5 36c1.2 5 13.8 5 14 0m26 0c1.2 5 13.8 5 14 0M20 48h24M24 53h16M28 58h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 5l3 3-3 3-3-3 3-3Z" fill="currentColor"/><circle cx="32" cy="48" r="2" fill="currentColor"/></svg></span><span className="mizan-site-brand-copy"><strong className={ar ? "mizan-arabic-wordmark" : ""}>{ar ? "مِــيــزَان" : "MIZAN"}</strong><small>{ar ? "مكتب محاماة واستشارات قانونية" : "LAW FIRM & LEGAL CONSULTANCY"}</small></span>
        </Link>
        <div className="mizan-site-actions mizan-dashboard-header-actions">
          <ConversationLauncher locale={locale} />
          <div className="mizan-popover-anchor mizan-dashboard-language-anchor" ref={languageRef}>
            <button type="button" className="mizan-language mizan-dashboard-language" aria-label={ar ? "تغيير اللغة" : "Change language"} aria-expanded={languageOpen} onClick={() => { setLanguageOpen((value) => !value); setNotificationsOpen(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span>{ar ? "AR" : "EN"}</span><span aria-hidden="true">⌄</span>
            </button>
            <div className={languageOpen ? "mizan-dropdown mizan-language-menu is-open" : "mizan-dropdown mizan-language-menu"} aria-hidden={!languageOpen}>
              <Link href={switchPath("ar")} onClick={() => setLanguageOpen(false)} className={ar ? "is-selected" : ""}><span>ع</span><span>العربية<small>Arabic</small></span>{ar && <b>✓</b>}</Link>
              <Link href={switchPath("en")} onClick={() => setLanguageOpen(false)} className={!ar ? "is-selected" : ""}><span>A</span><span>English<small>English</small></span>{!ar && <b>✓</b>}</Link>
            </div>
          </div>
          <div className="mizan-popover-anchor mizan-notification-anchor mizan-dashboard-notifications-anchor" ref={notificationRef}>
            <button type="button" className="mizan-icon-button mizan-dashboard-notification-button" aria-label={ar ? `الإشعارات، ${unread} غير مقروء` : `Notifications, ${unread} unread`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setLanguageOpen(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
              {unread > 0 && <span className="mizan-dashboard-notification-count">{unread > 99 ? "99+" : unread}</span>}
            </button>
            <div className={notificationsOpen ? "mizan-dropdown mizan-notification-menu is-open mizan-dashboard-notification-menu" : "mizan-dropdown mizan-notification-menu mizan-dashboard-notification-menu"} aria-hidden={!notificationsOpen}>
              <div className="mizan-notice-panel-head">
                <div className="mizan-notice-heading-copy">
                  <span className="mizan-notice-eyebrow">{ar ? "مركز التنبيهات" : "YOUR UPDATES"}</span>
                  <strong>{ar ? "الإشعارات" : "Notifications"}</strong>
                  <span>{unread ? (ar ? `لديك ${unread} إشعارات غير مقروءة` : `You have ${unread} unread ${unread === 1 ? "notification" : "notifications"}`) : (ar ? "أنت على اطلاع بكل جديد" : "You’re all caught up")}</span>
                </div>
                <span className="mizan-notice-header-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{unread > 0 && <i />}</span>
              </div>
              <div className="mizan-notice-toolbar">
                <div className="mizan-notice-filters" role="group" aria-label={ar ? "تصفية الإشعارات" : "Filter notifications"}>
                  <button type="button" className={noticeFilter === "all" ? "is-active" : ""} aria-pressed={noticeFilter === "all"} onClick={() => setNoticeFilter("all")}>{ar ? "الكل" : "All"} <span>{notices.length}</span></button>
                  <button type="button" className={noticeFilter === "unread" ? "is-active" : ""} aria-pressed={noticeFilter === "unread"} onClick={() => setNoticeFilter("unread")}>{ar ? "غير مقروء" : "Unread"} {unread > 0 && <span>{unread}</span>}</button>
                </div>
                {unread > 0 && <button className="mizan-notice-mark-all" type="button" disabled={markingAllRead} aria-busy={markingAllRead} onClick={() => void markAllRead()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>{markingAllRead ? (ar ? "جارٍ التحديث" : "Updating") : (ar ? "قراءة الكل" : "Mark all read")}</button>}{notices.length > 0 && <button className="mizan-notice-delete-all" type="button" disabled={clearingNotifications} onClick={() => void clearAllNotifications()}>{clearingNotifications ? (ar ? "جارٍ المسح..." : "Clearing...") : (ar ? "مسح الكل" : "Clear all")}</button>}
              </div>
              <div className="mizan-dashboard-notice-list mizan-notice-feed">
                {loading ? <div className="mizan-notice-state"><span className="mizan-notice-spinner" /><strong>{ar ? "جارٍ تحميل الإشعارات" : "Loading notifications"}</strong><p>{ar ? "لحظات ونجهز آخر التحديثات." : "Getting your latest updates ready."}</p></div> : visibleNotices.length === 0 ? <div className="mizan-notice-state"><span className="mizan-notice-empty-icon" aria-hidden="true">✦</span><strong>{noticeFilter === "unread" ? (ar ? "لا توجد إشعارات غير مقروءة" : "No unread notifications") : (ar ? "لا توجد إشعارات حتى الآن" : "No notifications yet")}</strong><p>{ar ? "ستظهر هنا تحديثات المواعيد والرسائل وأي تنبيهات جديدة." : "Appointment updates, messages and important alerts will appear here."}</p>{noticeFilter === "unread" && <button type="button" onClick={() => setNoticeFilter("all")}>{ar ? "عرض كل الإشعارات" : "View all notifications"}</button>}</div> : visibleNotices.map((notice) => {
                  const kind = notice.kind.toLowerCase();
                  const symbol = kind.includes("message") || kind.includes("conversation") ? "✉" : kind.includes("appointment") || kind.includes("booking") ? "◷" : kind.includes("document") || kind.includes("case") ? "§" : "✦";
                  return <div key={notice.id} className="mizan-notice-row-with-delete"><Link href={noticeHref(notice)} onClick={() => { setNotificationsOpen(false); if (!notice.read_at) { const now = new Date().toISOString(); setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read_at: now } : item)); void createClient().from("notifications").update({ read_at: now }).eq("id", notice.id); } }} className={notice.read_at ? "mizan-dashboard-notice-item" : "mizan-dashboard-notice-item is-unread"}>
                    <span className={`mizan-notice-kind-icon ${notice.read_at ? "" : "is-unread"}`} aria-hidden="true">{symbol}</span>
                    <span className="mizan-dashboard-notice-copy"><span className="mizan-notice-title-line"><strong>{notice.title}</strong>{!notice.read_at && <i aria-label={ar ? "جديد" : "New"} />}</span>{notice.body && <small>{notice.body}</small>}<time dateTime={notice.created_at}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{new Date(notice.created_at).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</time></span>
                    <span className="mizan-notice-row-arrow" aria-hidden="true">↗</span>
                  </Link><button type="button" className="mizan-notice-delete-one" aria-label={ar ? "حذف الإشعار" : "Delete notification"} title={ar ? "حذف الإشعار" : "Delete notification"} disabled={deletingNotificationId === notice.id} onClick={() => void deleteOneNotification(notice)}>×</button></div>;
                })}
              </div>
              <div className="mizan-dashboard-notification-footer mizan-notice-panel-footer"><span>{ar ? "ميزان · مكتبك القانوني في صورة أوضح" : "MIZAN · Clarity for every legal step"}</span><Link href={`/${locale}/dashboard/conversations`} onClick={() => setNotificationsOpen(false)}>{ar ? "الانتقال إلى الرسائل" : "Go to messages"} <b aria-hidden="true">↗</b></Link></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
