"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

const staffInput = z.object({
  locale: z.string().refine(isLocale),
  profileId: z.string().uuid(),
  role: z.enum(["owner", "admin", "lawyer", "assistant"]),
  status: z.enum(["pending", "active", "suspended"]),
});
const serviceInput = z.object({
  locale: z.string().refine(isLocale),
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titleAr: z.string().trim().min(2).max(160),
  titleEn: z.string().trim().min(2).max(160),
  descriptionAr: z.string().trim().max(2000),
  descriptionEn: z.string().trim().max(2000),
  sortOrder: z.coerce.number().int().min(0).max(10000),
});
const settingInput = z.object({
  locale: z.string().refine(isLocale),
  nameAr: z.string().trim().min(2).max(160),
  nameEn: z.string().trim().min(2).max(160),
  email: z.union([z.literal(""), z.string().email().max(254)]),
  phone: z.string().trim().max(40),
  addressAr: z.string().trim().max(300),
  addressEn: z.string().trim().max(300),
});

async function requireAdministrator(locale: string) {
  if (!isLocale(locale)) redirect("/ar/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);
  const { data: staff } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  if (!staff || staff.status !== "active" || !["owner", "admin"].includes(staff.role)) redirect(`/${locale}/dashboard`);
  return { supabase, user, role: staff.role };
}

function go(locale: "ar" | "en", section: string, state: string) {
  revalidatePath(`/${locale}/dashboard`);
  revalidatePath(`/${locale}/dashboard/${section}`);
  redirect(`/${locale}/dashboard/${section}?result=${state}`);
}

export async function saveStaffMember(formData: FormData) {
  const parsed = staffInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid staff member input.");
  const { locale, profileId, role, status } = parsed.data;
  const { supabase, user, role: actorRole } = await requireAdministrator(locale);
  if (profileId === user.id) go(locale, "staff", "self-protected");
  if (actorRole === "admin" && !["lawyer", "assistant"].includes(role)) go(locale, "staff", "forbidden");
  const { data: existing, error: lookupError } = await supabase.from("staff_members").select("profile_id").eq("profile_id", profileId).maybeSingle();
  if (lookupError) throw new Error("Could not verify the current staff assignment.");
  const values = { role, status, assigned_by: user.id };
  const result = existing
    ? await supabase.from("staff_members").update(values).eq("profile_id", profileId)
    : await supabase.from("staff_members").insert({ profile_id: profileId, ...values });
  if (result.error) go(locale, "staff", "save-failed");
  go(locale, "staff", "saved");
}

export async function saveOfficeService(formData: FormData) {
  const parsed = serviceInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid service input.");
  const { locale, id, slug, titleAr, titleEn, descriptionAr, descriptionEn, sortOrder } = parsed.data;
  const { supabase, user } = await requireAdministrator(locale);
  const values = { slug, title_ar: titleAr, title_en: titleEn, description_ar: descriptionAr, description_en: descriptionEn, sort_order: sortOrder, created_by: user.id };
  const result = id
    ? await supabase.from("office_services").update(values).eq("id", id)
    : await supabase.from("office_services").insert(values);
  if (result.error) go(locale, "services", "save-failed");
  go(locale, "services", "saved");
}

export async function toggleOfficeService(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const id = String(formData.get("id") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!isLocale(locale) || !z.string().uuid().safeParse(id).success) throw new Error("Invalid service reference.");
  const { supabase } = await requireAdministrator(locale);
  const { error } = await supabase.from("office_services").update({ is_published: !published }).eq("id", id);
  if (error) go(locale, "services", "save-failed");
  go(locale, "services", "saved");
}

export async function deleteOfficeService(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!isLocale(locale) || !z.string().uuid().safeParse(id).success) throw new Error("Invalid service reference.");
  const { supabase } = await requireAdministrator(locale);
  const { error } = await supabase.from("office_services").delete().eq("id", id);
  if (error) go(locale, "services", "delete-failed");
  go(locale, "services", "deleted");
}

export async function saveOfficeSettings(formData: FormData) {
  const parsed = settingInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid office settings.");
  const { locale, ...values } = parsed.data;
  const { supabase, user } = await requireAdministrator(locale);
  const { error } = await supabase.from("office_settings").upsert({
    key: "office.profile",
    value: values,
    updated_by: user.id,
  });
  if (error) go(locale, "settings", "save-failed");
  go(locale, "settings", "saved");
}
