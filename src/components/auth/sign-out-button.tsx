"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ locale }: { locale: "ar" | "en" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button type="button" onClick={signOut} disabled={loading} className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:border-stone-500 disabled:opacity-60">
      {loading ? (locale === "ar" ? "جارٍ الخروج..." : "Signing out...") : (locale === "ar" ? "تسجيل الخروج" : "Sign out")}
    </button>
  );
}
