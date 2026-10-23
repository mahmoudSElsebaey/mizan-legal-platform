import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
export const metadata: Metadata = { title: "Terms of Use" };
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale }=await params; if(!isLocale(locale)) notFound(); const ar=locale==="ar";
 const sections=ar?[
 ["1. قبول الشروط","باستخدام منصة ميزان، فإنك تقر بأنك قرأت هذه الشروط وفهمتها. إذا لم توافق عليها، يرجى عدم استخدام الوظائف التي تتطلب قبولها."],
 ["2. طبيعة المنصة","توفر المنصة أدوات للتعريف بالخدمات القانونية وإدارة الحسابات وطلبات التواصل والمواعيد والمحادثات بحسب الوظائف المتاحة. قد تختلف الوظائف وفق نوع الحساب."],
 ["3. لا تنشئ العلاقة المهنية تلقائيًا","لا يؤدي تصفح الموقع أو إرسال رسالة أو إنشاء حساب وحده إلى إنشاء علاقة محاماة أو تكليف مهني. تتطلب أي علاقة مهنية اتفاقًا واضحًا مع المحامي أو المكتب."],
 ["4. الحساب وأمنه","أنت مسؤول عن دقة المعلومات التي تقدمها وعن الحفاظ على سرية بيانات الدخول. يرجى إبلاغ المكتب عند الاشتباه في استخدام غير مصرح به لحسابك."],
 ["5. الاستخدام المقبول","يجب عدم استخدام المنصة لأغراض غير قانونية أو مضللة، أو محاولة الوصول غير المصرح به، أو تعطيل الخدمة، أو إرسال محتوى ينتهك حقوق الآخرين."],
 ["6. المواعيد والمراسلات","إرسال طلب موعد لا يعني تأكيده حتى يصلك إشعار أو تأكيد مناسب. لا تستخدم المنصة وحدها للإبلاغ عن حالات الطوارئ أو المواعيد القانونية العاجلة دون التحقق المباشر."],
 ["7. المحتوى والملكية الفكرية","تظل الحقوق في المحتوى والعلامات والتصميمات مملوكة لأصحابها. لا يجوز نسخ المحتوى أو إعادة استخدامه تجاريًا دون إذن، باستثناء ما يسمح به القانون."],
 ["8. توفر الخدمة وحدود المسؤولية","نسعى لتوفير الخدمة بصورة مستقرة، لكن قد تحدث انقطاعات أو تغييرات. المعلومات العامة لا تمثل استشارة قانونية مخصصة ولا تغني عن التواصل المباشر مع محامٍ."],
 ["9. التعديلات والقانون الواجب التطبيق","قد نعدل الشروط عند الحاجة. يحدد المكتب القانون الواجب التطبيق والجهة المختصة وفق الولاية القضائية والعقود الفعلية ذات الصلة."]
 ]:[
 ["1. Acceptance","By using MIZAN, you acknowledge that you have read and understood these terms. If you do not agree, do not use features that require acceptance."],
 ["2. Platform scope","The platform provides tools to present legal services and manage accounts, inquiries, appointments, and conversations where available. Features may vary by account type."],
 ["3. No automatic professional relationship","Browsing the site, sending a message, or creating an account does not by itself establish an attorney-client engagement. A professional relationship requires a clear agreement with the lawyer or office."],
 ["4. Accounts and security","You are responsible for providing accurate information and keeping your credentials confidential. Notify the office if you suspect unauthorized account access."],
 ["5. Acceptable use","You must not use the platform unlawfully or deceptively, attempt unauthorized access, disrupt the service, or submit content that infringes others' rights."],
 ["6. Appointments and messages","An appointment request is not confirmed until you receive appropriate confirmation. Do not rely on the platform alone for emergencies or urgent legal deadlines without direct verification."],
 ["7. Content and intellectual property","Rights in content, marks, and designs remain with their respective owners. Commercial copying or reuse requires permission unless permitted by law."],
 ["8. Availability and liability","We aim to keep the service reliable, but interruptions and changes may occur. General information is not individualized legal advice and does not replace direct consultation with a lawyer."],
 ["9. Changes and governing law","These terms may be updated. Governing law and competent jurisdiction should be determined based on the office's jurisdiction and applicable agreements."]
 ];
 return <main className="mizan-legal-page" dir={ar?"rtl":"ltr"}><div className="mizan-legal-hero"><div className="mizan-legal-wrap"><p className="mizan-legal-kicker">{ar?"الاستخدام المسؤول":"RESPONSIBLE USE"}</p><h1>{ar?"شروط الاستخدام":"Terms of Use"}</h1><p>{ar?"قواعد واضحة لاستخدام المنصة والتواصل من خلالها.":"Clear guidelines for using the platform and communicating through it."}</p><span>{ar?"آخر تحديث: 23 أكتوبر 2026":"Last updated: October 23, 2026"}</span></div></div><div className="mizan-legal-wrap mizan-legal-layout"><aside className="mizan-legal-aside"><strong>{ar?"في هذه الصفحة":"ON THIS PAGE"}</strong>{sections.map((s,i)=><a key={s[0]} href={`#terms-${i+1}`}>{s[0].replace(/^\d+\.\s*/,"")}</a>)}<Link href={`/${locale}/privacy`}>{ar?"اقرأ سياسة الخصوصية ↗":"Read privacy policy ↗"}</Link></aside><article className="mizan-legal-content"><div className="mizan-legal-intro">{ar?"تهدف هذه الشروط إلى توضيح قواعد استخدام المنصة وحدود الخدمات الرقمية المتاحة من خلالها.":"These terms explain the rules for using the platform and the boundaries of the digital services made available through it."}</div>{sections.map((s,i)=><section id={`terms-${i+1}`} key={s[0]}><span className="mizan-legal-index">{String(i+1).padStart(2,"0")}</span><div><h2>{s[0]}</h2><p>{s[1]}</p></div></section>)}<div className="mizan-legal-note">{ar?"تنبيه: هذه صياغة أولية عامة وليست بديلًا عن مراجعة قانونية محلية قبل النشر الرسمي.":"Note: This is a general starter document and should receive local legal review before official publication."}</div><Link className="mizan-legal-back" href={`/${locale}`}>{ar?"← العودة إلى الرئيسية":"← Back to home"}</Link></article></div></main>;
}
