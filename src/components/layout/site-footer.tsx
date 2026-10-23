import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";

export function SiteFooter({ locale, officeName, email, phone, address }: { locale: Locale; officeName: string; email?: string; phone?: string; address?: string }) {
  const ar = locale === "ar";
  const quick = [{ href: "", label: ar ? "الرئيسية" : "Home" }, { href: "/office", label: ar ? "المكتب" : "The office" }, { href: "/lawyer", label: ar ? "المحامي" : "Lawyer" }, { href: "/insights", label: ar ? "المقالات" : "Insights" }, { href: "/register", label: ar ? "إنشاء حساب" : "Create account" }];
  const areas = ar ? ["القانون المدني", "القانون التجاري", "القانون الجنائي", "قانون الأسرة", "العقود والاستشارات"] : ["Civil law", "Commercial law", "Criminal law", "Family law", "Contracts & counsel"];
  return <footer className="mizan-site-footer" id="site-footer">
    <div className="mizan-footer-main">
      <div className="mizan-footer-about">
        <Link href={`/${locale}`} className="mizan-footer-brand"><span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 39V8l19 17L43 8v31M5 8l19 17L43 8M14 39V25m20 14V25" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/></svg></span><span className="mizan-site-brand-copy"><strong>MIZAN</strong><small>{ar ? "منصة قانونية" : "LEGAL PLATFORM"}</small></span></Link>
        <p>{ar ? "منصة قانونية تجمع بين الخبرة والوضوح والتواصل الإنساني، لتسهيل وصولك إلى الخدمات القانونية المناسبة." : "A thoughtful legal platform built around expertise, clarity, and human communication, helping you find the legal support you need."}</p>
        <span className="mizan-footer-rule" />
        <div className="mizan-social-links" aria-label={ar ? "روابط اجتماعية" : "Social links"}><a href="https://www.linkedin.com/" aria-label="LinkedIn">in</a><a href="https://www.facebook.com/" aria-label="Facebook">f</a><a href="https://www.instagram.com/" aria-label="Instagram">◎</a><a href="https://www.youtube.com/" aria-label="YouTube">▶</a></div>
      </div>
      <div className="mizan-footer-column"><h2>{ar ? "روابط سريعة" : "Quick links"}</h2>{quick.map((item) => <Link key={item.href || "home"} href={`/${locale}${item.href}`}>{item.label}<span aria-hidden="true">›</span></Link>)}</div>
      <div className="mizan-footer-column"><h2>{ar ? "مجالات الممارسة" : "Practice areas"}</h2>{areas.map((label) => <Link key={label} href={`/${locale}/services`}>{label}<span aria-hidden="true">›</span></Link>)}</div>
      <div className="mizan-footer-contact"><h2>{ar ? "تواصل معنا" : "Get in touch"}</h2>{address && <p><span aria-hidden="true">⌖</span><span>{address}</span></p>}{phone && <p><span aria-hidden="true">↗</span><a href={`tel:${phone}`}>{phone}</a></p>}{email && <p><span aria-hidden="true">✉</span><a href={`mailto:${email}`}>{email}</a></p>}<h3>{ar ? "نحن هنا لمساعدتك" : "Here to help"}</h3><p className="mizan-footer-small">{ar ? "تواصل معنا لمعرفة كيف يمكننا مساعدتك في خطوتك القانونية التالية." : "Reach out to discuss how we can support your next legal step."}</p><Link className="mizan-footer-cta" href={`/${locale}/register`}>{ar ? "ابدأ الآن" : "Get started"} <span aria-hidden="true">↗</span></Link></div>
    </div>
    <div className="mizan-footer-bottom"><span>© {new Date().getFullYear()} MIZAN Legal Platform. {ar ? "جميع الحقوق محفوظة." : "All rights reserved."}</span><div><Link href={`/${locale}/privacy`}>{ar ? "سياسة الخصوصية" : "Privacy"}</Link><Link href={`/${locale}/terms`}>{ar ? "شروط الاستخدام" : "Terms"}</Link><a href="#home">{ar ? "العودة للأعلى ↑" : "Back to top ↑"}</a></div></div>
  </footer>;
}
