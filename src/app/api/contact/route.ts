import { NextResponse } from "next/server";

const allowedSubjects = new Set(["general", "consultation", "appointments", "business", "other"]);
const subjectLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: "استفسار عام", en: "General enquiry" },
  consultation: { ar: "طلب استشارة قانونية", en: "Legal consultation" },
  appointments: { ar: "المواعيد والحجز", en: "Appointments and booking" },
  business: { ar: "خدمات الشركات والعقود", en: "Business and contracts" },
  other: { ar: "موضوع آخر", en: "Other" },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const subject = typeof body.subject === "string" && allowedSubjects.has(body.subject) ? body.subject : "general";
    const locale = body.locale === "en" ? "en" : "ar";

    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 30 || message.length < 10 || message.length > 5000) {
      return NextResponse.json({ error: locale === "ar" ? "راجع البيانات المدخلة وحاول مرة أخرى." : "Please check your details and try again." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_EMAIL;
    const sender = process.env.CONTACT_FROM_EMAIL;
    if (!apiKey || !recipient || !sender) {
      console.error("Contact form is missing RESEND_API_KEY, CONTACT_EMAIL, or CONTACT_FROM_EMAIL.");
      return NextResponse.json({ error: locale === "ar" ? "خدمة التواصل غير مهيأة بعد. يرجى المحاولة لاحقًا." : "The contact service is not configured yet. Please try again later." }, { status: 503 });
    }

    const safeName = name.replace(/[\r\n]+/g, " ");
    const safeSubject = subjectLabels[subject][locale];
    const text = [
      "New message from the Mizan Legal contact form",
      "",
      `Name: ${safeName}`,
      `Email: ${email}`,
      `Phone: ${phone || "Not provided"}`,
      `Topic: ${safeSubject}`,
      `Language: ${locale}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: `Mizan website contact — ${safeSubject}`,
        text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Resend rejected contact email:", response.status, (await response.text()).slice(0, 500));
      return NextResponse.json({ error: locale === "ar" ? "تعذر إرسال الرسالة الآن. حاول مرة أخرى لاحقًا." : "We couldn't send your message right now. Please try again later." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
