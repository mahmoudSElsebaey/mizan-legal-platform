import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { deleteAvailabilityException, requestAppointment, saveAvailabilityException, saveWeeklyAvailability, updateAppointmentStatus } from "./actions";

const days = {
  ar:["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"],
  en:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
};
const statuses: Record<string,{ar:string;en:string}> = {
  requested:{ar:"بانتظار المراجعة",en:"Requested"}, approved:{ar:"تمت الموافقة",en:"Approved"},
  confirmed:{ar:"مؤكد",en:"Confirmed"}, cancelled:{ar:"ملغي",en:"Cancelled"},
  rejected:{ar:"مرفوض",en:"Rejected"}, completed:{ar:"مكتمل",en:"Completed"},
};
const messages: Record<string,{ar:string;en:string}> = {
  "availability-saved":{ar:"تم حفظ جدول الإتاحة.",en:"Availability saved."},
  "availability-failed":{ar:"تعذر حفظ الإتاحة.",en:"Could not save availability."},
  "exception-saved":{ar:"تم حفظ الاستثناء.",en:"Exception saved."},
  "exception-deleted":{ar:"تم حذف الاستثناء.",en:"Exception deleted."},
  "exception-failed":{ar:"تعذر حفظ أو حذف الاستثناء.",en:"Could not save or delete the exception."},
  "invalid-hours":{ar:"وقت النهاية يجب أن يكون بعد البداية.",en:"End time must be after start time."},
  "booking-sent":{ar:"تم إرسال طلب الموعد.",en:"Appointment request sent."},
  "booking-failed":{ar:"تعذر إنشاء الطلب. تحقق من الإتاحة والبيانات.",en:"Booking failed. Check availability and details."},
  "slot-taken":{ar:"هذا الموعد لم يعد متاحًا. اختر وقتًا آخر.",en:"That slot is no longer available. Choose another time."},
  "date-past":{ar:"اختر تاريخًا مستقبليًا.",en:"Choose a future date."},
  "lawyer-unavailable":{ar:"المحامي غير متاح للحجز.",en:"The lawyer is unavailable."},
  "client-account-required":{ar:"استخدم حساب عميل لطلب موعد.",en:"Use a client account to book."},
  "decision-saved":{ar:"تم تحديث حالة الموعد.",en:"Appointment status updated."},
  "appointment-cancelled":{ar:"تم إلغاء الموعد.",en:"Appointment cancelled."},
  "decision-failed":{ar:"تعذر تحديث حالة الموعد.",en:"Could not update appointment."},
  "transition-invalid":{ar:"انتقال الحالة غير مسموح به.",en:"That status transition is not allowed."},
  forbidden:{ar:"ليس لديك صلاحية لهذا الإجراء.",en:"You are not allowed to do this."},
};
function cairoTime(value:string,locale:"ar"|"en") {
  return new Intl.DateTimeFormat(locale==="ar"?"ar-EG":"en-GB",{timeZone:"Africa/Cairo",dateStyle:"medium",timeStyle:"short"}).format(new Date(value));
}
export default async function AppointmentsPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{result?:string}>}) {
  const {locale} = await params; const {result} = await searchParams;
  if (!isLocale(locale)) notFound();
  const ar = locale==="ar"; const supabase = await createClient();
  const {data:{user}} = await supabase.auth.getUser();
  if (!user) redirect("/"+locale+"/login");
  const {data:staff} = await supabase.from("staff_members").select("role,status").eq("profile_id",user.id).maybeSingle();
  const active = staff?.status==="active";
  const admin = active && ["owner","admin"].includes(staff?.role||"");
  const lawyer = active && staff?.role==="lawyer";
  const client = !staff;
  const [{data:appointments,error:appointmentsError},{data:availability},{data:exceptions},{data:lawyers},{data:services}] = await Promise.all([
    supabase.from("appointments").select("id,client_id,lawyer_id,service_id,starts_at,ends_at,status,client_message").order("starts_at",{ascending:true}).limit(100),
    lawyer ? supabase.from("lawyer_availability").select("*").eq("lawyer_id",user.id).order("weekday") : Promise.resolve({data:[]}),
    lawyer ? supabase.from("lawyer_availability_exceptions").select("*").eq("lawyer_id",user.id).gte("exception_date",new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())).order("exception_date").limit(30) : Promise.resolve({data:[]}),
    supabase.rpc("get_active_lawyer_directory"),
    supabase.from("office_services").select("id,title_ar,title_en").eq("is_published",true).order("sort_order"),
  ]);
  const lawyerNames = new Map<string,string>((lawyers||[]).map((item: {profile_id:string;full_name:string})=>[item.profile_id,item.full_name] as [string,string]));
  const serviceNames = new Map<string,string>((services||[]).map((item: {id:string;title_ar:string;title_en:string})=>[item.id,ar?item.title_ar:item.title_en] as [string,string]));
  const message = result && messages[result] ? messages[result][locale] : "";
  const field = "mt-2 w-full rounded-xl border border-[#14263d]/15 bg-white px-3 py-3 text-sm";
  const todayParts = new Intl.DateTimeFormat("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const todayMap = Object.fromEntries(todayParts.map((part)=>[part.type,part.value]));
  const today = todayMap.year+"-"+todayMap.month+"-"+todayMap.day;
  return <main className="mizan-dashboard-page min-h-screen overflow-hidden bg-[#f4f2ec] px-3 py-5 sm:px-6 sm:py-8 lg:px-8" dir={ar?"rtl":"ltr"}>
    <nav className="mizan-dashboard-page-nav mx-auto mb-6 flex max-w-7xl flex-wrap gap-2 rounded-2xl border border-[#14263d]/10 bg-white/90 p-2 shadow-sm" aria-label={ar?"التنقل داخل لوحة التحكم":"Dashboard navigation"}><Link href={"/"+locale+"/dashboard"}>⌂ <span>{ar?"لوحة التحكم":"Overview"}</span></Link><Link href={"/"+locale+"/dashboard/cases"}>▤ <span>{ar?"ملفات القضايا":"Cases"}</span></Link><Link href={"/"+locale+"/dashboard/appointments"}>▦ <span>{ar?"المواعيد":"Appointments"}</span></Link><Link href={"/"+locale+"/dashboard/conversations"}>◌ <span>{ar?"المحادثات":"Messages"}</span></Link>{["owner","admin"].includes(String(staff?.role||""))&&<><Link href={"/"+locale+"/dashboard/staff"}>♙ <span>{ar?"المستخدمون":"Staff"}</span></Link><Link href={"/"+locale+"/dashboard/services"}>⚖ <span>{ar?"الخدمات":"Services"}</span></Link><Link href={"/"+locale+"/dashboard/settings"}>⚙ <span>{ar?"الإعدادات":"Settings"}</span></Link><Link href={"/"+locale+"/dashboard/audit"}>◷ <span>{ar?"سجل التدقيق":"Audit log"}</span></Link></>}</nav>
<div className="mx-auto max-w-7xl">
    <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-[#14263d] px-5 py-7 text-white shadow-xl sm:px-8 sm:py-9 lg:px-10">
      <div aria-hidden="true" className="pointer-events-none absolute -end-12 -top-24 h-72 w-72 rounded-full border border-[#d8b878]/25 sm:h-96 sm:w-96"/><div aria-hidden="true" className="pointer-events-none absolute -end-2 -top-14 h-56 w-56 rounded-full border border-[#d8b878]/15 sm:h-72 sm:w-72"/>
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-3xl"><Link href={"/"+locale+"/dashboard"} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-[#e4d1a7] transition hover:bg-white/10">{ar?"← العودة إلى لوحة التحكم":"← Back to dashboard"}</Link><p className="mt-6 text-[11px] font-black uppercase tracking-[.24em] text-[#d8b878]">MIZAN LEGAL <span className="mx-2 text-white/30">/</span> APPOINTMENTS</p><h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{ar?"المواعيد والحجوزات":"Appointments & bookings"}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{ar?"مساحة منظمة لإدارة المواعيد، ومراجعة الطلبات، وضبط أوقات استقبال العملاء.":"A considered workspace to manage bookings, review requests, and organize client availability."}</p></div>
        <div className="grid min-w-48 grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur"><span className="text-xs text-slate-300">{ar?"المواعيد المعروضة":"Appointments shown"}</span><p className="mt-2 text-3xl font-black text-[#e4d1a7]">{(appointments||[]).length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur"><span className="text-xs text-slate-300">{ar?"بانتظار المراجعة":"Awaiting review"}</span><p className="mt-2 text-3xl font-black text-white">{(appointments||[]).filter((item)=>item.status==="requested").length}</p></div></div>
      </div><div className="relative mt-7 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5 text-xs text-slate-300"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><span className="h-2 w-2 rounded-full bg-[#d8b878]"/>{ar?"مدة الموعد 30 دقيقة":"30-minute appointments"}</span><span className="rounded-full border border-white/10 px-3 py-2">{ar?"التوقيت المحلي: القاهرة":"Local time: Cairo"}</span></div>
    </section>
    {message && <p role="status" className="mt-6 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{message}</p>}
    {appointmentsError && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar?"تعذر تحميل المواعيد. تأكد من تطبيق ترحيل المرحلة الخامسة.":"Could not load appointments. Confirm the Phase 5 migration is applied."}</p>}

    {client && <section className="mt-6 rounded-[1.5rem] border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <h2 className="text-xl font-extrabold text-[#14263d]">{ar?"طلب موعد جديد":"Request an appointment"}</h2>
      <p className="mt-2 text-sm leading-6 text-[#657184]">{ar?"اختر محاميًا نشطًا ووقتًا ضمن جدول إتاحته. الطلب يحتاج إلى موافقة المكتب.":"Choose an active lawyer and a time within their availability. The office must approve the request."}</p>
      <form action={requestAppointment} className="mt-6 grid gap-4 rounded-2xl bg-[#f7f6f1] p-4 sm:grid-cols-2 sm:p-5">
        <input type="hidden" name="locale" value={locale}/>
        <label className="text-sm font-semibold">{ar?"المحامي":"Lawyer"}<select name="lawyerId" required className={field}><option value="">{ar?"اختر محاميًا":"Select a lawyer"}</option>{(lawyers||[]).map((item: {profile_id:string;full_name:string})=><option key={item.profile_id} value={item.profile_id}>{lawyerNames.get(item.profile_id)|| (ar?"محامٍ":"Lawyer")}</option>)}</select></label>
        <label className="text-sm font-semibold">{ar?"الخدمة (اختياري)":"Service (optional)"}<select name="serviceId" className={field}><option value="">{ar?"بدون تحديد":"No preference"}</option>{(services||[]).map((item)=><option key={item.id} value={item.id}>{ar?item.title_ar:item.title_en}</option>)}</select></label>
        <label className="text-sm font-semibold">{ar?"التاريخ":"Date"}<input type="date" name="appointmentDate" min={today} required className={field}/></label>
        <label className="text-sm font-semibold">{ar?"وقت البداية (توقيت القاهرة)":"Start time (Cairo time)"}<input type="time" name="appointmentTime" required step="1800" className={field}/></label>
        <label className="text-sm font-semibold sm:col-span-2">{ar?"ملخص مختصر (لا تكتب معلومات سرية)":"Brief reason (do not include confidential details)"}<textarea name="clientMessage" rows={3} maxLength={1200} className={field}/></label>
        <div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white hover:bg-[#176b67]">{ar?"إرسال طلب الموعد":"Send appointment request"}</button></div>
      </form>
    </section>}

    {lawyer && <section className="mt-6 rounded-[1.5rem] border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <h2 className="text-xl font-extrabold text-[#14263d]">{ar?"جدول الإتاحة الأسبوعي":"Weekly availability"}</h2>
      <p className="mt-2 text-sm leading-6 text-[#657184]">{ar?"حدد ساعات استقبال العملاء. الاستثناء بتاريخ محدد يتغلب على الجدول الأسبوعي لذلك اليوم.":"Set your client hours. A date exception overrides the weekly rule for that date."}</p>
      <div className="mt-5 space-y-3">{days[locale].map((day,weekday)=>{
        const rule = (availability||[]).find((item)=>item.weekday===weekday);
        return <form key={weekday} action={saveWeeklyAvailability} className="grid gap-3 rounded-xl border border-[#14263d]/10 p-4 sm:grid-cols-[minmax(0,1fr)_1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="locale" value={locale}/><input type="hidden" name="weekday" value={weekday}/>
          <label className="text-sm font-bold">{day}<select name="isAvailable" defaultValue={String(rule?.is_available??false)} className={field}><option value="true">{ar?"متاح":"Available"}</option><option value="false">{ar?"مغلق":"Closed"}</option></select></label>
          <label className="text-sm font-semibold">{ar?"من":"From"}<input name="startTime" type="time" defaultValue={rule?.is_available?String(rule.start_time).slice(0,5):"09:00"} className={field}/></label>
          <label className="text-sm font-semibold">{ar?"إلى":"To"}<input name="endTime" type="time" defaultValue={rule?.is_available?String(rule.end_time).slice(0,5):"17:00"} className={field}/></label>
          <button className="rounded-xl bg-[#14263d] px-4 py-3 text-sm font-bold text-white hover:bg-[#176b67]" type="submit">{ar?"حفظ":"Save"}</button>
        </form>;
      })}</div>
      <h3 className="mt-8 text-lg font-extrabold text-[#14263d]">{ar?"استثناء بتاريخ محدد":"Date exception"}</h3>
      <form action={saveAvailabilityException} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="locale" value={locale}/>
        <label className="text-sm font-semibold">{ar?"التاريخ":"Date"}<input name="exceptionDate" type="date" min={today} required className={field}/></label>
        <label className="text-sm font-semibold">{ar?"الحالة":"Availability"}<select name="isAvailable" className={field}><option value="false">{ar?"مغلق طوال اليوم":"Closed all day"}</option><option value="true">{ar?"ساعات خاصة":"Special hours"}</option></select></label>
        <label className="text-sm font-semibold">{ar?"من":"From"}<input name="startTime" type="time" className={field}/></label>
        <label className="text-sm font-semibold">{ar?"إلى":"To"}<input name="endTime" type="time" className={field}/></label>
        <label className="text-sm font-semibold">{ar?"ملاحظة":"Note"}<input name="note" maxLength={240} className={field}/></label>
        <div className="sm:col-span-2 lg:col-span-5"><button type="submit" className="rounded-xl bg-[#176b67] px-5 py-3 text-sm font-bold text-white">{ar?"حفظ الاستثناء":"Save exception"}</button></div>
      </form>
      {(exceptions||[]).map((item)=><div key={item.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#14263d]/10 p-3 text-sm"><span className="font-semibold text-[#14263d]">{item.exception_date} · {item.is_available?String(item.start_time).slice(0,5)+"–"+String(item.end_time).slice(0,5):(ar?"مغلق":"Closed")} {item.note||""}</span><form action={deleteAvailabilityException}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="exceptionId" value={item.id}/><button className="font-bold text-red-700 hover:underline" type="submit">{ar?"حذف":"Delete"}</button></form></div>)}
    </section>}

    <section className="mt-6 rounded-[1.5rem] border border-[#14263d]/10 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
      <h2 className="text-xl font-extrabold text-[#14263d]">{ar?"طلبات المواعيد":"Appointment requests"}</h2>
      {(appointments||[]).length===0 ? <p className="mt-5 rounded-xl bg-[#f7f4ed] p-5 text-sm text-[#657184]">{ar?"لا توجد مواعيد حتى الآن.":"No appointments yet."}</p> : <div className="mt-5 space-y-3">
        {(appointments||[]).map((item)=>{
          const canDecide = admin || (lawyer && item.lawyer_id===user.id);
          const canCancel = item.client_id===user.id && ["requested","approved","confirmed"].includes(item.status) && new Date(item.starts_at)>new Date();
          const next = item.status==="requested"?["approved","rejected","cancelled"]:item.status==="approved"?["confirmed","cancelled"]:item.status==="confirmed"?["completed","cancelled"]:[];
          const availableActions = (canCancel?["cancelled"]:[]).concat(canDecide?next:[]).filter((value,index,array)=>array.indexOf(value)===index);
          return <article key={item.id} className="group rounded-2xl border border-[#14263d]/10 bg-gradient-to-br from-white to-[#faf9f5] p-4 transition duration-200 hover:border-[#176b67]/30 hover:shadow-md sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#657184]">{cairoTime(item.starts_at,locale)} · 30 {ar?"دقيقة":"minutes"}</p><h3 className="mt-2 font-extrabold text-[#14263d]">{ar?"المحامي":"Lawyer"}: {lawyerNames.get(item.lawyer_id)||"—"}</h3><p className="mt-1 text-sm text-[#657184]">{item.service_id?serviceNames.get(item.service_id)||"—":(ar?"بدون خدمة محددة":"No specific service")}</p>{item.client_message&&<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#657184]">{item.client_message}</p>}</div><span className="rounded-full bg-[#f7f4ed] px-3 py-1 text-xs font-bold text-[#14263d]">{statuses[item.status]?.[locale]||item.status}</span></div>
            {availableActions.length>0 && <div className="mt-4 flex flex-wrap gap-2">{availableActions.map((status)=><form key={status} action={updateAppointmentStatus}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="appointmentId" value={item.id}/><input type="hidden" name="status" value={status}/><button className={status==="rejected"||status==="cancelled"?"rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50":"rounded-lg bg-[#14263d] px-3 py-2 text-xs font-bold text-white hover:bg-[#176b67]"}>{({approved:ar?"موافقة":"Approve",confirmed:ar?"تأكيد":"Confirm",cancelled:ar?"إلغاء":"Cancel",rejected:ar?"رفض":"Reject",completed:ar?"إكمال":"Complete"} as Record<string,string>)[status]}</button></form>)}</div>}
          </article>;
        })}
      </div>}
    </section>
    <p className="mt-6 text-xs leading-5 text-[#657184]">{ar?"الأوقات بتوقيت القاهرة. لا ترسل بيانات سرية أو تفاصيل قانونية حساسة في رسالة الحجز.":"Times use Africa/Cairo. Do not submit confidential or sensitive legal details in the booking message."}</p>
  </div></main>;
}
