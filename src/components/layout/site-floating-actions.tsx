"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SiteFloatingActions({ locale }: { locale: "ar" | "en" }) {
  const ar = locale === "ar";
  const pathname = usePathname();
  const [userId, setUserId] = useState("");
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    void supabase.auth.getUser().then(({ data }) => { if (alive) setUserId(data.user?.id || ""); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user?.id || ""));
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!userId) { setUnread(0); return; }
    const supabase = createClient();
    let alive = true;
    const refresh = async () => {
      const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("kind", "new_message").is("read_at", null);
      if (alive && !error) setUnread(count || 0);
    };
    void refresh();
    const channel = supabase.channel("mizan-floating-message-count-" + userId)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: "user_id=eq." + userId }, () => { void refresh(); })
      .subscribe();
    return () => { alive = false; void supabase.removeChannel(channel); };
  }, [userId, pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 220);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!userId) return null;
  return <div className="mizan-floating-actions" dir={ar ? "rtl" : "ltr"}>
    <button type="button" className={"mizan-back-to-top" + (scrolled ? " is-visible" : "")} aria-label={ar ? "العودة إلى أعلى الصفحة" : "Back to top"} title={ar ? "إلى أعلى الصفحة" : "Back to top"} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/><path d="M12 8v12"/></svg>
    </button>
    <Link href={"/" + locale + "/dashboard/conversations"} className="mizan-floating-messages" aria-label={ar ? "فتح الرسائل" : "Open messages"} title={ar ? "الرسائل" : "Messages"}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H5l-1-4a7.5 7.5 0 1 1 16-3.5Z"/><path d="M8 11h8M8 14h5"/></svg>
      {unread > 0 && <span>{unread > 99 ? "99+" : unread}</span>}
    </Link>
  </div>;
}
