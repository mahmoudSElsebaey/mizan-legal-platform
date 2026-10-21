"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";

const copy = {
  ar: {
    login: { title: "تسجيل الدخول", description: "سجّل الدخول لمتابعة حسابك.", submit: "دخول", switchText: "ليس لديك حساب؟", switchLabel: "إنشاء حساب", forgot: "نسيت كلمة المرور؟" },
    register: { title: "إنشاء حساب", description: "أنشئ حسابًا للتواصل مع المكتب ومتابعة طلباتك.", submit: "إنشاء الحساب", switchText: "لديك حساب بالفعل؟", switchLabel: "تسجيل الدخول" },
    "forgot-password": { title: "استعادة كلمة المرور", description: "سنرسل لك رابطًا آمنًا لإعادة تعيين كلمة المرور.", submit: "إرسال رابط الاستعادة", switchText: "تذكرت كلمة المرور؟", switchLabel: "تسجيل الدخول" },
    "reset-password": { title: "كلمة مرور جديدة", description: "اختر كلمة مرور جديدة لحسابك.", submit: "حفظ كلمة المرور", switchText: "رجوع إلى", switchLabel: "تسجيل الدخول" },
    fullName: "الاسم بالكامل", email: "البريد الإلكتروني", password: "كلمة المرور", confirm: "تأكيد كلمة المرور",
    working: "جارٍ التنفيذ...", genericError: "تعذر إكمال الطلب. حاول مرة أخرى.", mismatch: "كلمتا المرور غير متطابقتين.", sent: "إذا كان البريد مسجلًا، فستصلك رسالة تحتوي على رابط الاستعادة.", registered: "تم إنشاء الحساب. راجع بريدك الإلكتروني لتأكيده قبل تسجيل الدخول.", updated: "تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن."
  },
  en: {
    login: { title: "Sign in", description: "Sign in to continue to your account.", submit: "Sign in", switchText: "Don't have an account?", switchLabel: "Create an account", forgot: "Forgot password?" },
    register: { title: "Create an account", description: "Create an account to contact the office and follow your requests.", submit: "Create account", switchText: "Already have an account?", switchLabel: "Sign in" },
    "forgot-password": { title: "Reset your password", description: "We'll send a secure password reset link if the account exists.", submit: "Send reset link", switchText: "Remembered your password?", switchLabel: "Sign in" },
    "reset-password": { title: "Choose a new password", description: "Enter a new password for your account.", submit: "Save password", switchText: "Back to", switchLabel: "Sign in" },
    fullName: "Full name", email: "Email address", password: "Password", confirm: "Confirm password",
    working: "Working...", genericError: "Something went wrong. Please try again.", mismatch: "Passwords do not match.", sent: "If an account exists for this email, a reset link will be sent.", registered: "Account created. Check your email to confirm it before signing in.", updated: "Password updated. You can sign in now."
  }
} as const;

export function AuthForm({ locale, mode }: { locale: Locale; mode: AuthMode }) {
  const router = useRouter();
  const t = copy[locale];
  const labels = t[mode];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("fullName") ?? "").trim();
    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace(`/${locale}/dashboard`);
        router.refresh();
        return;
      }

      if (mode === "register") {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`,
            data: { full_name: fullName, locale }
          }
        });
        if (authError) throw authError;
        if (data.session) {
          router.replace(`/${locale}/dashboard`);
          router.refresh();
          return;
        }
        setMessage(t.registered);
      }

      if (mode === "forgot-password") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/reset-password`
        });
        if (authError) throw authError;
        setMessage(t.sent);
      }

      if (mode === "reset-password") {
        if (password !== String(form.get("confirmPassword") ?? "")) throw new Error(t.mismatch);
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setMessage(t.updated);
        router.replace(`/${locale}/login`);
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold tracking-wide text-amber-700">MIZAN LEGAL · ميزان</p>
        <h1 className="text-2xl font-bold text-stone-950">{labels.title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{labels.description}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            {t.fullName}
            <input name="fullName" autoComplete="name" required maxLength={120} className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
        )}
        {mode !== "reset-password" && (
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            {t.email}
            <input name="email" type="email" autoComplete="email" required maxLength={254} className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
        )}
        {mode !== "forgot-password" && (
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            {t.password}
            <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
        )}
        {mode === "reset-password" && (
          <label className="block space-y-2 text-sm font-medium text-stone-700">
            {t.confirm}
            <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="w-full rounded-xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        <button disabled={loading} type="submit" className="w-full rounded-xl bg-stone-950 px-4 py-3 font-semibold text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? t.working : labels.submit}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
        <p>{labels.switchText} <Link className="font-semibold text-amber-800 underline-offset-4 hover:underline" href={`/${locale}/login`}>{labels.switchLabel}</Link></p>
        {mode === "login" && <Link className="font-medium text-amber-800 underline-offset-4 hover:underline" href={`/${locale}/forgot-password`}>{t.login.forgot}</Link>}
      </div>
      {mode === "login" && <p className="mt-5 text-xs leading-5 text-stone-500">{locale === "ar" ? "إنشاء الحساب لا يمنح صلاحيات موظف أو مدير؛ تتم إدارة صلاحيات المكتب بشكل منفصل وآمن." : "Creating an account does not grant staff or administrator access. Office roles are assigned separately and securely."}</p>}
    </section>
  );
}
