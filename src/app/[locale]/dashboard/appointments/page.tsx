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
  return <main className="min-h-screen bg-[#f7f4ed] px-4 py-10 sm:py-14" dir={ar?"rtl":"ltr"}><div className="mx-auto max-w-6xl">
    <Link href={"/"+locale+"/dashboard"} className="text-sm font-bold text-[#176b67] hover:underline">{ar?"← لوحة التحكم":"← Dashboard"}</Link>
    <p className="mt-5 text-xs font-black tracking-[.18em] text-[#176b67]">MIZAN LEGAL / APPOINTMENTS</p>
    <h1 className="mt-2 text-3xl font-black text-[#14263d] sm:text-4xl">{ar?"المواعيد والحجوزات":"Appointments & bookings"}</h1>
    <p className="mt-3 max-w-3xl leading-7 text-[#657184]">{ar?"إدارة إتاحة المحامي وطلبات المواعيد. مدة الموعد 30 دقيقة، ويُحجز الوقت بمجرد تسجيل الطلب لتجنب التعارض.":"Manage lawyer availability and appointment requests. Each appointment is 30 minutes; requested slots are held to prevent conflicts."}</p>
    {message && <p role="status" className="mt-6 rounded-xl border border-[#176b67]/20 bg-white p-4 text-sm font-semibold text-[#176b67]">{message}</p>}
    {appointmentsError && <p role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{ar?"تعذر تحميل المواعيد. تأكد من تطبيق ترحيل المرحلة الخامسة.":"Could not load appointments. Confirm the Phase 5 migration is applied."}</p>}

    {client && <section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-extrabold text-[#14263d]">{ar?"طلب موعد جديد":"Request an appointment"}</h2>
      <p className="mt-2 text-sm leading-6 text-[#657184]">{ar?"اختر محاميًا نشطًا ووقتًا ضمن جدول إتاحته. الطلب يحتاج إلى موافقة المكتب.":"Choose an active lawyer and a time within their availability. The office must approve the request."}</p>
      <form action={requestAppointment} className="mt-5 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="locale" value={locale}/>
        <label className="text-sm font-semibold">{ar?"المحامي":"Lawyer"}<select name="lawyerId" required className={field}><option value="">{ar?"اختر محاميًا":"Select a lawyer"}</option>{(lawyers||[]).map((item)=><option key={item.profile_id} value={item.profile_id}>{lawyerNames.get(item.profile_id)|| (ar?"محامٍ":"Lawyer")}</option>)}</select></label>
        <label className="text-sm font-semibold">{ar?"الخدمة (اختياري)":"Service (optional)"}<select name="serviceId" className={field}><option value="">{ar?"بدون تحديد":"No preference"}</option>{(services||[]).map((item)=><option key={item.id} value={item.id}>{ar?item.title_ar:item.title_en}</option>)}</select></label>
        <label className="text-sm font-semibold">{ar?"التاريخ":"Date"}<input type="date" name="appointmentDate" min={today} required className={field}/></label>
        <label className="text-sm font-semibold">{ar?"وقت البداية (توقيت القاهرة)":"Start time (Cairo time)"}<input type="time" name="appointmentTime" required step="1800" className={field}/></label>
        <label className="text-sm font-semibold sm:col-span-2">{ar?"ملخص مختصر (لا تكتب معلومات سرية)":"Brief reason (do not include confidential details)"}<textarea name="clientMessage" rows={3} maxLength={1200} className={field}/></label>
        <div className="sm:col-span-2"><button type="submit" className="rounded-xl bg-[#14263d] px-5 py-3 text-sm font-bold text-white hover:bg-[#176b67]">{ar?"إرسال طلب الموعد":"Send appointment request"}</button></div>
      </form>
    </section>}

    {lawyer && <section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7">
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

    <section className="mt-8 rounded-2xl border border-[#14263d]/10 bg-white p-5 sm:p-7">
      <h2 className="text-xl font-extrabold text-[#14263d]">{ar?"طلبات المواعيد":"Appointment requests"}</h2>
      {(appointments||[]).length===0 ? <p className="mt-5 rounded-xl bg-[#f7f4ed] p-5 text-sm text-[#657184]">{ar?"لا توجد مواعيد حتى الآن.":"No appointments yet."}</p> : <div className="mt-5 space-y-4">
        {(appointments||[]).map((item)=>{
          const canDecide = admin || (lawyer && item.lawyer_id===user.id);
          const canCancel = item.client_id===user.id && ["requested","approved","confirmed"].includes(item.status) && new Date(item.starts_at)>new Date();
          const next = item.status==="requested"?["approved","rejected","cancelled"]:item.status==="approved"?["confirmed","cancelled"]:item.status==="confirmed"?["completed","cancelled"]:[];
          const availableActions = (canCancel?["cancelled"]:[]).concat(canDecide?next:[]).filter((value,index,array)=>array.indexOf(value)===index);
          return <article key={item.id} className="rounded-xl border border-[#14263d]/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#657184]">{cairoTime(item.starts_at,locale)} · 30 {ar?"دقيقة":"minutes"}</p><h3 className="mt-2 font-extrabold text-[#14263d]">{ar?"المحامي":"Lawyer"}: {lawyerNames.get(item.lawyer_id)||"—"}</h3><p className="mt-1 text-sm text-[#657184]">{item.service_id?serviceNames.get(item.service_id)||"—":(ar?"بدون خدمة محددة":"No specific service")}</p>{item.client_message&&<p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#657184]">{item.client_message}</p>}</div><span className="rounded-full bg-[#f7f4ed] px-3 py-1 text-xs font-bold text-[#14263d]">{statuses[item.status]?.[locale]||item.status}</span></div>
            {availableActions.length>0 && <div className="mt-4 flex flex-wrap gap-2">{availableActions.map((status)=><form key={status} action={updateAppointmentStatus}><input type="hidden" name="locale" value={locale}/><input type="hidden" name="appointmentId" value={item.id}/><input type="hidden" name="status" value={status}/><button className={status==="rejected"||status==="cancelled"?"rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50":"rounded-lg bg-[#14263d] px-3 py-2 text-xs font-bold text-white hover:bg-[#176b67]"}>{({approved:ar?"موافقة":"Approve",confirmed:ar?"تأكيد":"Confirm",cancelled:ar?"إلغاء":"Cancel",rejected:ar?"رفض":"Reject",completed:ar?"إكمال":"Complete"} as Record<string,string>)[status]}</button></form>)}</div>}
          </article>;
        })}
      </div>}
    </section>
    <p className="mt-6 text-xs leading-5 text-[#657184]">{ar?"الأوقات بتوقيت القاهرة. لا ترسل بيانات سرية أو تفاصيل قانونية حساسة في رسالة الحجز.":"Times use Africa/Cairo. Do not submit confidential or sensitive legal details in the booking message."}</p>
  </div></main>;
}
