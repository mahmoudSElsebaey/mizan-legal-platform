"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

type Locale = "ar" | "en";
export function SiteFooter({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const quick = [{ href: "", label: ar ? "الرئيسية" : "Home" }, { href: "/office", label: ar ? "المكتب" : "The office" }, { href: "/lawyer", label: ar ? "المحامي" : "Lawyer" }, { href: "/insights", label: ar ? "المقالات" : "Insights" }, { href: "/register", label: ar ? "إنشاء حساب" : "Create account" }];
  const areas = ar ? ["القانون المدني", "القانون التجاري", "القانون الجنائي", "قانون الأسرة", "العقود والاستشارات"] : ["Civil law", "Commercial law", "Criminal law", "Family law", "Contracts & counsel"];
  const stopUnavailable = (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault();
  return <footer className="mizan-site-footer" dir={ar ? "rtl" : "ltr"} id="site-footer">
    <div className="mizan-footer-main">
      <div className="mizan-footer-about"><Link href={`/${locale}`} className="mizan-footer-brand"><span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 39V8l19 17L43 8v31M5 8l19 17L43 8M14 39V25m20 14V25" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg></span><span className="mizan-site-brand-copy"><strong className={ar ? "mizan-arabic-wordmark" : ""}>{ar ? "ميزان" : "MIZAN"}</strong><small>{ar ? "منصتك القانونية" : "YOUR LEGAL PLATFORM"}</small></span></Link><p>{ar ? "منصة قانونية تجمع بين الخبرة والوضوح والتواصل الإنساني، لتسهيل وصولك إلى الخدمات القانونية المناسبة." : "A thoughtful legal platform built around expertise, clarity, and human communication, helping you find the legal support you need."}</p><span className="mizan-footer-rule"/><div className="mizan-social-links" aria-label={ar ? "روابط اجتماعية" : "Social links"}><a href="https://www.linkedin.com/" aria-label="LinkedIn">in</a><a href="https://www.facebook.com/" aria-label="Facebook">f</a><a href="https://x.com/" aria-label="X">𝕏</a><a href="#" onClick={stopUnavailable} aria-label={ar ? "واتساب" : "WhatsApp"}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c.3 2 2 3.8 4.5 4.7l1.2-1.2 2 1c-.2 1.3-1.2 2-2.6 1.8-3.6-.7-6.2-3.3-6.7-6.2-.1-.9.5-1.7 1.4-1.9Z"/></svg></a></div></div>
      <div className="mizan-footer-column"><h2>{ar ? "روابط سريعة" : "Quick links"}</h2>{quick.map(item=><Link key={item.href || "home"} href={`/${locale}${item.href}`}><span className="mizan-footer-arrow" aria-hidden="true">‹</span><span>{item.label}</span></Link>)}</div>
      <div className="mizan-footer-column"><h2>{ar ? "مجالات الممارسة" : "Practice areas"}</h2>{areas.map(label=><Link key={label} href={`/${locale}/services`}><span className="mizan-footer-arrow" aria-hidden="true">‹</span><span>{label}</span></Link>)}</div>
      <div className="mizan-footer-contact"><h2>{ar ? "تواصل معنا" : "Get in touch"}</h2><p><span aria-hidden="true">✉</span><span>{ar ? "تواصل معنا للاستفسار عن خدماتنا القانونية." : "Contact us to discuss your legal needs."}</span></p><h3>{ar ? "خطوتك القانونية تبدأ بالوضوح" : "Your next step starts with clarity"}</h3><p className="mizan-footer-small">{ar ? "ابدأ محادثة مع فريقنا لمعرفة كيف يمكننا مساعدتك." : "Start a conversation to learn how we can help."}</p><Link className="mizan-footer-cta" href={`/${locale}/register`}>{ar ? "ابدأ الآن" : "Get started"} <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="mizan-footer-bottom"><span>© {new Date().getFullYear()} MIZAN. {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}</span><div><Link href={`/${locale}/privacy`}>{ar ? "سياسة الخصوصية" : "Privacy policy"}</Link><Link href={`/${locale}/terms`}>{ar ? "شروط الاستخدام" : "Terms of use"}</Link><a href="#home">{ar ? "العودة للأعلى ↑" : "Back to top ↑"}</a></div></div>
  </footer>;
}
