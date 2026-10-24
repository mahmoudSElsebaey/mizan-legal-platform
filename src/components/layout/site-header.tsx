"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ConversationLauncher } from "@/components/layout/conversation-launcher";

type Locale = "ar" | "en";
type Notice = { id: string; kind: string; title: string; body: string | null; href: string | null; created_at: string; read_at: string | null };
export function SiteHeader({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [markingAllNotificationsRead, setMarkingAllNotificationsRead] = useState(false);
  const [clearingNotifications, setClearingNotifications] = useState(false);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [noticeFilter, setNoticeFilter] = useState<"all" | "unread">("all");
  const [userId, setUserId] = useState<string | null>(null);
  const unreadNotifications = notices.filter((notice) => !notice.read_at).length;
  const visibleNotices = noticeFilter === "unread" ? notices.filter((notice) => !notice.read_at) : notices;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const switchPath = (next: Locale) => pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${next}`);
  const firstName = (user?.name || "").trim().split(/\s+/)[0];
  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (alive && data.user) { setUser({ email: data.user.email, name: String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "") }); setUserId(data.user.id); }
    }).catch(() => {});
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ? { email: session.user.email, name: String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "") } : null); setUserId(session?.user?.id ?? null); if (!session?.user) setNotices([]);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!languageRef.current?.contains(target)) setLanguageOpen(false);
      if (!profileRef.current?.contains(target)) setProfileOpen(false);
      if (!notificationRef.current?.contains(target)) setNotificationsOpen(false);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setLanguageOpen(false); setProfileOpen(false); setNotificationsOpen(false); setMobileMenuOpen(false); } };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => {
    if (!userId) { setNotices([]); return; }
    let alive = true;
    const supabase = createClient();
    const loadNotifications = async () => {
      setNotificationsLoading(true);
      const { data, error } = await supabase.from("notifications")
        .select("id,kind,title,body,href,created_at,read_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
      if (alive) {
        if (!error) setNotices((data || []) as Notice[]);
        setNotificationsLoading(false);
      }
    };
    void loadNotifications();
    const channel = supabase.channel("mizan-header-notifications-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, () => { void loadNotifications(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [userId]);

  async function markNotificationRead(notice: Notice) {
    if (!userId || notice.read_at) return;
    const readAt = new Date().toISOString();
    setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read_at: readAt } : item));
    const { error } = await createClient().from("notifications").update({ read_at: readAt }).eq("id", notice.id).eq("user_id", userId);
    if (error) setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read_at: null } : item));
  }

  async function markAllNotificationsRead() {
    if (!userId || unreadNotifications === 0 || markingAllNotificationsRead) return;
    setMarkingAllNotificationsRead(true);
    const ids = notices.filter((notice) => !notice.read_at).map((notice) => notice.id);
    const readAt = new Date().toISOString();
    setNotices((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read_at: readAt } : notice));
    const { error } = await createClient().from("notifications").update({ read_at: readAt }).eq("user_id", userId).in("id", ids);
    if (error) setNotices((current) => current.map((notice) => ids.includes(notice.id) ? { ...notice, read_at: null } : notice));
    setMarkingAllNotificationsRead(false);
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

  function notificationHref(notice: Notice) {
    const fallback = `/${locale}/dashboard/conversations`;
    if (!notice.href || !notice.href.startsWith("/") || notice.href.startsWith("//")) return fallback;
    return notice.href.startsWith("/ar/") || notice.href.startsWith("/en/") ? notice.href.replace(/^\/(ar|en)(?=\/|$)/, `/${locale}`) : fallback;
  }
  const items = [
    { href: `/${locale}`, label: ar ? "الرئيسية" : "Home", active: pathname === `/${locale}` },
    { href: `/${locale}/services`, label: ar ? "الخدمات" : "Services", active: pathname.includes("/services") },
    { href: `/${locale}/office`, label: ar ? "المكتب" : "The Office", active: pathname.includes("/office") },
    { href: `/${locale}/lawyer`, label: ar ? "المحامي" : "Lawyer", active: pathname.includes("/lawyer") },
    { href: `/${locale}/insights`, label: ar ? "المقالات" : "Insights", active: pathname.includes("/insights") },
  ];
  async function signOut() {
    setBusy(true);
    try { const supabase = createClient(); await supabase.auth.signOut(); setUser(null); setProfileOpen(false); router.push(`/${locale}/login`); router.refresh(); }
    finally { setBusy(false); }
  }
  return <header className="mizan-site-header" dir={ar ? "rtl" : "ltr"}>
    <div className="mizan-site-header-inner">
      <Link href={`/${locale}`} className="mizan-site-brand" aria-label={ar ? "ميزان - الرئيسية" : "MIZAN home"}>
        <span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M32 8v40M19 16h26M12 20l-7 16h14L12 20Zm40 0-7 16h14L52 20ZM5 36c1.2 5 13.8 5 14 0m26 0c1.2 5 13.8 5 14 0M20 48h24M24 53h16M28 58h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 5l3 3-3 3-3-3 3-3Z" fill="currentColor"/><circle cx="32" cy="48" r="2" fill="currentColor"/></svg></span><span className="mizan-site-brand-copy"><strong className={ar ? "mizan-arabic-wordmark" : ""}>{ar ? "مِــيــزَان" : "MIZAN"}</strong><small>{ar ? "مكتب محاماة واستشارات قانونية" : "LAW FIRM & LEGAL CONSULTANCY"}</small></span>
      </Link>
      <nav id="mizan-mobile-navigation" className={mobileMenuOpen ? "mizan-site-nav is-mobile-open" : "mizan-site-nav"} aria-label={ar ? "التنقل الرئيسي" : "Main navigation"} aria-hidden={!mobileMenuOpen && undefined}>
        {items.map(item => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={item.active ? "is-active" : ""} onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>)}
        <Link href={`/${locale}/contact`} aria-current={pathname.startsWith(`/${locale}/contact`) ? "page" : undefined} className={pathname.startsWith(`/${locale}/contact`) ? "is-active" : ""} onClick={() => setMobileMenuOpen(false)}>{ar ? "تواصل معنا" : "Contact"}</Link>
        <div className="mizan-mobile-menu-extras">
          <section className="mizan-mobile-menu-section">
            <h2>{ar ? "اللغة" : "Language"}</h2>
            <div className="mizan-mobile-language-options">
              <Link href={switchPath("ar")} aria-current={ar ? "page" : undefined} onClick={() => setMobileMenuOpen(false)} className={ar ? "is-selected" : ""}><span className="mizan-mobile-option-icon">ع</span><span>{ar ? "العربية" : "Arabic"}</span>{ar && <b>✓</b>}</Link>
              <Link href={switchPath("en")} aria-current={!ar ? "page" : undefined} onClick={() => setMobileMenuOpen(false)} className={!ar ? "is-selected" : ""}><span className="mizan-mobile-option-icon">A</span><span>English</span>{!ar && <b>✓</b>}</Link>
            </div>
          </section>
          {user ? <>
            <section className="mizan-mobile-menu-section">
              <h2>{ar ? "حسابك" : "Your account"}</h2>
              <div className="mizan-mobile-account-summary"><span className="mizan-avatar">{(firstName || user.email || "M").slice(0,1).toLocaleUpperCase()}</span><span><strong>{firstName || (ar ? "حسابي" : "My account")}</strong><small>{user.email}</small></span></div>
              <div className="mizan-mobile-account-links">
                <Link href={`/${locale}/dashboard`} onClick={() => setMobileMenuOpen(false)}><span>▦</span>{ar ? "لوحة التحكم" : "Dashboard"}<b>↗</b></Link>
                <Link href={`/${locale}/dashboard/conversations`} onClick={() => setMobileMenuOpen(false)}><span>◌</span>{ar ? "المحادثات والرسائل" : "Messages"}<b>↗</b></Link>
                <Link href={`/${locale}/dashboard/appointments`} onClick={() => setMobileMenuOpen(false)}><span>▣</span>{ar ? "المواعيد" : "Appointments"}<b>↗</b></Link>
              </div>
            </section>
            <section className="mizan-mobile-menu-section mizan-mobile-notifications">
              <h2>{ar ? "الإشعارات" : "Notifications"}</h2>
              <div className="mizan-mobile-notification-empty"><span>✦</span><p>{ar ? "ستظهر هنا تحديثات المواعيد والرسائل الجديدة." : "Appointment updates and new messages will appear here."}</p></div>
            </section>
            <button type="button" className="mizan-mobile-signout" disabled={busy} onClick={() => { setMobileMenuOpen(false); void signOut(); }}><span>↪</span>{busy ? (ar ? "جارٍ الخروج..." : "Signing out...") : (ar ? "تسجيل الخروج" : "Sign out")}</button>
          </> : <Link className="mizan-mobile-signin" href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>{ar ? "تسجيل الدخول" : "Sign in"}<span>↗</span></Link>}
        </div>
      </nav>
      <button type="button" className={mobileMenuOpen ? "mizan-mobile-menu-toggle is-open" : "mizan-mobile-menu-toggle"} aria-label={mobileMenuOpen ? (ar ? "إغلاق القائمة" : "Close menu") : (ar ? "فتح القائمة" : "Open menu")} aria-expanded={mobileMenuOpen} aria-controls="mizan-mobile-navigation" onClick={() => setMobileMenuOpen(value => !value)}><span/><span/><span/></button>
      <div className="mizan-site-actions">
        <div className="mizan-popover-anchor" ref={languageRef}>
          <button type="button" className="mizan-language" aria-expanded={languageOpen} aria-haspopup="menu" onClick={() => { setLanguageOpen(v => !v); setProfileOpen(false); setNotificationsOpen(false); }}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span className="mizan-language-code">{ar ? "AR" : "EN"}</span><svg className={languageOpen ? "mizan-chevron-icon is-open" : "mizan-chevron-icon"} viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button>
          <div className={languageOpen ? "mizan-dropdown mizan-language-menu is-open" : "mizan-dropdown mizan-language-menu"} role="menu" aria-hidden={!languageOpen}><Link role="menuitem" href={switchPath("ar")} onClick={() => setLanguageOpen(false)} className={ar ? "is-selected" : ""}><span>ع</span><span>العربية<small>Arabic</small></span>{ar && <b>✓</b>}</Link><Link role="menuitem" href={switchPath("en")} onClick={() => setLanguageOpen(false)} className={!ar ? "is-selected" : ""}><span>A</span><span>English<small>English</small></span>{!ar && <b>✓</b>}</Link></div>
        </div>
        {user ? <>
          <ConversationLauncher locale={locale} />
          <div className="mizan-popover-anchor mizan-notification-anchor" ref={notificationRef}>
            <button type="button" className="mizan-icon-button" aria-label={ar ? `الإشعارات، ${unreadNotifications} غير مقروء` : `Notifications, ${unreadNotifications} unread`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(v => !v); setProfileOpen(false); setLanguageOpen(false); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
              {unreadNotifications > 0 && <span className="mizan-header-unread-count">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}
            </button>
            <div className={notificationsOpen ? "mizan-dropdown mizan-notification-menu is-open" : "mizan-dropdown mizan-notification-menu"} aria-hidden={!notificationsOpen}>
              <div className="mizan-notice-panel-head">
                <div className="mizan-notice-heading-copy">
                  <span className="mizan-notice-eyebrow">{ar ? "مركز التنبيهات" : "YOUR UPDATES"}</span>
                  <strong>{ar ? "الإشعارات" : "Notifications"}</strong>
                  <span>{unreadNotifications ? (ar ? `لديك ${unreadNotifications} إشعارات غير مقروءة` : `You have ${unreadNotifications} unread ${unreadNotifications === 1 ? "notification" : "notifications"}`) : (ar ? "أنت على اطلاع بكل جديد" : "You’re all caught up")}</span>
                </div>
                <span className="mizan-notice-header-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>{unreadNotifications > 0 && <i />}</span>
              </div>
              <div className="mizan-notice-toolbar">
                <div className="mizan-notice-filters" role="group" aria-label={ar ? "تصفية الإشعارات" : "Filter notifications"}>
                  <button type="button" className={noticeFilter === "all" ? "is-active" : ""} aria-pressed={noticeFilter === "all"} onClick={() => setNoticeFilter("all")}>{ar ? "الكل" : "All"} <span>{notices.length}</span></button>
                  <button type="button" className={noticeFilter === "unread" ? "is-active" : ""} aria-pressed={noticeFilter === "unread"} onClick={() => setNoticeFilter("unread")}>{ar ? "غير مقروء" : "Unread"} {unreadNotifications > 0 && <span>{unreadNotifications}</span>}</button>
                </div>
                {unreadNotifications > 0 && <button className="mizan-notice-mark-all" type="button" disabled={markingAllNotificationsRead} aria-busy={markingAllNotificationsRead} onClick={() => void markAllNotificationsRead()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>{markingAllNotificationsRead ? (ar ? "جارٍ التحديث" : "Updating") : (ar ? "قراءة الكل" : "Mark all read")}</button>}{notices.length > 0 && <button className="mizan-notice-delete-all" type="button" disabled={clearingNotifications} onClick={() => void clearAllNotifications()}>{clearingNotifications ? (ar ? "جارٍ المسح..." : "Clearing...") : (ar ? "مسح الكل" : "Clear all")}</button>}
              </div>
              <div className="mizan-dashboard-notice-list mizan-notice-feed">
                {notificationsLoading ? <div className="mizan-notice-state"><span className="mizan-notice-spinner" /><strong>{ar ? "جارٍ تحميل الإشعارات" : "Loading notifications"}</strong><p>{ar ? "لحظات ونجهز آخر التحديثات." : "Getting your latest updates ready."}</p></div> : visibleNotices.length === 0 ? <div className="mizan-notice-state"><span className="mizan-notice-empty-icon" aria-hidden="true">✦</span><strong>{noticeFilter === "unread" ? (ar ? "لا توجد إشعارات غير مقروءة" : "No unread notifications") : (ar ? "لا توجد إشعارات حتى الآن" : "No notifications yet")}</strong><p>{ar ? "ستظهر هنا تحديثات المواعيد والرسائل وأي تنبيهات جديدة." : "Appointment updates, messages and important alerts will appear here."}</p>{noticeFilter === "unread" && <button type="button" onClick={() => setNoticeFilter("all")}>{ar ? "عرض كل الإشعارات" : "View all notifications"}</button>}</div> : visibleNotices.map((notice) => {
                  const kind = notice.kind.toLowerCase();
                  const symbol = kind.includes("message") || kind.includes("conversation") ? "✉" : kind.includes("appointment") || kind.includes("booking") ? "◷" : kind.includes("document") || kind.includes("case") ? "§" : "✦";
                  return <div key={notice.id} className="mizan-notice-row-with-delete"><Link href={notificationHref(notice)} onClick={() => { setNotificationsOpen(false); void markNotificationRead(notice); }} className={notice.read_at ? "mizan-dashboard-notice-item" : "mizan-dashboard-notice-item is-unread"}>
                    <span className={`mizan-notice-kind-icon ${notice.read_at ? "" : "is-unread"}`} aria-hidden="true">{symbol}</span>
                    <span className="mizan-dashboard-notice-copy"><span className="mizan-notice-title-line"><strong>{notice.title}</strong>{!notice.read_at && <i aria-label={ar ? "جديد" : "New"} />}</span>{notice.body && <small>{notice.body}</small>}<time dateTime={notice.created_at}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>{new Date(notice.created_at).toLocaleString(ar ? "ar-EG" : "en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" })}</time></span>
                    <span className="mizan-notice-row-arrow" aria-hidden="true">↗</span>
                  </Link><button type="button" className="mizan-notice-delete-one" aria-label={ar ? "حذف الإشعار" : "Delete notification"} title={ar ? "حذف الإشعار" : "Delete notification"} disabled={deletingNotificationId === notice.id} onClick={() => void deleteOneNotification(notice)}>×</button></div>;
                })}
              </div>
              <div className="mizan-dashboard-notification-footer mizan-notice-panel-footer"><span>{ar ? "ميزان · مكتبك القانوني في صورة أوضح" : "MIZAN · Clarity for every legal step"}</span><Link href={`/${locale}/dashboard/conversations`} onClick={() => setNotificationsOpen(false)}>{ar ? "الانتقال إلى الرسائل" : "Go to messages"} <b aria-hidden="true">↗</b></Link></div>
            </div>
          </div>
          <div className="mizan-popover-anchor" ref={profileRef}><button type="button" className="mizan-profile-trigger" aria-expanded={profileOpen} onClick={() => { setProfileOpen(v => !v); setNotificationsOpen(false); setLanguageOpen(false); }}><span className="mizan-avatar" aria-hidden="true">{(firstName || user.email || "M").slice(0,1).toLocaleUpperCase()}</span><span className="mizan-profile-copy"><strong>{firstName || (ar ? "حسابي" : "Account")}</strong></span><svg className={profileOpen ? "mizan-chevron-icon is-open" : "mizan-chevron-icon"} viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button><div className={profileOpen ? "mizan-dropdown mizan-profile-menu is-open" : "mizan-dropdown mizan-profile-menu"} aria-hidden={!profileOpen}><div className="mizan-profile-menu-user"><span className="mizan-avatar">{(user.name || user.email || "M").slice(0,1).toLocaleUpperCase()}</span><span><strong>{user.name || (ar ? "حسابي" : "My account")}</strong><small>{user.email}</small></span></div><Link href={`/${locale}/dashboard`} onClick={() => setProfileOpen(false)}><span>▦</span>{ar ? "لوحة التحكم" : "Dashboard"}<b>↗</b></Link><Link href={`/${locale}/dashboard/conversations`} onClick={() => setProfileOpen(false)}><span>◌</span>{ar ? "المحادثات" : "Messages"}<b>↗</b></Link><Link href={`/${locale}/dashboard/appointments`} onClick={() => setProfileOpen(false)}><span>▣</span>{ar ? "المواعيد" : "Appointments"}<b>↗</b></Link><div className="mizan-profile-divider"/><button type="button" disabled={busy} onClick={signOut}><span>↪</span>{busy ? (ar ? "جارٍ الخروج..." : "Signing out...") : (ar ? "تسجيل الخروج" : "Sign out")}</button></div></div>
        </> : <Link className="mizan-login" href={`/${locale}/login`}>{ar ? "تسجيل الدخول" : "Sign in"}</Link>}
      </div>
    </div>
  </header>;
}
