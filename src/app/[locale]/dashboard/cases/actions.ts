"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";

const localeSchema = z.enum(["ar","en"]);
const createSchema = z.object({
  locale: localeSchema,
  title: z.string().trim().min(3).max(180),
  practiceArea: z.string().trim().max(120),
  description: z.string().trim().max(4000),
  clientId: z.string().uuid(),
  assignedStaffId: z.string().uuid(),
});
const eventSchema = z.object({
  locale: localeSchema, caseId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(4000),
  visibility: z.enum(["client","internal"]),
});
const statusSchema = z.object({
  locale: localeSchema, caseId: z.string().uuid(),
  status: z.enum(["open","in_progress","waiting_for_client","hearing_scheduled","closed"]),
});
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf","image/jpeg","image/png","text/plain"]);
const EXTENSIONS: Record<string,string> = {
  "application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","text/plain":"txt"
};

async function requireUser(localeValue: string) {
  if (!isLocale(localeValue)) redirect("/ar/login");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/"+localeValue+"/login");
  const { data: staff } = await supabase.from("staff_members").select("role,status").eq("profile_id",user.id).maybeSingle();
  return { supabase,user,staff,locale:localeValue };
}
function finish(locale:"ar"|"en",result:string):never {
  revalidatePath("/"+locale+"/dashboard");
  revalidatePath("/"+locale+"/dashboard/cases");
  redirect("/"+locale+"/dashboard/cases?result="+encodeURIComponent(result));
}
function activeStaff(staff:{role:string;status:string}|null,roles:string[]) {
  return !!staff && staff.status==="active" && roles.includes(staff.role);
}

export async function createCase(formData:FormData) {
  const parsed=createSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) throw new Error("Invalid case input.");
  const {locale,title,practiceArea,description,clientId,assignedStaffId}=parsed.data;
  const {supabase,user,staff}=await requireUser(locale);
  if(!activeStaff(staff,["owner","admin"])) finish(locale,"forbidden");
  const {data:client,error:clientError}=await supabase.from("profiles").select("id").eq("id",clientId).maybeSingle();
  const {data:assignment,error:staffError}=await supabase.from("staff_members").select("profile_id,role,status").eq("profile_id",assignedStaffId).maybeSingle();
  if(clientError||staffError||!client||!assignment||assignment.status!=="active"||!["lawyer","assistant"].includes(assignment.role)) finish(locale,"invalid-assignment");
  const caseNumber="MZN-"+new Date().getFullYear()+"-"+randomUUID().slice(0,8).toUpperCase();
  const {error}=await supabase.from("cases").insert({
    case_number:caseNumber,title,practice_area:practiceArea,description,status:"open",
    client_id:clientId,assigned_staff_id:assignedStaffId,created_by:user.id
  });
  if(error) finish(locale,"save-failed");
  finish(locale,"created");
}

export async function addCaseEvent(formData:FormData) {
  const parsed=eventSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) throw new Error("Invalid case update.");
  const {locale,caseId,title,body,visibility}=parsed.data;
  const {supabase,user,staff}=await requireUser(locale);
  if(!activeStaff(staff,["owner","admin","lawyer","assistant"])) finish(locale,"forbidden");
  const {error}=await supabase.from("case_events").insert({
    case_id:caseId,author_id:user.id,title,body,is_client_visible:visibility==="client"
  });
  if(error) finish(locale,"event-failed");
  finish(locale,"event-added");
}

export async function updateCaseStatus(formData:FormData) {
  const parsed=statusSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) throw new Error("Invalid case status.");
  const {locale,caseId,status}=parsed.data;
  const {supabase,staff}=await requireUser(locale);
  if(!activeStaff(staff,["owner","admin","lawyer"])) finish(locale,"forbidden");
  const {error}=await supabase.from("cases").update({status}).eq("id",caseId);
  if(error) finish(locale,"status-failed");
  finish(locale,"status-updated");
}

export async function uploadCaseDocument(formData:FormData) {
  const locale=String(formData.get("locale")||"");
  const caseId=String(formData.get("caseId")||"");
  const visibility=String(formData.get("visibility")||"internal");
  const raw=formData.get("file");
  if(!isLocale(locale)||!z.string().uuid().safeParse(caseId).success||!["client","internal"].includes(visibility)||!(raw instanceof File)) throw new Error("Invalid document upload.");
  const {supabase,user,staff}=await requireUser(locale);
  if(!activeStaff(staff,["owner","admin","lawyer","assistant"])) finish(locale,"forbidden");
  if(raw.size<1||raw.size>MAX_FILE_SIZE||!ALLOWED_TYPES.has(raw.type)) finish(locale,"file-invalid");
  const bytes=Buffer.from(await raw.arrayBuffer());
  const validSignature =
    (raw.type==="application/pdf" && bytes.subarray(0,5).toString("ascii")==="%PDF-") ||
    (raw.type==="image/jpeg" && bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) ||
    (raw.type==="image/png" && bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) ||
    (raw.type==="text/plain" && !bytes.includes(0));
  if(!validSignature) finish(locale,"file-invalid");
  const {data:caseRow,error:caseError}=await supabase.from("cases").select("id").eq("id",caseId).maybeSingle();
  if(caseError||!caseRow) finish(locale,"upload-failed");
  const extension=EXTENSIONS[raw.type];
  const storagePath=caseId+"/"+randomUUID()+"."+extension;
  const {error:storageError}=await supabase.storage.from("case-files").upload(storagePath,bytes,{
    contentType:raw.type,upsert:false,cacheControl:"0"
  });
  if(storageError) finish(locale,"upload-failed");
  const safeName=raw.name.replace(/[\\/\u0000-\u001f]/g,"_").slice(0,180)||("document."+extension);
  const {error:metadataError}=await supabase.from("case_documents").insert({
    case_id:caseId,uploaded_by:user.id,original_name:safeName,storage_path:storagePath,
    mime_type:raw.type,size_bytes:raw.size,is_client_visible:visibility==="client"
  });
  if(metadataError) {
    await supabase.storage.from("case-files").remove([storagePath]);
    finish(locale,"upload-failed");
  }
  finish(locale,"document-uploaded");
}

export async function createDocumentDownloadUrl(formData:FormData) {
  const locale=String(formData.get("locale")||"");
  const documentId=String(formData.get("documentId")||"");
  if(!isLocale(locale)||!z.string().uuid().safeParse(documentId).success) throw new Error("Invalid document reference.");
  const {supabase}=await requireUser(locale);
  const {data:document,error}=await supabase.from("case_documents").select("storage_path").eq("id",documentId).maybeSingle();
  if(error||!document) finish(locale,"document-unavailable");
  const {data,error:signError}=await supabase.storage.from("case-files").createSignedUrl(document.storage_path,60);
  if(signError||!data?.signedUrl) finish(locale,"document-unavailable");
  redirect(data.signedUrl);
}
