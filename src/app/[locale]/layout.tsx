import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales } from "@/lib/i18n/config";
import { SiteShell } from "@/components/layout/site-shell";
import { SiteFloatingActions } from "@/components/layout/site-floating-actions";
export const dynamicParams = false;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ar = locale === "ar";
  return {
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: { default: ar ? "ميزان للمحاماة والاستشارات القانونية" : "Mizan Legal | Legal Counsel", template: ar ? "%s | ميزان للمحاماة" : "%s | Mizan Legal" },
    description: ar ? "استشارات قانونية واضحة، بتواصل إنساني يحترم وقتك وخصوصيتك." : "Clear legal guidance with thoughtful communication and respect for your privacy.",
    alternates: { languages: { ar: "/ar", en: "/en" } },
    openGraph: { type: "website", locale: ar ? "ar_EG" : "en_US", siteName: "Mizan Legal", title: ar ? "ميزان للمحاماة والاستشارات القانونية" : "Mizan Legal | Legal Counsel", description: ar ? "استشارات قانونية واضحة، بتواصل إنساني يحترم وقتك وخصوصيتك." : "Clear legal guidance with thoughtful communication and respect for your privacy." },
  };
}
export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-locale={locale}><SiteShell>{children}</SiteShell><SiteFloatingActions locale={locale} /></div>;
}
