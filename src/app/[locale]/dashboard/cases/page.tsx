import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { addCaseEvent, createCase, createDocumentDownloadUrl, updateCaseStatus, uploadCaseDocument } from "./actions";

type Locale="ar"|"en";
const statusLabels:Record<string,{ar:string;en:string}>={
  open:{ar:"مفتوحة",en:"Open"},in_progress:{ar:"قيد العمل",en:"In progress"},
  waiting_for_client:{ar:"بانتظار العميل",en:"Waiting for client"},
  hearing_scheduled:{ar:"جلسة محددة",en:"Hearing scheduled"},closed:{ar:"مغلقة",en:"Closed"}
};
const resultLabels:Record<string,{ar:string;en:string}>={
  created:{ar:"تم إنشاء ملف القضية.",en:"Case created."},
  "save-failed":{ar:"تعذر إنشاء القضية. راجع الصلاحيات وإعدادات قاعدة البيانات.",en:"Could not create the case. Check permissions and database setup."},
  "invalid-assignment":{ar:"اختر عميلًا ومحاميًا/مساعدًا نشطًا صحيحًا.",en:"Choose a valid client and active lawyer/assistant."},
  "event-added":{ar:"تمت إضافة التحديث إلى سجل القضية.",en:"Case timeline updated."},
  "event-failed":{ar:"تعذر إضافة التحديث. قد لا تكون مخولًا للوصول لهذه القضية.",en:"Could not add the update. You may not have access to this case."},
  "status-updated":{ar:"تم تحديث حالة القضية.",en:"Case status updated."},
  "status-failed":{ar:"تعذر تحديث الحالة.",en:"Could not update the case status."},
  "document-uploaded":{ar:"تم رفع المستند بأمان.",en:"Document uploaded securely."},
  "upload-failed":{ar:"تعذر رفع المستند. تحقق من تطبيق ترحيل المرحلة السادسة.",en:"Upload failed. Confirm the Phase 6 migration is applied."},
  "file-invalid":{ar:"الملف غير مدعوم أو يتجاوز 10 ميجابايت.",en:"Unsupported file type or file exceeds 10 MB."},
  "document-unavailable":{ar:"المستند غير متاح أو لا تملك صلاحية الوصول إليه.",en:"Document unavailable or you do not have permission."},
  forbidden:{ar:"ليس لديك صلاحية لهذا الإجراء.",en:"You are not allowed to perform this action."}
};
const statuses=["open","in_progress","waiting_for_client","hearing_scheduled","closed"] as const;
function formatDate(value:string,locale:Locale) {
  return new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Africa/Cairo"}).format(new Date(value));
}
function fieldClass() { return "mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-2.5 text-sm text-[#14263d]"; }

