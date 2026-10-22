"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.enum(["ar","en"]);
const startSchema = z.object({
  locale: localeSchema,
  staffId: z.string().uuid(),
  subject: z.string().trim().min(3).max(160),
});
const messageSchema = z.object({
  locale: localeSchema,
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
});
const statusSchema = z.object({
  locale: localeSchema,
  conversationId: z.string().uuid(),
  status: z.enum(["open","closed"]),
});

async function requireUser(locale: string) {
  if (!isLocale(locale)) redirect("/ar/login");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/" + locale + "/login");
  return { supabase, user, locale };
}

function back(locale: "ar"|"en", path = ""): never {
  revalidatePath("/" + locale + "/dashboard");
  revalidatePath("/" + locale + "/dashboard/conversations");
  revalidatePath("/" + locale + "/dashboard/notifications");
  redirect("/" + locale + "/dashboard/conversations" + path);
}

export async function startConversation(formData: FormData) {
  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid conversation details.");
  const { locale, staffId, subject } = parsed.data;
  const { supabase, user } = await requireUser(locale);
  const { data, error } = await supabase.from("conversations").insert({
    client_id: user.id,
    staff_id: staffId,
    subject,
    status: "open",
  }).select("id").single();
  if (error || !data) back(locale, "?result=start-failed");
  revalidatePath("/" + locale + "/dashboard");
  redirect("/" + locale + "/dashboard/conversations/" + data.id);
}

export async function sendConversationMessage(formData: FormData) {
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid message.");
  const { locale, conversationId, body } = parsed.data;
  const { supabase, user } = await requireUser(locale);
  const { error } = await supabase.from("conversation_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body,
  });
  if (error) back(locale, "/" + conversationId + "?result=send-failed");
  back(locale, "/" + conversationId + "?result=sent");
}

export async function changeConversationStatus(formData: FormData) {
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid conversation status.");
  const { locale, conversationId, status } = parsed.data;
  const { supabase } = await requireUser(locale);
  const { error } = await supabase.from("conversations").update({ status }).eq("id", conversationId);
  if (error) back(locale, "/" + conversationId + "?result=status-failed");
  back(locale, "/" + conversationId + "?result=status-updated");
}

export async function markNotificationsRead(formData: FormData) {
  const locale = localeSchema.safeParse(formData.get("locale"));
  if (!locale.success) throw new Error("Invalid locale.");
  const { supabase, user } = await requireUser(locale.data);
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id).is("read_at", null);
  if (error) back(locale.data, "?result=notifications-failed");
  back(locale.data, "?result=notifications-read");
}
