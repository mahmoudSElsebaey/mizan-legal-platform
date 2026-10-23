"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Locale = "ar" | "en";
type Status = "idle" | "sending" | "success" | "error";

export default function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  // The locale route is unwrapped by the small client wrapper below.
  return <ContactPageContent params={params} />;
}

function ContactPageContent({ params }: { params: Promise<{ locale: Locale }> }) {
  const [locale, setLocale] = useState<Locale>("ar");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void params.then(({ locale: nextLocale }) => { if (active) { setLocale(nextLocale); setReady(true); } });
    return () => { active = false; };
  }, [params]);
  const ar = locale === "ar";
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "general", message: "" });
  const copy = ar ? {
    eyebrow: "نحن هنا للاستماع", title: "كل بداية واضحة، تبدأ برسالة.", description: "أخبرنا بما تحتاج إليه، وسيتواصل معك فريق ميزان لتوضيح الخطوة التالية. نحرص على التعامل مع بياناتك بسرية واهتمام.",
    response: "تواصل إنساني، وخطوة قانونية أوضح.", formTitle: "ابدأ المحادثة", formText: "املأ التفاصيل التالية وسنعود إليك في أقرب وقت ممكن.",
    name: "الاسم بالكامل", email: "البريد الإلكتروني", phone: "رقم الهاتف (اختياري)", subject: "موضوع التواصل", message: "كيف يمكننا مساعدتك؟", namePh: "اكتب اسمك", emailPh: "name@example.com", phonePh: "+20", messagePh: "اكتب نبذة عن استفسارك دون مشاركة تفاصيل شديدة الحساسية...",
    subjects: [{ value: "general", label: "استفسار عام" }, { value: "consultation", label: "طلب استشارة قانونية" }, { value: "appointments", label: "المواعيد والحجز" }, { value: "business", label: "خدمات الشركات والعقود" }, { value: "other", label: "موضوع آخر" }],
    send: "إرسال الرسالة", sending: "جارٍ إرسال رسالتك...", success: "وصلتنا رسالتك بنجاح. شكرًا لتواصلك مع ميزان.", error: "تعذر إرسال الرسالة الآن. حاول مرة أخرى بعد قليل.", required: "يرجى ملء الحقول المطلوبة بشكل صحيح.",
    noteTitle: "خصوصيتك أولوية", note: "يرجى عدم إرسال مستندات سرية أو بيانات حساسة عبر النموذج. إرسال الرسالة لا ينشئ علاقة محامٍ وموكل ولا يُعد استشارة قانونية.",
    sideTitle: "نؤمن أن الاستماع هو أول الحل.", sideText: "سواء كنت تبحث عن توجيه أولي أو تريد معرفة المزيد عن خدماتنا، يسعدنا أن تبدأ الحديث معنا.", step1: "نستمع إلى احتياجك", step2: "نراجع رسالتك بعناية", step3: "نوضح لك الخطوة التالية", back: "العودة للرئيسية"
  } : {
    eyebrow: "We're here to listen", title: "A clearer beginning starts with a message.", description: "Tell us what you need. The Mizan team will help clarify a sensible next step, with care for your privacy and time.",
    response: "Human communication. A clearer legal next step.", formTitle: "Start a conversation", formText: "Share a few details and our team will get back to you as soon as possible.",
    name: "Full name", email: "Email address", phone: "Phone number (optional)", subject: "What is this about?", message: "How can we help?", namePh: "Your name", emailPh: "name@example.com", phonePh: "+1", messagePh: "Briefly describe your enquiry. Please avoid highly sensitive details...",
    subjects: [{ value: "general", label: "General enquiry" }, { value: "consultation", label: "Legal consultation" }, { value: "appointments", label: "Appointments and booking" }, { value: "business", label: "Business and contracts" }, { value: "other", label: "Other" }],
    send: "Send message", sending: "Sending your message...", success: "Your message has been sent. Thank you for contacting Mizan.", error: "We couldn't send your message right now. Please try again shortly.", required: "Please complete the required fields correctly.",
    noteTitle: "Your privacy comes first", note: "Please do not send confidential documents or sensitive personal data through this form. Sending a message does not establish an attorney-client relationship or constitute legal advice.",
    sideTitle: "We believe listening is the first step to a solution.", sideText: "Whether you need initial guidance or want to learn more about our services, we welcome your message.", step1: "We listen to your needs", step2: "We review your message carefully", step3: "We clarify the next step", back: "Back to home"
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, locale }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || copy.error);
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "general", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : copy.error);
    }
  }

  if (!ready) return <main className="min-h-[60vh] bg-[#f7f6f2]" aria-busy="true" />;
  return <main className="mizan-contact-page" dir={ar ? "rtl" : "ltr"}>
    <section className="mizan-contact-hero">
      <div className="mizan-contact-orbit mizan-contact-orbit-one" aria-hidden="true" />
      <div className="mizan-contact-orbit mizan-contact-orbit-two" aria-hidden="true" />
      <div className="container mizan-contact-hero-grid">
        <div className="mizan-contact-hero-copy">
          <div className="mizan-contact-eyebrow"><span />{copy.eyebrow}</div>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="mizan-contact-promise"><span className="mizan-contact-promise-icon">✦</span><span>{copy.response}</span></div>
          <Link href={`/${locale}`} className="mizan-contact-back">← {copy.back}</Link>
        </div>
        <div className="mizan-contact-emblem" aria-label="Mizan legal balance emblem">
          <div className="mizan-contact-emblem-ring"><div className="mizan-contact-emblem-inner">
            <svg viewBox="0 0 180 180" fill="none" aria-hidden="true"><path d="M90 24v103M54 48h72M48 51 25 92h46L48 51Zm84 0-23 41h46l-23-41ZM31 94c2 12 32 12 40 0m39 0c8 12 38 12 40 0M64 130h52M72 140h36M81 150h18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="m90 17 5 5-5 5-5-5 5-5Z" fill="#d4af7c"/></svg>
          </div></div>
          <span className="mizan-contact-seal-word">MIZAN · LEGAL</span>
        </div>
      </div>
      <div className="mizan-contact-hero-bottom"><span>01 / LISTEN</span><span>02 / UNDERSTAND</span><span>03 / GUIDE</span></div>
    </section>
    <section className="mizan-contact-content section">
      <div className="container mizan-contact-layout">
        <aside className="mizan-contact-aside">
          <span className="mizan-contact-kicker">{ar ? "خطوتك التالية" : "YOUR NEXT STEP"}</span>
          <h2>{copy.sideTitle}</h2><p>{copy.sideText}</p>
          <ol className="mizan-contact-steps"><li><span>01</span>{copy.step1}</li><li><span>02</span>{copy.step2}</li><li><span>03</span>{copy.step3}</li></ol>
          <div className="mizan-contact-privacy"><span aria-hidden="true">✧</span><div><strong>{copy.noteTitle}</strong><p>{copy.note}</p></div></div>
        </aside>
        <div className="mizan-contact-form-card">
          <div className="mizan-contact-form-heading"><span className="mizan-contact-form-icon">↗</span><div><h2>{copy.formTitle}</h2><p>{copy.formText}</p></div></div>
          <form onSubmit={submit} className="mizan-contact-form">
            <div className="mizan-contact-field"><label htmlFor="contact-name">{copy.name} <span>*</span></label><input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} placeholder={copy.namePh} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div className="mizan-contact-field"><label htmlFor="contact-email">{copy.email} <span>*</span></label><input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} placeholder={copy.emailPh} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div className="mizan-contact-field"><label htmlFor="contact-phone">{copy.phone}</label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} placeholder={copy.phonePh} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="mizan-contact-field"><label htmlFor="contact-subject">{copy.subject}</label><select id="contact-subject" name="subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}>{copy.subjects.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
            <div className="mizan-contact-field mizan-contact-field-wide"><label htmlFor="contact-message">{copy.message} <span>*</span></label><textarea id="contact-message" name="message" required minLength={10} maxLength={5000} rows={5} value={form.message} placeholder={copy.messagePh} onChange={e=>setForm({...form,message:e.target.value})}/><small>{form.message.length}/5000</small></div>
            {status === "success" && <p className="mizan-contact-feedback is-success" role="status">{copy.success}</p>}
            {status === "error" && <p className="mizan-contact-feedback is-error" role="alert">{errorMessage || copy.error}</p>}
            <button type="submit" className="mizan-contact-submit" disabled={status === "sending"}><span>{status === "sending" ? copy.sending : copy.send}</span><span aria-hidden="true">{status === "sending" ? "…" : "↗"}</span></button>
            <p className="mizan-contact-form-foot">{ar ? "بالإرسال، أنت توافق على استخدام بياناتك للرد على استفسارك." : "By sending this form, you agree to the use of your details to respond to your enquiry."}</p>
          </form>
        </div>
      </div>
    </section>
  </main>;
}
