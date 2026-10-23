"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthHeader } from "@/components/layout/auth-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/ar";
  const parts = pathname.split("/").filter(Boolean);
  const locale = parts[0] === "en" ? "en" : "ar";
  const privatePage = parts[1] === "login" || parts[1] === "register" || parts[1] === "forgot-password" || parts[1] === "reset-password" || parts[1] === "dashboard";
  if (parts[1] === "login" || parts[1] === "register" || parts[1] === "forgot-password" || parts[1] === "reset-password") return <><AuthHeader locale={locale} />{children}</>;
  if (privatePage) return <>{children}</>;
  return <><SiteHeader locale={locale} /><div className="mizan-public-content">{children}</div><SiteFooter locale={locale} /></>;
}
