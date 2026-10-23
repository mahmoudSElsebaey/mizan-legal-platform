"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
  const [userId, setUserId] = useState<string | null>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const unread = notices.filter((notice) => !notice.read_at).length;
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
        const { data, error } = await supabase.from("notifications").select("id,kind,title,body,href,created_at,read_at").order("created_at", { ascending: false }).limit(12);
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
    if (!userId || unread === 0) return;
    const ids = notices.filter((notice) => !notice.read_at).map((notice) => notice.id);
    const readAt = new Date().toISOString();
    setNotices((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read_at: readAt } : notice));
    const supabase = createClient();
    const { error } = await supabase.from("notifications").update({ read_at: readAt }).in("id", ids);
    if (error) {
      setNotices((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read_at: null } : notice));
    }
  }

  function noticeHref(notice: Notice) {
    const fallback = `/${locale}/dashboard/conversations`;
    if (!notice.href || !notice.href.startsWith("/") || notice.href.startsWith("//")) return fallback;
    return notice.href.startsWith("/ar/") || notice.href.startsWith("/en/") ? notice.href.replace(/^\/(ar|en)(?=\/|$)/, `/${locale}`) : fallback;
  }

  return (
    <header className="mizan-dashboard-header" dir={ar ? "rtl" : "ltr"}>
      <div className="mizan-dashboard-header-inner mizan-dashboard-header-compact">
        <Link href={`/${locale}/dashboard`} className="mizan-dashboard-brand" aria-label={ar ? "ميزان - لوحة التحكم" : "MIZAN dashboard"}>
          <span className="mizan-brand-symbol" aria-hidden="true">M</span>
          <span><strong>MIZAN</strong><small>{ar ? "مساحة العمل القانونية" : "LEGAL WORKSPACE"}</small></span>
        </Link>
        <div className="mizan-dashboard-header-actions">
          <div className="mizan-popover-anchor" ref={languageRef}>
            <button type="button" className="mizan-language mizan-dashboard-language" aria-label={ar ? "تغيير اللغة" : "Change language"} aria-expanded={languageOpen} onClick={() => { setLanguageOpen((value) => !value); setNotificationsOpen(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span>{ar ? "AR" : "EN"}</span><span aria-hidden="true">⌄</span>
            </button>
            <div className={languageOpen ? "mizan-dropdown mizan-language-menu is-open" : "mizan-dropdown mizan-language-menu"} aria-hidden={!languageOpen}>
              <Link href={switchPath("ar")} onClick={() => setLanguageOpen(false)} className={ar ? "is-selected" : ""}><span>ع</span><span>العربية<small>Arabic</small></span>{ar && <b>✓</b>}</Link>
              <Link href={switchPath("en")} onClick={() => setLanguageOpen(false)} className={!ar ? "is-selected" : ""}><span>A</span><span>English<small>English</small></span>{!ar && <b>✓</b>}</Link>
            </div>
          </div>
          <div className="mizan-popover-anchor mizan-notification-anchor" ref={notificationRef}>
            <button type="button" className="mizan-icon-button mizan-dashboard-notification-button" aria-label={ar ? `الإشعارات، ${unread} غير مقروء` : `Notifications, ${unread} unread`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setLanguageOpen(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
              {unread > 0 && <span className="mizan-dashboard-notification-count">{unread > 99 ? "99+" : unread}</span>}
            </button>
            <div className={notificationsOpen ? "mizan-dropdown mizan-notification-menu is-open mizan-dashboard-notification-menu" : "mizan-dropdown mizan-notification-menu mizan-dashboard-notification-menu"} aria-hidden={!notificationsOpen}>
              <div className="mizan-dropdown-heading"><strong>{ar ? "الإشعارات" : "Notifications"}</strong><span>{unread ? (ar ? `${unread} غير مقروء` : `${unread} unread`) : (ar ? "آخر التحديثات" : "Latest updates")}</span></div>
              <div className="mizan-dashboard-notice-list">
                {loading ? <p className="mizan-dashboard-notice-empty">{ar ? "جارٍ تحميل الإشعارات..." : "Loading notifications..."}</p> : notices.length === 0 ? <div className="mizan-dashboard-notice-empty"><span>✦</span><strong>{ar ? "لا توجد إشعارات جديدة" : "You're all caught up"}</strong><p>{ar ? "ستظهر هنا تحديثات المواعيد والرسائل وأي تنبيهات جديدة." : "Appointment updates, messages and new alerts will appear here."}</p></div> : notices.map((notice) => <Link key={notice.id} href={noticeHref(notice)} onClick={() => { setNotificationsOpen(false); if (!notice.read_at) { const now = new Date().toISOString(); setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read_at: now } : item)); void createClient().from("notifications").update({ read_at: now }).eq("id", notice.id); } }} className={notice.read_at ? "mizan-dashboard-notice-item" : "mizan-dashboard-notice-item is-unread"}><span className="mizan-dashboard-notice-indicator"/><span className="mizan-dashboard-notice-copy"><strong>{notice.title}</strong>{notice.body && <small>{notice.body}</small>}<time dateTime={notice.created_at}>{new Date(notice.created_at).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</time></span></Link>)}
              </div>
              <div className="mizan-dashboard-notification-footer">{unread > 0 && <button type="button" onClick={() => void markAllRead()}>{ar ? "تحديد الكل كمقروء" : "Mark all as read"}</button>}<Link href={`/${locale}/dashboard/conversations`} onClick={() => setNotificationsOpen(false)}>{ar ? "عرض المحادثات والإشعارات" : "View messages & notifications"} ↗</Link></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
