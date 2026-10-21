import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { isLocale, locales } from "@/lib/i18n/config";
export const dynamicParams = false;
export function generateStaticParams() { return locales.map((locale) => ({ locale })); }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> { const { locale } = await params; if (!isLocale(locale)) return {}; return { title: locale === "ar" ? "ميزان للمحاماة والاستشارات القانونية" : "Mizan Legal | Legal Counsel", description: locale === "ar" ? "استشارات قانونية واضحة، بتواصل إنساني يحترم وقتك وخصوصيتك." : "Clear legal guidance with thoughtful communication and respect for your privacy." }; }
export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <div lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} data-locale={locale}>{children}</div>; }
