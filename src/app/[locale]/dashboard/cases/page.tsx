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
  return <main className="mizan-dashboard-page min-h-screen bg-[#f4f6f3] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar?"rtl":"ltr"}>
    <div className="mx-auto max-w-7xl">
      <nav className="mizan-dashboard-page-nav mb-7" aria-label={ar?"التنقل داخل لوحة التحكم":"Dashboard navigation"}>
        <Link href={"/"+locale+"/dashboard"}>⌂ <span>{ar?"لوحة التحكم":"Overview"}</span></Link>
        <Link href={"/"+locale+"/dashboard/cases"} aria-current="page">▤ <span>{ar?"ملفات القضايا":"Cases"}</span></Link>
        <Link href={"/"+locale+"/dashboard/appointments"}>▦ <span>{ar?"المواعيد":"Appointments"}</span></Link>
        <Link href={"/"+locale+"/dashboard/conversations"}>◌ <span>{ar?"المحادثات":"Messages"}</span></Link>
        {["owner","admin"].includes(String(staff?.role||""))&&<><Link href={"/"+locale+"/dashboard/staff"}>♙ <span>{ar?"المستخدمون":"Staff"}</span></Link><Link href={"/"+locale+"/dashboard/services"}>⚖ <span>{ar?"الخدمات":"Services"}</span></Link><Link href={"/"+locale+"/dashboard/settings"}>⚙ <span>{ar?"الإعدادات":"Settings"}</span></Link><Link href={"/"+locale+"/dashboard/audit"}>◷ <span>{ar?"سجل التدقيق":"Audit log"}</span></Link></>}
      </nav>

      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#142b3a] px-5 py-7 text-white shadow-[0_18px_55px_rgba(20,43,58,.13)] sm:px-8 sm:py-9 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -end-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -end-4 -top-12 h-52 w-52 rounded-full border border-[#c8aa72]/25" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 end-1/3 h-px w-64 bg-gradient-to-r from-transparent via-[#c8aa72]/70 to-transparent" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <Link href={"/"+locale+"/dashboard"} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:bg-white/10">← {t.back}</Link>
            <p className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.24em] text-[#d9c08e]"><span className="h-1.5 w-1.5 rounded-full bg-[#d9c08e]" /> MIZAN / LEGAL OPERATIONS</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{t.heading}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/65 sm:text-base">{t.intro}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <span className="text-xs text-white/60">{ar?"إجمالي الملفات المعروضة":"Cases in view"}</span>
              <p className="mt-2 text-3xl font-bold tabular-nums">{(cases||[]).length.toLocaleString(ar?"ar-EG":"en-US")}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur-sm">
              <span className="text-xs text-white/60">{ar?"قيد المتابعة":"In progress"}</span>
              <p className="mt-2 text-3xl font-bold tabular-nums">{(cases||[]).filter(c=>c.status==="in_progress"||c.status==="hearing_scheduled").length.toLocaleString(ar?"ar-EG":"en-US")}</p>
            </div>
          </div>
        </div>
      </section>

      {result&&t.result&&<div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#176b67]/20 bg-white px-4 py-4 text-sm font-semibold text-[#176b67] shadow-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#176b67]/10">✓</span><span className="pt-1">{t.result}</span></div>}
      {casesError&&<p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t.error}</p>}

      {admin&&<section className="mt-7 overflow-hidden rounded-[24px] border border-[#dfe6e0] bg-white shadow-[0_8px_28px_rgba(20,43,58,.04)]">
        <div className="flex flex-col gap-3 border-b border-[#edf0ec] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl text-[#176b67]">＋</span><div><h2 className="text-lg font-extrabold text-[#142b3a]">{t.create}</h2><p className="mt-1 text-xs text-[#77847f]">{ar?"أضف ملفًا جديدًا وحدد أطراف القضية والمسؤول عنها.":"Create a workspace and assign its client and owner."}</p></div></div>
          <span className="w-fit rounded-full bg-[#f5f0e5] px-3 py-1.5 text-[11px] font-bold text-[#8a6c35]">{ar?"للمالك والإدارة فقط":"ADMIN ACCESS"}</span>
        </div>
        <div className="p-5 sm:p-7">
          {(profiles||[]).filter(p=>!staffById.has(p.id)).length===0&&<p className="mb-4 rounded-xl bg-[#f6f8f5] p-3 text-sm text-[#65756f]">{t.noClients}</p>}
          <form action={createCase} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="locale" value={locale}/>
            <label className="block text-sm font-bold text-[#263c47]">{t.title}<input name="title" required minLength={3} maxLength={180} placeholder={ar?"مثال: نزاع تجاري — شركة النور": "e.g. Commercial dispute — Al Noor Co."} className={fieldClass()+" mt-2 rounded-xl border-[#dce4df] bg-[#fbfcfa] px-4 py-3 transition focus:border-[#176b67] focus:outline-none focus:ring-4 focus:ring-[#176b67]/10"}/></label>
            <label className="block text-sm font-bold text-[#263c47]">{t.area}<input name="practiceArea" maxLength={120} placeholder={ar?"قانون تجاري، أسرة، مدني...":"Corporate, family, civil..."} className={fieldClass()+" mt-2 rounded-xl border-[#dce4df] bg-[#fbfcfa] px-4 py-3 transition focus:border-[#176b67] focus:outline-none focus:ring-4 focus:ring-[#176b67]/10"}/></label>
            <label className="block text-sm font-bold text-[#263c47]">{t.client}<select name="clientId" required className={fieldClass()+" mt-2 rounded-xl border-[#dce4df] bg-[#fbfcfa] px-4 py-3"} defaultValue=""><option value="" disabled>—</option>{(profiles||[]).filter(p=>!staffById.has(p.id)).map(p=><option key={p.id} value={p.id}>{p.full_name||p.email||p.id}</option>)}</select></label>
            <label className="block text-sm font-bold text-[#263c47]">{t.assignee}<select name="assignedStaffId" required className={fieldClass()+" mt-2 rounded-xl border-[#dce4df] bg-[#fbfcfa] px-4 py-3"} defaultValue=""><option value="" disabled>—</option>{(assignments||[]).map(p=><option key={p.profile_id} value={p.profile_id}>{profileById.get(p.profile_id)?.full_name||profileById.get(p.profile_id)?.email||p.profile_id} ({p.role})</option>)}</select></label>
            <label className="block text-sm font-bold text-[#263c47] sm:col-span-2">{t.description}<textarea name="description" maxLength={4000} rows={3} placeholder={ar?"ملخص واضح يمكن للعميل الاطلاع عليه...":"A concise summary that the client can see..."} className={fieldClass()+" mt-2 rounded-xl border-[#dce4df] bg-[#fbfcfa] px-4 py-3 transition focus:border-[#176b67] focus:outline-none focus:ring-4 focus:ring-[#176b67]/10"}/></label>
            <div className="sm:col-span-2"><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#176b67] px-5 py-3 text-sm font-bold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#125653] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#176b67]/20">{t.createButton}<span aria-hidden="true">↗</span></button></div>
          </form>
        </div>
      </section>}

      <div className="mb-4 mt-8 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-[#a1844e]">{ar?"مساحة العمل":"WORKSPACE"}</p><h2 className="mt-1 text-xl font-extrabold text-[#142b3a] sm:text-2xl">{ar?"ملفات القضايا":"Case files"} <span className="ms-2 align-middle rounded-full bg-[#e5eee8] px-2.5 py-1 text-xs font-bold text-[#176b67]">{(cases||[]).length}</span></h2></div>
        <p className="text-xs text-[#78857f]">{ar?"مرتبة حسب آخر تحديث":"Sorted by latest update"} <span className="mx-1">·</span> {ar?"حتى 100 ملف":"Up to 100 files"}</p>
      </div>

      {!casesError&&(cases||[]).length===0?<section className="rounded-[24px] border border-dashed border-[#cbd8cf] bg-white px-6 py-14 text-center shadow-sm"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf4ef] text-3xl text-[#176b67]">§</span><h3 className="mt-5 text-lg font-extrabold text-[#142b3a]">{t.empty}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#7a8781]">{ar?"ستظهر هنا ملفات القضايا التي يمكنك الوصول إليها، مع سجل التحديثات والمستندات المرتبطة بكل ملف.":"Cases you can access will appear here with their timelines and related documents."}</p></section>:<div className="grid gap-5">
        {(cases||[]).map(c=>{
          const caseEvents=(events||[]).filter(e=>e.case_id===c.id);
          const caseDocuments=(documents||[]).filter(d=>d.case_id===c.id);
          const canEdit=staffCanWork&&(admin||c.assigned_staff_id===user.id);
          const canChangeStatus=active&&["owner","admin","lawyer"].includes(staff?.role||"")&&(admin||c.assigned_staff_id===user.id);
          return <article key={c.id} className="group overflow-hidden rounded-[24px] border border-[#dfe6e0] bg-white shadow-[0_5px_22px_rgba(20,43,58,.035)] transition duration-300 hover:border-[#b8cec1] hover:shadow-[0_14px_36px_rgba(20,43,58,.075)]">
            <header className="relative overflow-hidden border-b border-[#edf0ec] bg-gradient-to-br from-white via-white to-[#f4f8f4] px-5 py-5 sm:px-7 sm:py-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-2 rounded-lg bg-[#edf4ef] px-2.5 py-1.5 text-[11px] font-extrabold tracking-wide text-[#176b67]"><span aria-hidden="true">§</span>{c.case_number}</span><span className="text-xs text-[#88928c]">{ar?"آخر تحديث":"Updated"} · {formatDate(c.updated_at,locale as Locale)}</span></div>
                  <h3 className="mt-3 break-words text-xl font-extrabold leading-snug text-[#142b3a] sm:text-2xl">{c.title}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#697a73]">{c.practice_area&&<span className="rounded-full border border-[#e2e9e3] bg-white px-3 py-1">{c.practice_area}</span>}<span className="text-xs">{ar?"أُنشئت":"Created"} {formatDate(c.created_at,locale as Locale)}</span></div>
                  {c.description&&<p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#6c7a74]">{c.description}</p>}
                </div>
                <span className={"inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-extrabold "+(c.status==="closed"?"border-slate-200 bg-slate-100 text-slate-600":c.status==="waiting_for_client"?"border-amber-200 bg-amber-50 text-amber-800":c.status==="hearing_scheduled"?"border-violet-200 bg-violet-50 text-violet-700":"border-[#c8e1d2] bg-[#eaf5ee] text-[#176b67]")}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label(c.status)}</span>
              </div>
            </header>
            <div className="grid gap-0 lg:grid-cols-2">
              <section className="min-w-0 px-5 py-6 sm:px-7">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf4ef] text-lg text-[#176b67]">↳</span><div><h4 className="font-extrabold text-[#142b3a]">{t.timeline}</h4><p className="mt-0.5 text-xs text-[#829088]">{caseEvents.length} {ar?"تحديث":"updates"}</p></div></div><span className="text-[10px] font-bold uppercase tracking-widest text-[#a1844e]">TIMELINE</span></div>
                {caseEvents.length===0?<div className="mt-5 rounded-2xl border border-dashed border-[#dce5de] bg-[#fafcf9] px-4 py-6 text-center"><span className="text-xl text-[#9aa9a0]">◷</span><p className="mt-2 text-sm text-[#829088]">{t.noEvents}</p></div>:<ol className="mt-5 space-y-5 border-s-2 border-[#d7e8dc] ps-5">{caseEvents.map(e=><li key={e.id} className="relative before:absolute before:-start-[26px] before:top-1.5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-white before:bg-[#176b67] before:shadow-[0_0_0_2px_#d7e8dc]"><p className="break-words font-bold leading-6 text-[#263c47]">{e.title}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[#718078]">{e.body}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-[#89958e]"><time>{formatDate(e.created_at,locale as Locale)}</time>{!e.is_client_visible&&<span className="rounded-md bg-amber-50 px-2 py-1 font-bold text-amber-800">{t.internal}</span>}</div></li>)}</ol>}
                {canEdit&&<form action={addCaseEvent} className="mt-5 grid gap-3 rounded-2xl border border-[#e5ebe5] bg-[#f8faf7] p-4"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><label className="text-xs font-bold text-[#52645b]">{t.eventTitle}<input name="title" required minLength={2} maxLength={160} placeholder={ar?"عنوان مختصر للتحديث":"Short update title"} className={fieldClass()+" mt-1.5 rounded-xl border-[#dce4df] bg-white px-3 py-3"}/></label><label className="text-xs font-bold text-[#52645b]">{t.eventBody}<textarea name="body" required minLength={1} maxLength={4000} rows={3} placeholder={t.eventBody} className={fieldClass()+" mt-1.5 rounded-xl border-[#dce4df] bg-white px-3 py-3"}/></label><label className="text-xs font-bold text-[#52645b]">{ar?"مستوى الظهور":"Visibility"}<select name="visibility" className={fieldClass()+" mt-1.5 rounded-xl border-[#dce4df] bg-white px-3 py-3"}><option value="client">{t.visible}</option><option value="internal">{t.internal}</option></select></label><button className="rounded-xl bg-[#176b67] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#125653] focus:outline-none focus:ring-4 focus:ring-[#176b67]/15">{t.addEvent} <span aria-hidden="true">↗</span></button></form>}
              </section>
              <section className="min-w-0 border-t border-[#edf0ec] bg-[#fcfdfb] px-5 py-6 sm:px-7 lg:border-s lg:border-t-0">
                <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f0e5] text-lg text-[#98783f]">▤</span><div><h4 className="font-extrabold text-[#142b3a]">{t.documents}</h4><p className="mt-0.5 text-xs text-[#829088]">{caseDocuments.length} {ar?"مستند":"documents"}</p></div></div><span className="text-[10px] font-bold uppercase tracking-widest text-[#a1844e]">SECURE FILES</span></div>
                {caseDocuments.length===0?<div className="mt-5 rounded-2xl border border-dashed border-[#e4e5da] bg-white px-4 py-6 text-center"><span className="text-xl text-[#b7a579]">▤</span><p className="mt-2 text-sm text-[#829088]">{t.noDocs}</p></div>:<ul className="mt-5 space-y-2.5">{caseDocuments.map(d=><li key={d.id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-[#e6ebe5] bg-white p-3.5 transition hover:border-[#c7d9cc] sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f5f1] text-xs font-black text-[#61736a]">{d.mime_type?.includes("pdf")?"PDF":d.mime_type?.includes("image")?"IMG":"TXT"}</span><div className="min-w-0"><p className="break-all text-sm font-bold leading-5 text-[#263c47]">{d.original_name}</p><p className="mt-1 text-[11px] leading-5 text-[#849087]">{Math.ceil(d.size_bytes/1024)} KB · {formatDate(d.created_at,locale as Locale)}</p><span className={"mt-1 inline-block rounded-md px-2 py-1 text-[10px] font-bold "+(d.is_client_visible?"bg-[#eaf5ee] text-[#176b67]":"bg-amber-50 text-amber-800")}>{d.is_client_visible?t.clientDoc:t.internalDoc}</span></div></div><form action={createDocumentDownloadUrl} className="shrink-0"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="documentId" value={d.id}/><button className="w-full rounded-xl border border-[#b8d1c0] bg-white px-3 py-2.5 text-xs font-bold text-[#176b67] transition hover:bg-[#edf5ef] sm:w-auto">{t.download} ↗</button></form></li>)}</ul>}
                {canEdit&&<form action={uploadCaseDocument} encType="multipart/form-data" className="mt-5 grid gap-3 rounded-2xl border border-dashed border-[#cbd9ce] bg-white p-4"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><label className="text-xs font-bold leading-6 text-[#52645b]">{t.file}<input type="file" name="file" required accept=".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/jpeg,image/png,text/plain" className="mt-2 block w-full cursor-pointer rounded-xl border border-[#e0e7e0] bg-[#fafcf9] p-2.5 text-xs text-[#52645b] file:me-3 file:rounded-lg file:border-0 file:bg-[#eaf3ed] file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#176b67]"/></label><label className="text-xs font-bold text-[#52645b]">{ar?"مستوى الظهور":"Visibility"}<select name="visibility" className={fieldClass()+" mt-1.5 rounded-xl border-[#dce4df] bg-white px-3 py-3"}><option value="internal">{t.internalDoc}</option><option value="client">{t.clientDoc}</option></select></label><button className="rounded-xl bg-[#142b3a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#23485a]">{t.upload} ↗</button></form>}
                {canChangeStatus&&<form action={updateCaseStatus} className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#e5ebe5] bg-white p-4 sm:flex-row sm:items-end"><input type="hidden" name="locale" value={locale}/><input type="hidden" name="caseId" value={c.id}/><label className="min-w-0 flex-1 text-xs font-bold text-[#52645b]">{t.status}<select name="status" defaultValue={c.status} className={fieldClass()+" mt-1.5 rounded-xl border-[#dce4df] bg-[#fafcf9] px-3 py-3"}>{statuses.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></label><button className="rounded-xl border border-[#cbd9ce] px-4 py-3 text-sm font-bold text-[#176b67] transition hover:bg-[#edf5ef]">{t.saveStatus}</button></form>}
              </section>
            </div>
          </article>;
        })}
      </div>}
      <footer className="mt-8 flex flex-col gap-3 border-t border-[#dfe6e0] py-5 text-xs text-[#849087] sm:flex-row sm:items-center sm:justify-between"><span>MIZAN · {ar?"مساحة عمل قانونية آمنة":"A considered workspace for legal work"}</span><Link href={"/"+locale+"/dashboard"} className="font-bold text-[#176b67] transition hover:text-[#142b3a]">← {t.back}</Link></footer>
    </div>
  </main>;
}