export default async function CasesPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{result?:string}>}) {
  const {locale}=await params; const {result}=await searchParams;
  if(!isLocale(locale)) notFound();
  const ar=locale==="ar"; const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) redirect("/"+locale+"/login");
  const [{data:staff},{data:cases,error:casesError}]=await Promise.all([
    supabase.from("staff_members").select("role,status").eq("profile_id",user.id).maybeSingle(),
    supabase.from("cases").select("id,case_number,title,practice_area,description,status,client_id,assigned_staff_id,created_at,updated_at").order("updated_at",{ascending:false}).limit(100)
  ]);
  const active=staff?.status==="active";
  const admin=active&&["owner","admin"].includes(staff?.role||"");
  const staffCanWork=active&&["owner","admin","lawyer","assistant"].includes(staff?.role||"");
  const caseIds=(cases||[]).map(c=>c.id);
  const [{data:events},{data:documents},{data:profiles},{data:assignments},{data:staffMemberships}] = await Promise.all([
    caseIds.length ? supabase.from("case_events").select("id,case_id,author_id,title,body,is_client_visible,created_at").in("case_id",caseIds).order("created_at",{ascending:false}).limit(300) : Promise.resolve({data:[]}),
    caseIds.length ? supabase.from("case_documents").select("id,case_id,original_name,mime_type,size_bytes,is_client_visible,created_at").in("case_id",caseIds).order("created_at",{ascending:false}).limit(200) : Promise.resolve({data:[]}),
    admin ? supabase.from("profiles").select("id,full_name,email").order("created_at",{ascending:false}).limit(200) : Promise.resolve({data:[]}),
    admin ? supabase.from("staff_members").select("profile_id,role,status").eq("status","active").in("role",["lawyer","assistant"]) : Promise.resolve({data:[]}),
    admin ? supabase.from("staff_members").select("profile_id") : Promise.resolve({data:[]})
  ]);
  const profileById=new Map((profiles||[]).map(p=>[p.id,p]));
  const staffById=new Map((staffMemberships||[]).map(p=>[p.profile_id,true]));
  const t=(ar?{
    heading:"ملفات القضايا",intro:"مساحة عمل خاصة لملفات القضايا، التحديثات، والمستندات المصرح بها.",
    back:"لوحة التحكم",empty:"لا توجد قضايا متاحة لهذا الحساب حتى الآن.",error:"تعذر تحميل القضايا. تأكد من تطبيق ترحيل المرحلة السادسة.",
    create:"إنشاء ملف قضية",title:"عنوان القضية",area:"مجال الممارسة",description:"ملخص ظاهر للعميل",client:"العميل",assignee:"المسؤول عن الملف",createButton:"إنشاء القضية",
    timeline:"سجل القضية",internal:"ملاحظة داخلية",visible:"تحديث ظاهر للعميل",eventTitle:"عنوان التحديث",eventBody:"اكتب التحديث أو الملاحظة",addEvent:"إضافة إلى السجل",
    documents:"المستندات",upload:"رفع مستند",clientDoc:"متاح للعميل",internalDoc:"داخلي للفريق",file:"اختر ملفًا (PDF، JPG، PNG، TXT حتى 10MB)",download:"فتح آمن",status:"الحالة",saveStatus:"تحديث الحالة",clientName:"العميل",assigneeName:"المسؤول",updated:"آخر تحديث",number:"رقم الملف",noEvents:"لا توجد تحديثات بعد.",noDocs:"لا توجد مستندات.",noClients:"لا توجد حسابات عملاء متاحة. أنشئ حساب العميل أولًا من صفحة التسجيل.",
    result:result&&resultLabels[result]?resultLabels[result].ar:""
  }:{
    heading:"Case workspaces",intro:"Confidential case files, timelines, and permission-aware documents in one workspace.",
    back:"Dashboard",empty:"No cases are available to this account yet.",error:"Could not load cases. Confirm the Phase 6 migration is applied.",
    create:"Create a case file",title:"Case title",area:"Practice area",description:"Client-visible summary",client:"Client",assignee:"Assigned staff member",createButton:"Create case",
    timeline:"Case timeline",internal:"Internal note",visible:"Client-visible update",eventTitle:"Update title",eventBody:"Write an update or note",addEvent:"Add to timeline",
    documents:"Documents",upload:"Upload document",clientDoc:"Visible to client",internalDoc:"Internal to staff",file:"Choose file (PDF, JPG, PNG, TXT up to 10MB)",download:"Secure open",status:"Status",saveStatus:"Update status",clientName:"Client",assigneeName:"Assigned to",updated:"Updated",number:"Case number",noEvents:"No updates yet.",noDocs:"No documents.",noClients:"No client accounts available. Register a client account first.",
    result:result&&resultLabels[result]?resultLabels[result].en:""
  });
  const label=(key:string)=>statusLabels[key]?.[locale as Locale]||key;
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar?"rtl":"ltr"}><div className="mx-auto max-w-6xl">
    <Link href={"/"+locale+"/dashboard"} className="text-sm font-bold text-[#176b67] hover:underline">← {t.back}</Link>
    <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / CASE WORKSPACE</p>
    <h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{t.heading}</h1><p className="mt-3 max-w-3xl leading-7 text-[#657184]">{t.intro}</p>
    {result&&t.result&&<p role="status" className="mt-5 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{t.result}</p>}
    {casesError&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{t.error}</p>}
    {admin&&<section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7"><h2 className="text-xl font-black text-[#14263d]">{t.create}</h2>{(profiles||[]).filter(p=>!staffById.has(p.id)).length===0&&<p className="mt-3 text-sm text-[#657184]">{t.noClients}</p>}
      <form action={createCase} className="mt-5 grid gap-4 sm:grid-cols-2"><input type="hidden" name="locale" value={locale}/>
        <label className="text-sm font-bold text-[#14263d]">{t.title}<input name="title" required minLength={3} maxLength={180} className={fieldClass()}/></label>
        <label className="text-sm font-bold text-[#14263d]">{t.area}<input name="practiceArea" maxLength={120} className={fieldClass()}/></label>
        <label className="text-sm font-bold text-[#14263d]">{t.client}<select name="clientId" required className={fieldClass()} defaultValue=""><option value="" disabled>—</option>{(profiles||[]).filter(p=>!staffById.has(p.id)).map(p=><option key={p.id} value={p.id}>{p.full_name||p.email||p.id}</option>)}</select></label>
        <label className="text-sm font-bold text-[#14263d]">{t.assignee}<select name="assignedStaffId" required className={fieldClass()} defaultValue=""><option value="" disabled>—</option>{(assignments||[]).map(p=><option key={p.profile_id} value={p.profile_id}>{profileById.get(p.profile_id)?.full_name||profileById.get(p.profile_id)?.email||p.profile_id} ({p.role})</option>)}</select></label>
        <label className="text-sm font-bold text-[#14263d] sm:col-span-2">{t.description}<textarea name="description" maxLength={4000} rows={3} className={fieldClass()}/></label>
        <div className="sm:col-span-2"><button className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white hover:bg-[#176b67]">{t.createButton}</button></div>
      </form>
    </section>}
    {!casesError&&(cases||[]).length===0?<section className="mt-8 rounded-2xl border border-dashed border-[#14263d]/20 bg-white p-10 text-center text-[#657184]">{t.empty}</section>:<div className="mt-8 grid gap-5">
      {(cases||[]).map(c=>{
        const caseEvents=(events||[]).filter(e=>e.case_id===c.id);
        const caseDocuments=(documents||[]).filter(d=>d.case_id===c.id);
        const canEdit=staffCanWork&&(admin||c.assigned_staff_id===user.id);
        const canChangeStatus=active&&["owner","admin","lawyer"].includes(staff?.role||"")&&(admin||c.assigned_staff_id===user.id);
        return <article key={c.id} className="overflow-hidden rounded-2xl border border-[#14263d]/10 bg-white">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#14263d]/10 p-5 sm:p-7"><div><p className="text-xs font-black tracking-widest text-[#b99a62]">{c.case_number}</p><h2 className="mt-2 text-xl font-black text-[#14263d]">{c.title}</h2><p className="mt-2 text-sm text-[#657184]">{c.practice_area||"—"} · {formatDate(c.updated_at,locale as Locale)}</p><p className="mt-2 text-sm leading-6 text-[#657184]">{c.description}</p></div><span className="rounded-full bg-[#176b67]/10 px-3 py-2 text-sm font-bold text-[#176b67]">{label(c.status)}</span></header>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
            <section><h3 className="font-black text-[#14263d]">{t.timeline}</h3>{caseEvents.length===0?<p className="mt-3 text-sm text-[#657184]">{t.noEvents}</p>:<ol className="mt-4 space-y-4 border-s-2 border-[#176b67]/20 ps-4">{caseEvents.map(e=><li key={e.id} className="relative"><p className="font-bold text-[#14263d]">{e.title}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#657184]">{e.body}</p><p className="mt-1 text-xs text-[#8a93a1]">{formatDate(e.created_at,locale as Locale)}{!e.is_client_visible&&<span className="ms-2 rounded bg-amber-50 px-2 py-1 text-amber-800">{t.internal}</span>}</p></li>)}</ol>}
              {canEdit&&<form action={addCaseEvent} className="mt-5 grid gap-3 rounded-xl bg-[#f7f4ed] p-4"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><input name="title" required minLength={2} maxLength={160} placeholder={t.eventTitle} className={fieldClass()}/><textarea name="body" required minLength={1} maxLength={4000} rows={3} placeholder={t.eventBody} className={fieldClass()}/><label className="text-sm font-semibold text-[#14263d]"><select name="visibility" className={fieldClass()}><option value="client">{t.visible}</option><option value="internal">{t.internal}</option></select></label><button className="rounded-xl bg-[#176b67] px-4 py-2.5 text-sm font-bold text-white">{t.addEvent}</button></form>}
            </section>
            <section><h3 className="font-black text-[#14263d]">{t.documents}</h3>{caseDocuments.length===0?<p className="mt-3 text-sm text-[#657184]">{t.noDocs}</p>:<ul className="mt-4 space-y-3">{caseDocuments.map(d=><li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#14263d]/10 p-3"><div><p className="break-all text-sm font-bold text-[#14263d]">{d.original_name}</p><p className="mt-1 text-xs text-[#657184]">{Math.ceil(d.size_bytes/1024)} KB · {formatDate(d.created_at,locale as Locale)} · {d.is_client_visible?t.clientDoc:t.internalDoc}</p></div><form action={createDocumentDownloadUrl}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="documentId" value={d.id}/><button className="rounded-lg border border-[#176b67]/30 px-3 py-2 text-xs font-bold text-[#176b67]">{t.download}</button></form></li>)}</ul>}
              {canEdit&&<form action={uploadCaseDocument} encType="multipart/form-data" className="mt-5 grid gap-3 rounded-xl bg-[#f7f4ed] p-4"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><label className="text-sm font-semibold text-[#14263d]">{t.file}<input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/jpeg,image/png,text/plain" className="mt-2 block w-full text-sm"/></label><select name="visibility" className={fieldClass()}><option value="internal">{t.internalDoc}</option><option value="client">{t.clientDoc}</option></select><button className="rounded-xl bg-[#14263d] px-4 py-2.5 text-sm font-bold text-white">{t.upload}</button></form>}
              {canChangeStatus&&<form action={updateCaseStatus} className="mt-4 flex flex-wrap items-center gap-3"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><label className="min-w-0 flex-1 text-sm font-semibold text-[#14263d]">{t.status}<select name="status" defaultValue={c.status} className={fieldClass()}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label><button className="mt-5 rounded-xl border border-[#14263d]/15 px-4 py-2.5 text-sm font-bold text-[#14263d]">{t.saveStatus}</button></form>}
            </section>
          </div>
        </article>;
      })}
    </div>}
    <div className="mt-8"><Link href={"/"+locale+"/dashboard"} className="font-bold text-[#176b67] hover:underline">← {t.back}</Link></div>
  </div></main>;
}
