"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

const L = z.enum(["ar", "en"]);
const weeklySchema = z.object({
  locale: L, weekday: z.coerce.number().int().min(0).max(6),
  isAvailable: z.enum(["true", "false"]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});
const exceptionSchema = z.object({
  locale: L, exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.enum(["true", "false"]),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  note: z.string().trim().max(240).optional(),
});
const bookingSchema = z.object({
  locale: L, lawyerId: z.string().uuid(), serviceId: z.union([z.literal(""), z.string().uuid()]),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  clientMessage: z.string().trim().max(1200),
});
const decisionSchema = z.object({
  locale: L, appointmentId: z.string().uuid(),
  status: z.enum(["approved", "confirmed", "cancelled", "rejected", "completed"]),
});

async function requireUser(locale: string) {
  if (!isLocale(locale)) redirect("/ar/login");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/" + locale + "/login");
  const { data: staff } = await supabase.from("staff_members").select("role,status").eq("profile_id", user.id).maybeSingle();
  return { supabase, user, staff };
}
function finish(locale: "ar" | "en", result: string): never {
  revalidatePath("/" + locale + "/dashboard");
  revalidatePath("/" + locale + "/dashboard/appointments");
  redirect("/" + locale + "/dashboard/appointments?result=" + result);
}
function activeStaff(staff: {role:string;status:string}|null, roles:string[]) {
  return !!staff && staff.status === "active" && roles.includes(staff.role);
}
function cairoLocalToIso(date: string, time: string): string {
  const dateParts = date.split("-").map(Number);
  const timeParts = time.split(":").map(Number);
  const target = Date.UTC(dateParts[0], dateParts[1]-1, dateParts[2], timeParts[0], timeParts[1], 0);
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-GB", {timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  for (let i=0;i<3;i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(guess)).map((part)=>[part.type,part.value]));
    const shown = Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second));
    guess += target-shown;
  }
  return new Date(guess).toISOString();
}

export async function saveWeeklyAvailability(formData: FormData) {
  const parsed = weeklySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid weekly availability.");
  const {locale,weekday,isAvailable,startTime,endTime} = parsed.data;
  const {supabase,user,staff} = await requireUser(locale);
  if (!activeStaff(staff,["lawyer"])) redirect("/"+locale+"/dashboard");
  if (isAvailable === "true" && (!startTime || !endTime || startTime >= endTime)) finish(locale,"invalid-hours");
  const {error} = await supabase.from("lawyer_availability").upsert({
    lawyer_id:user.id, weekday, is_available:isAvailable === "true",
    start_time:isAvailable === "true" ? startTime : "00:00",
    end_time:isAvailable === "true" ? endTime : "23:59",
  },{onConflict:"lawyer_id,weekday"});
  if (error) finish(locale,"availability-failed");
  finish(locale,"availability-saved");
}

export async function saveAvailabilityException(formData: FormData) {
  const parsed = exceptionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid availability exception.");
  const {locale,exceptionDate,isAvailable,startTime,endTime,note} = parsed.data;
  const {supabase,user,staff} = await requireUser(locale);
  if (!activeStaff(staff,["lawyer"])) redirect("/"+locale+"/dashboard");
  if (isAvailable === "true" && (!startTime || !endTime || startTime >= endTime)) finish(locale,"invalid-hours");
  const {error} = await supabase.from("lawyer_availability_exceptions").upsert({
    lawyer_id:user.id, exception_date:exceptionDate, is_available:isAvailable === "true",
    start_time:isAvailable === "true" ? startTime : null,
    end_time:isAvailable === "true" ? endTime : null, note:note || "", created_by:user.id,
  },{onConflict:"lawyer_id,exception_date"});
  if (error) finish(locale,"exception-failed");
  finish(locale,"exception-saved");
}

export async function deleteAvailabilityException(formData: FormData) {
  const locale = String(formData.get("locale") || "");
  const id = String(formData.get("exceptionId") || "");
  if (!isLocale(locale) || !z.string().uuid().safeParse(id).success) throw new Error("Invalid exception reference.");
  const {supabase,user,staff} = await requireUser(locale);
  if (!activeStaff(staff,["lawyer"])) redirect("/"+locale+"/dashboard");
  const {error} = await supabase.from("lawyer_availability_exceptions").delete().eq("id",id).eq("lawyer_id",user.id);
  if (error) finish(locale,"exception-failed");
  finish(locale,"exception-deleted");
}

export async function requestAppointment(formData: FormData) {
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid appointment request.");
  const {locale,lawyerId,serviceId,appointmentDate,appointmentTime,clientMessage} = parsed.data;
  const {supabase,user,staff} = await requireUser(locale);
  if (staff) finish(locale,"client-account-required");
  const cairoTodayParts = new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const todayMap = Object.fromEntries(cairoTodayParts.map((part)=>[part.type,part.value]));
  const today = todayMap.year + "-" + todayMap.month + "-" + todayMap.day;
  if (appointmentDate < today) finish(locale,"date-past");
  const startsAt = cairoLocalToIso(appointmentDate,appointmentTime);
  const endsAt = new Date(new Date(startsAt).getTime()+30*60*1000).toISOString();
  const {data:lawyer,error:lawyerError} = await supabase.from("staff_members").select("profile_id").eq("profile_id",lawyerId).eq("role","lawyer").eq("status","active").maybeSingle();
  if (lawyerError || !lawyer) finish(locale,"lawyer-unavailable");
  const payload: Record<string,string> = {client_id:user.id,lawyer_id:lawyerId,starts_at:startsAt,ends_at:endsAt,status:"requested",client_message:clientMessage};
  if (serviceId) payload.service_id = serviceId;
  const {error} = await supabase.from("appointments").insert(payload);
  if (error) finish(locale,error.code === "23P01" ? "slot-taken" : "booking-failed");
  finish(locale,"booking-sent");
}

export async function updateAppointmentStatus(formData: FormData) {
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid appointment decision.");
  const {locale,appointmentId,status} = parsed.data;
  const {supabase,user,staff} = await requireUser(locale);
  const admin = activeStaff(staff,["owner","admin"]);
  const lawyer = activeStaff(staff,["lawyer"]);
  if (!admin && !lawyer) {
    if (status !== "cancelled") finish(locale,"forbidden");
    const {data:appointment} = await supabase.from("appointments").select("id,starts_at,status").eq("id",appointmentId).eq("client_id",user.id).maybeSingle();
    if (!appointment || !["requested","approved","confirmed"].includes(appointment.status) || new Date(appointment.starts_at) <= new Date()) finish(locale,"transition-invalid");
    const {error} = await supabase.from("appointments").update({status:"cancelled"}).eq("id",appointmentId).eq("client_id",user.id);
    if (error) finish(locale,"decision-failed");
    finish(locale,"appointment-cancelled");
  }
  const {data:appointment,error:lookupError} = await supabase.from("appointments").select("id,lawyer_id,status,starts_at").eq("id",appointmentId).maybeSingle();
  if (lookupError || !appointment || (lawyer && appointment.lawyer_id !== user.id)) finish(locale,"forbidden");
  const allowed: Record<string,string[]> = {
    requested:["approved","rejected","cancelled"], approved:["confirmed","cancelled"], confirmed:["completed","cancelled"],
  };
  if (!allowed[appointment.status]?.includes(status)) finish(locale,"transition-invalid");
  const {error} = await supabase.from("appointments").update({status}).eq("id",appointmentId);
  if (error) finish(locale,error.code === "23P01" ? "slot-taken" : "decision-failed");
  finish(locale,"decision-saved");
}
