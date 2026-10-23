import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
export const metadata: Metadata = { title: "Privacy Policy" };
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
 const { locale }=await params; if(!isLocale(locale)) notFound(); const ar=locale==="ar";
 const sections=ar?[
 ["1. المعلومات التي نجمعها","قد نجمع المعلومات التي تقدمها عند إنشاء الحساب أو طلب موعد أو التواصل مع المكتب، مثل الاسم وبيانات الاتصال وتفاصيل الطلب. لا ترسل بيانات حساسة إلا عبر قناة مناسبة وآمنة."],
 ["2. كيف نستخدم المعلومات","نستخدم المعلومات لتشغيل الحساب، وتنظيم طلبات التواصل والمواعيد، وتحسين الخدمة، وحماية المنصة، والوفاء بالالتزامات القانونية ذات الصلة."],
 ["3. السرية وأمن البيانات","نطبق تدابير تقنية وتنظيمية معقولة لحماية البيانات. ومع ذلك، لا يمكن ضمان أمن أي إرسال أو تخزين إلكتروني بصورة مطلقة."],
 ["4. مشاركة المعلومات","لا نبيع بياناتك الشخصية. قد تتم معالجة البيانات بواسطة مزودي الاستضافة أو الخدمات التقنية اللازمة للتشغيل، أو الإفصاح عنها عندما يفرض القانون ذلك."],
 ["5. ملفات الارتباط والتخزين","قد تستخدم المنصة تقنيات ضرورية لتسجيل الدخول والحفاظ على الجلسة وتحسين تجربة الاستخدام. يمكنك إدارة إعدادات المتصفح، مع العلم أن تعطيل بعض التقنيات قد يؤثر على الوظائف."],
 ["6. حقوقك ومدة الاحتفاظ","يمكنك طلب تحديث بياناتك أو الاستفسار عن معالجتها، وفق القوانين السارية. نحتفظ بالمعلومات للمدة اللازمة للأغراض الموضحة أو للامتثال للالتزامات القانونية."],
 ["7. تحديث السياسة والتواصل","قد نحدث هذه السياسة عند الحاجة. توضح هذه الصفحة المبادئ العامة للمنصة ولا تمثل استشارة قانونية أو ضمانًا تعاقديًا مستقلًا."]
 ]:[
 ["1. Information we collect","We may collect information you provide when creating an account, requesting an appointment, or contacting the office, such as your name, contact details, and request information. Avoid submitting sensitive information through an unsuitable channel."],
 ["2. How information is used","We use information to operate accounts, coordinate inquiries and appointments, improve the service, protect the platform, and meet applicable legal obligations."],
 ["3. Confidentiality and security","We use reasonable technical and organizational measures to protect data. However, no electronic transmission or storage method can be guaranteed to be completely secure."],
 ["4. Sharing information","We do not sell personal data. Data may be processed by hosting or technical providers necessary to operate the platform, or disclosed where required by law."],
 ["5. Cookies and storage","The platform may use essential technologies for authentication, session continuity, and usability. Disabling them in your browser may affect some functionality."],
 ["6. Your choices and retention","You may request updates to your information or ask about its processing, subject to applicable law. We retain information only as needed for the stated purposes or legal obligations."],
 ["7. Changes and contact","This policy may be updated when necessary. It describes general platform practices and is not legal advice or a standalone contractual guarantee."]
 ];
 return <main className="mizan-legal-page" dir={ar?"rtl":"ltr"}><div className="mizan-legal-hero"><div className="mizan-legal-wrap"><p className="mizan-legal-kicker">{ar?"الخصوصية والثقة":"PRIVACY & TRUST"}</p><h1>{ar?"سياسة الخصوصية":"Privacy Policy"}</h1><p>{ar?"خصوصيتك جزء أساسي من الثقة التي نسعى لبنائها في كل خطوة.":"Your privacy is part of the trust we aim to build at every step."}</p><span>{ar?"آخر تحديث: 23 أكتوبر 2026":"Last updated: October 23, 2026"}</span></div></div><div className="mizan-legal-wrap mizan-legal-layout"><aside className="mizan-legal-aside"><strong>{ar?"في هذه الصفحة":"ON THIS PAGE"}</strong>{sections.map((s,i)=><a key={s[0]} href={`#privacy-${i+1}`}>{s[0].replace(/^\d+\.\s*/,"")}</a>)}<Link href={`/${locale}/terms`}>{ar?"اقرأ شروط الاستخدام ↗":"Read terms of use ↗"}</Link></aside><article className="mizan-legal-content"><div className="mizan-legal-intro">{ar?"نوضح هنا كيف تتعامل منصة ميزان مع المعلومات التي قد تقدمها أثناء استخدام الموقع وخدماته. نلتزم بمبدأ جمع ما يلزم فقط واستخدامه لأغراض واضحة.":"This page explains how MIZAN may handle information you provide while using the website and its services. We aim to collect only what is necessary and use it for clear purposes."}</div>{sections.map((s,i)=><section id={`privacy-${i+1}`} key={s[0]}><span className="mizan-legal-index">{String(i+1).padStart(2,"0")}</span><div><h2>{s[0]}</h2><p>{s[1]}</p></div></section>)}<div className="mizan-legal-note">{ar?"تنبيه: هذه صياغة عامة أولية، ويجب مراجعتها قانونيًا بما يتوافق مع الدولة التي يعمل بها المكتب وطبيعة البيانات والخدمات الفعلية.":"Note: This is a general starter policy and should be reviewed for the office's jurisdiction, actual data practices, and services."}</div><Link className="mizan-legal-back" href={`/${locale}`}>{ar?"← العودة إلى الرئيسية":"← Back to home"}</Link></article></div></main>;
}
