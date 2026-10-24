"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

type AuthMode = "login" | "register" | "forgot-password" | "reset-password";
type DemoAccount = { label: string; email: string; password: string };

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

export function AuthForm({ locale, mode, demoAccounts = [] }: { locale: Locale; mode: AuthMode; demoAccounts?: DemoAccount[] }) {
  const router = useRouter();
  const t = copy[locale];
  const labels = t[mode];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

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
    <div className="mizan-auth-layout mx-auto">
    <aside className="mizan-auth-story" aria-label={locale === "ar" ? "عن منصة ميزان" : "About Mizan"}><div className="mizan-auth-monogram">م<span>✦</span></div><p className="mizan-auth-eyebrow">MIZAN LEGAL PLATFORM</p><h2>{locale === "ar" ? "الوضوح في كل خطوة.\nوالثقة في كل قضية." : "Clarity in every step.\nConfidence in every case."}</h2><p className="mizan-auth-story-copy">{locale === "ar" ? "مساحة قانونية تجمعك بمكتبك، تحفظ تفاصيلك، وتساعدك تتابع طلباتك ومواعيدك بكل سهولة." : "A considered legal workspace to connect with your office, keep details organized, and follow requests and appointments with confidence."}</p><div className="mizan-auth-trust"><span>✦</span><p>{locale === "ar" ? "خصوصيتك وأمان بياناتك أولوية" : "Your privacy and data security come first"}</p></div><div className="mizan-auth-ornament" aria-hidden="true"><span></span><span></span><span></span></div></aside>
    <section className="mizan-auth-card w-full max-w-md rounded-[28px] border border-[var(--border)] bg-white p-6 sm:p-9">
      <div className="mb-7">
        <p className="mizan-auth-brand mb-3 text-xs font-extrabold tracking-[.18em] text-[var(--teal)]"><span className="mizan-auth-brand-mark">م</span> MIZAN LEGAL <span className="mizan-auth-brand-ar">ميزان</span></p>
        <h1 className="text-3xl font-black tracking-tight text-[var(--forest)] sm:text-[2rem]">{labels.title}</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--slate)]">{labels.description}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="mizan-auth-label block space-y-2 text-sm font-bold text-[var(--charcoal)]">
            {t.fullName}
            <input name="fullName" autoComplete="name" required maxLength={120} className="mizan-auth-input w-full rounded-xl border border-[var(--border)] px-4 py-3.5 outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-emerald-100" />
          </label>
        )}
        {mode !== "reset-password" && (
          <label className="block space-y-2 text-sm font-medium text-[var(--charcoal)]">
            {t.email}
            <input name="email" type="email" autoComplete="email" value={emailValue} onChange={(event) => setEmailValue(event.target.value)} required maxLength={254} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-emerald-100" />
          </label>
        )}
        {mode !== "forgot-password" && (
          <label className="block space-y-2 text-sm font-medium text-[var(--charcoal)]">
            {t.password}
            <input name="password" type="password" value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} maxLength={128} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-emerald-100" />
          </label>
        )}
        {mode === "reset-password" && (
          <label className="block space-y-2 text-sm font-medium text-[var(--charcoal)]">
            {t.confirm}
            <input name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className="w-full rounded-xl border border-[var(--border)] px-4 py-3 outline-none transition focus:border-[var(--teal)] focus:ring-2 focus:ring-emerald-100" />
          </label>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
        <button disabled={loading} type="submit" className="mizan-auth-submit w-full rounded-xl bg-[var(--forest)] px-4 py-3.5 font-bold text-white transition hover:bg-[var(--teal)] disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? t.working : labels.submit}
        </button>
      </form>

      {mode === "login" && demoAccounts.length > 0 && (
        <details className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[var(--forest)]">
            <span>{locale === "ar" ? "حسابات التجربة" : "Demo accounts"}</span>
            <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white">⌄</span>
          </summary>
          <p className="mb-3 mt-2 text-xs leading-5 text-[var(--slate)]">{locale === "ar" ? "افتح القائمة عند الحاجة. اضغط على أي حساب لملء بيانات الدخول تلقائيًا." : "Expand this section when needed. Select an account to fill in its credentials."}</p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => { setEmailValue(account.email); setPasswordValue(account.password); setError(""); setMessage(""); }}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-start text-sm transition hover:border-[var(--teal)] hover:bg-emerald-50"
              >
                <span className="block font-semibold text-[var(--forest)]">{account.label}</span>
                <span className="mt-1 block break-all text-xs text-[var(--slate)]">{account.email}</span>
              </button>
            ))}
          </div>
        </details>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--slate)]">
        <p>{labels.switchText} <Link className="font-semibold text-[var(--teal)] underline-offset-4 hover:underline" href={`/${locale}/${mode === "login" ? "register" : "login"}`}>{labels.switchLabel}</Link></p>
        {mode === "login" && <Link className="font-medium text-[var(--teal)] underline-offset-4 hover:underline" href={`/${locale}/forgot-password`}>{t.login.forgot}</Link>}
      </div>
      {mode === "login" && <p className="mt-5 text-xs leading-5 text-[var(--slate)]">{locale === "ar" ? "إنشاء الحساب لا يمنح صلاحيات موظف أو مدير؛ تتم إدارة صلاحيات المكتب بشكل منفصل وآمن." : "Creating an account does not grant staff or administrator access. Office roles are assigned separately and securely."}</p>}
    </section>
    </div>
  );
}
