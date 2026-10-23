"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
export function AuthHeader({ locale }: { locale: "ar" | "en" }) {
 const ar=locale==="ar"; const pathname=usePathname()||`/${locale}/login`; const [open,setOpen]=useState(false);
 const switchPath=(next:"ar"|"en")=>pathname.replace(/^\/(ar|en)(?=\/|$)/,`/${next}`);
 return <header className="mizan-auth-header" dir={ar?"rtl":"ltr"}><Link href={`/${locale}`} className="mizan-site-brand"><span className="mizan-site-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M5 39V8l19 17L43 8v31M5 8l19 17L43 8M14 39V25m20 14V25" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/></svg></span><span className="mizan-site-brand-copy"><strong className={ar?"mizan-arabic-wordmark":""}>{ar?"ميزان":"MIZAN"}</strong><small>{ar?"منصتك القانونية":"YOUR LEGAL PLATFORM"}</small></span></Link><div className="mizan-popover-anchor"><button type="button" className="mizan-language mizan-auth-language" aria-expanded={open} onClick={()=>setOpen(v=>!v)}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></svg>{ar?"العربية":"English"} <span className={open?"mizan-chevron is-open":"mizan-chevron"}>⌄</span></button><div className={open?"mizan-dropdown mizan-language-menu is-open":"mizan-dropdown mizan-language-menu"} aria-hidden={!open}><Link href={switchPath("ar")} onClick={()=>setOpen(false)}>{ar?"✓ ":""}العربية<small>Arabic</small></Link><Link href={switchPath("en")} onClick={()=>setOpen(false)}>{!ar?"✓ ":""}English<small>English</small></Link></div></div></header>;
}
