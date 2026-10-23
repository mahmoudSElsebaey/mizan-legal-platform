"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NotFoundView({ standalone = false }: { standalone?: boolean }) {
  const pathname = usePathname() || "/ar";
  const locale = pathname.split("/").filter(Boolean)[0] === "en" ? "en" : "ar";
  const ar = locale === "ar";

  return (
    <main className={standalone ? "mizan-notfound mizan-notfound-standalone" : "mizan-notfound"} dir={ar ? "rtl" : "ltr"} lang={locale}>
      {standalone && (
        <header className="mizan-notfound-topbar">
          <Link href={"/" + locale} className="mizan-notfound-brand" aria-label={ar ? "ميزان - الرئيسية" : "Mizan Legal home"}>
            <span className="mizan-notfound-brand-mark" aria-hidden="true">§</span>
            <span><strong>{ar ? "مِــيــزَان" : "MIZAN"}</strong><small>{ar ? "للمحاماة والاستشارات القانونية" : "LEGAL COUNSEL"}</small></span>
          </Link>
          <Link className="mizan-notfound-language" href={pathname.replace(/^\/(ar|en)(?=\/|$)/, ar ? "/en" : "/ar")}>{ar ? "English" : "العربية"} ↗</Link>
        </header>
      )}

      <section className="mizan-notfound-main" aria-labelledby="mizan-notfound-title">
        <div className="mizan-notfound-art" aria-hidden="true">
          <div className="mizan-notfound-orbit mizan-notfound-orbit-one" />
          <div className="mizan-notfound-orbit mizan-notfound-orbit-two" />
          <div className="mizan-notfound-seal"><span>§</span><i /><i /><i /></div>
          <span className="mizan-notfound-art-code">M / 404</span>
          <span className="mizan-notfound-art-dot" />
        </div>
        <div className="mizan-notfound-copy">
          <p className="mizan-notfound-eyebrow"><span />{ar ? "مسار غير موجود" : "UNCHARTED TERRITORY"}</p>
          <div className="mizan-notfound-number">4<span>0</span>4</div>
          <h1 id="mizan-notfound-title">{ar ? "يبدو أنك وصلت إلى طريقٍ مسدود." : "It seems this path leads nowhere."}</h1>
          <p className="mizan-notfound-description">
            {ar
              ? "الرابط الذي فتحته غير صحيح، أو أن الصفحة نُقلت إلى مكان آخر. لا تقلق، يمكننا إرشادك إلى الطريق الصحيح."
              : "The link may be incorrect, or the page may have moved. No worries — let’s get you back on the right path."}
          </p>
          <div className="mizan-notfound-actions">
            <Link href={"/" + locale} className="mizan-notfound-primary"><span>{ar ? "العودة للرئيسية" : "Back to homepage"}</span><b aria-hidden="true">↗</b></Link>
            <Link href={"/" + locale + "/contact"} className="mizan-notfound-secondary">{ar ? "تواصل مع المكتب" : "Contact the office"}</Link>
          </div>
          <p className="mizan-notfound-reference"><span>§</span>{ar ? "ميزان للمحاماة والاستشارات القانونية" : "Mizan Legal · Clarity. Trust. Responsibility."}</p>
        </div>
      </section>
    </main>
  );
}
