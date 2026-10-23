"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Locale = "ar" | "en";
export function SiteHeader({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const languageRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const switchPath = (next: Locale) => pathname.replace(/^\/(ar|en)(?=\/|$)/, `/${next}`);\n  const firstName = (user?.name || "").trim().split(/\\s+/)[0];
  useEffect(() => {
    let alive = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (alive && data.user) setUser({ email: data.user.email, name: String(data.user.user_metadata?.full_name || data.user.user_metadata?.name || "") });
    }).catch(() => {});
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUser(session?.user ? { email: session.user.email, name: String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "") } : null);
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
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setLanguageOpen(false); setProfileOpen(false); setNotificationsOpen(false); } };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", key); };
  }, []);
  const items = [
    { href: `/${locale}`, label: ar ? "الرئيسية" : "Home", active: pathname === `/${locale}` },
    { href: `/${locale}#services`, label: ar ? "الخدمات" : "Services", active: pathname.includes("/services") || pathname === `/${locale}` && false },
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
        <span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 39V8l19 17L43 8v31M5 8l19 17L43 8M14 39V25m20 14V25" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg></span>
        <span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none"><path d="M32 8v40M19 16h26M12 20l-7 16h14L12 20Zm40 0-7 16h14L52 20ZM5 36c1.2 5 13.8 5 14 0m26 0c1.2 5 13.8 5 14 0M20 48h24M24 53h16M28 58h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 5l3 3-3 3-3-3 3-3Z" fill="currentColor"/><circle cx="32" cy="48" r="2" fill="currentColor"/></svg></span><span className="mizan-site-brand-copy"><strong className={ar ? "mizan-arabic-wordmark" : ""}>{ar ? "مِــيــزَان" : "MIZAN"}</strong><small>{ar ? "مكتب محاماة واستشارات قانونية" : "LAW FIRM & LEGAL CONSULTANCY"}</small></span>
      </Link>
      <nav className="mizan-site-nav" aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>{items.map(item => <Link key={item.href} href={item.href} aria-current={item.active ? "page" : undefined} className={item.active ? "is-active" : ""}>{item.label}</Link>)}<Link href={`/${locale}#contact`} className={pathname === `/${locale}` ? "" : ""}>{ar ? "تواصل معنا" : "Contact"}</Link></nav>
      <div className="mizan-site-actions">
        <div className="mizan-popover-anchor" ref={languageRef}>
          <button type="button" className="mizan-language" aria-expanded={languageOpen} aria-haspopup="menu" onClick={() => { setLanguageOpen(v => !v); setProfileOpen(false); setNotificationsOpen(false); }}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg><span className="mizan-language-code">{ar ? "AR" : "EN"}</span><svg className={languageOpen ? "mizan-chevron-icon is-open" : "mizan-chevron-icon"} viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button>
          <div className={languageOpen ? "mizan-dropdown mizan-language-menu is-open" : "mizan-dropdown mizan-language-menu"} role="menu" aria-hidden={!languageOpen}><Link role="menuitem" href={switchPath("ar")} onClick={() => setLanguageOpen(false)} className={ar ? "is-selected" : ""}><span>ع</span><span>العربية<small>Arabic</small></span>{ar && <b>✓</b>}</Link><Link role="menuitem" href={switchPath("en")} onClick={() => setLanguageOpen(false)} className={!ar ? "is-selected" : ""}><span>A</span><span>English<small>English</small></span>{!ar && <b>✓</b>}</Link></div>
        </div>
        {user ? <>
          <div className="mizan-popover-anchor mizan-notification-anchor" ref={notificationRef}><button type="button" className="mizan-icon-button" aria-label={ar ? "الإشعارات" : "Notifications"} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen(v => !v); setProfileOpen(false); setLanguageOpen(false); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span className="mizan-notification-dot"/></button><div className={notificationsOpen ? "mizan-dropdown mizan-notification-menu is-open" : "mizan-dropdown mizan-notification-menu"} aria-hidden={!notificationsOpen}><div className="mizan-dropdown-heading"><strong>{ar ? "الإشعارات" : "Notifications"}</strong><span>{ar ? "آخر التحديثات" : "Latest updates"}</span></div><div className="mizan-empty-notifications"><span>✦</span><strong>{ar ? "أنت على اطلاع" : "You're all caught up"}</strong><p>{ar ? "ستظهر هنا تحديثات المواعيد والرسائل الجديدة." : "Appointment updates and new messages will appear here."}</p></div><Link className="mizan-dropdown-bottom-link" href={`/${locale}/dashboard/conversations`} onClick={() => setNotificationsOpen(false)}>{ar ? "فتح المحادثات" : "Open messages"} ↗</Link></div></div>
          <div className="mizan-popover-anchor" ref={profileRef}><button type="button" className="mizan-profile-trigger" aria-expanded={profileOpen} onClick={() => { setProfileOpen(v => !v); setNotificationsOpen(false); setLanguageOpen(false); }}><span className="mizan-avatar" aria-hidden="true">{(firstName || user.email || "M").slice(0,1).toLocaleUpperCase()}</span><span className="mizan-profile-copy"><strong>{firstName || (ar ? "حسابي" : "Account")}</strong></span><svg className={profileOpen ? "mizan-chevron-icon is-open" : "mizan-chevron-icon"} viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg></button><div className={profileOpen ? "mizan-dropdown mizan-profile-menu is-open" : "mizan-dropdown mizan-profile-menu"} aria-hidden={!profileOpen}><div className="mizan-profile-menu-user"><span className="mizan-avatar">{(user.name || user.email || "M").slice(0,1).toLocaleUpperCase()}</span><span><strong>{user.name || (ar ? "حسابي" : "My account")}</strong><small>{user.email}</small></span></div><Link href={`/${locale}/dashboard`} onClick={() => setProfileOpen(false)}><span>▦</span>{ar ? "لوحة التحكم" : "Dashboard"}<b>↗</b></Link><Link href={`/${locale}/dashboard/conversations`} onClick={() => setProfileOpen(false)}><span>◌</span>{ar ? "المحادثات" : "Messages"}<b>↗</b></Link><Link href={`/${locale}/dashboard/appointments`} onClick={() => setProfileOpen(false)}><span>▣</span>{ar ? "المواعيد" : "Appointments"}<b>↗</b></Link><div className="mizan-profile-divider"/><button type="button" disabled={busy} onClick={signOut}><span>↪</span>{busy ? (ar ? "جارٍ الخروج..." : "Signing out...") : (ar ? "تسجيل الخروج" : "Sign out")}</button></div></div>
        </> : <Link className="mizan-login" href={`/${locale}/login`}>{ar ? "تسجيل الدخول" : "Sign in"}</Link>}
      </div>
    </div>
  </header>;
}
