import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account" };

const roleLabels = {
  ar: { owner: "مالك المكتب", admin: "مدير", lawyer: "محامٍ", assistant: "مساعد", client: "عميل", pending: "قيد المراجعة", suspended: "موقوف", active: "نشط" },
  en: { owner: "Office owner", admin: "Administrator", lawyer: "Lawyer", assistant: "Assistant", client: "Client", pending: "Pending", suspended: "Suspended", active: "Active" }
} as const;

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect(`/${locale}/login`);

  const [{ data: profile }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("full_name, locale").eq("id", user.id).maybeSingle(),
    supabase.from("staff_members").select("role, status").eq("profile_id", user.id).maybeSingle()
  ]);
  const labels = roleLabels[locale];
  const role = staff?.role && staff.role in labels ? labels[staff.role as keyof typeof labels] : labels.client;
  const status = staff?.status && staff.status in labels ? labels[staff.status as keyof typeof labels] : null;
  const name = profile?.full_name || user.email || (locale === "ar" ? "حسابك" : "Your account");

  return (
    <main className="min-h-[70vh] bg-stone-50 px-4 py-12 sm:py-16">
      <section className="mx-auto max-w-3xl rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-amber-700">MIZAN LEGAL · ميزان</p>
            <h1 className="mt-3 text-3xl font-bold text-stone-950">{locale === "ar" ? "حسابك" : "Your account"}</h1>
            <p className="mt-2 text-stone-600">{locale === "ar" ? "مرحبًا، " : "Welcome, "}{name}</p>
          </div>
          <SignOutButton locale={locale} />
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-stone-50 p-5">
            <p className="text-sm text-stone-500">{locale === "ar" ? "البريد الإلكتروني" : "Email address"}</p>
            <p className="mt-2 break-all font-semibold text-stone-900">{user.email}</p>
          </div>
          <div className="rounded-2xl bg-stone-50 p-5">
            <p className="text-sm text-stone-500">{locale === "ar" ? "نوع الحساب" : "Account type"}</p>
            <p className="mt-2 font-semibold text-stone-900">{role}</p>
            {status && <p className="mt-1 text-xs text-stone-500">{locale === "ar" ? "الحالة: " : "Status: "}{status}</p>}
          </div>
        </div>
        {!staff && (
          <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            {locale === "ar" ? "حسابك مسجل كحساب عميل. إنشاء الحساب لا يمنح صلاحيات المكتب تلقائيًا." : "Your account is registered as a client. Registration does not automatically grant office staff permissions."}
          </p>
        )}
        <div className="mt-8 border-t border-stone-200 pt-6">
          <Link href={`/${locale}`} className="font-semibold text-amber-800 underline-offset-4 hover:underline">
            {locale === "ar" ? "العودة إلى الموقع" : "Return to website"}
          </Link>
        </div>
      </section>
    </main>
  );
}
