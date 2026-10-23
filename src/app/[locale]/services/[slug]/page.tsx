import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { getPracticeArea, practiceAreas } from "@/lib/content/public-site";
import { createClient } from "@/lib/supabase/server";

export function generateStaticParams() {
  return locales.flatMap((locale) => Object.keys(practiceAreas).map((slug) => ({ locale, slug })));
}

export default async function PracticeAreaPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const staticItem = getPracticeArea(slug, locale);
  type ManagedService = { slug: string; title_ar: string; title_en: string; description_ar: string; description_en: string; is_published: boolean };
  let managedItem: ManagedService | null = null;
  let databaseAvailable = false;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("office_services").select("slug,title_ar,title_en,description_ar,description_en,is_published").eq("slug", slug).maybeSingle();
    if (!error) { managedItem = data as ManagedService | null; databaseAvailable = true; }
  } catch { /* Keep static public content available when Supabase is not configured. */ }
  if (databaseAvailable && managedItem && !managedItem.is_published) notFound();
  if (!managedItem && !staticItem) notFound();

  const item = managedItem
    ? { slug, title: ar ? managedItem.title_ar : managedItem.title_en, summary: ar ? managedItem.description_ar : managedItem.description_en, details: staticItem?.details ?? [], constitutional: staticItem?.constitutional ?? [], topics: staticItem?.topics ?? [] }
    : staticItem!;

  return <main className="mizan-practice-detail" dir={ar ? "rtl" : "ltr"}>
    <section className="mizan-practice-hero">
      <div className="container mizan-practice-hero-inner">
        <nav className="mizan-practice-breadcrumb" aria-label={ar ? "مسار التنقل" : "Breadcrumb"}><Link href={"/" + locale}>{ar ? "الرئيسية" : "Home"}</Link><span>／</span><Link href={"/" + locale + "/services"}>{ar ? "الخدمات" : "Services"}</Link><span>／</span><span aria-current="page">{item.title}</span></nav>
        <div className="mizan-practice-hero-grid">
          <div className="mizan-practice-hero-copy"><span className="mizan-editorial-eyebrow">{ar ? "مجالات الممارسة · ميزان" : "PRACTICE AREAS · MIZAN"}</span><h1>{item.title}</h1><p>{item.summary}</p><div className="mizan-practice-hero-actions"><Link className="mizan-practice-primary" href={"/" + locale + "/contact"}>{ar ? "ناقش موضوعك مع المكتب" : "Discuss your matter"} <span>↗</span></Link><Link className="mizan-practice-secondary" href={"/" + locale + "/services"}>{ar ? "كل مجالات الممارسة" : "All practice areas"}</Link></div></div>
          <div className="mizan-practice-hero-art" aria-hidden="true"><div className="mizan-practice-art-orbit"></div><div className="mizan-practice-art-seal">§</div><span className="mizan-practice-art-label">{ar ? "الوضوح · العدالة · الثقة" : "CLARITY · JUSTICE · TRUST"}</span><span className="mizan-practice-art-index">M / 0{Object.keys(practiceAreas).indexOf(slug) + 1}</span></div>
        </div>
        <div className="mizan-practice-hero-foot"><span>{ar ? "شرح قانوني مبسّط" : "Plain-language guidance"}</span><span>{ar ? "خصوصية واحترام" : "Privacy and respect"}</span><span>{ar ? "خطوات واضحة" : "Clear next steps"}</span></div>
      </div>
    </section>

    <section className="section mizan-practice-overview"><div className="container mizan-practice-overview-grid">
      <div><span className="mizan-editorial-kicker">{ar ? "كيف نساعدك؟" : "HOW WE CAN HELP"}</span><h2>{ar ? "ابدأ بفهم المسألة، ثم حدّد الخطوة التالية." : "Understand the matter. Then choose your next step."}</h2><p className="mizan-practice-section-intro">{ar ? "تعتمد المعالجة القانونية على تفاصيل كل حالة والمستندات والقواعد السارية. نساعدك على تنظيم الصورة وفهم الأسئلة التي تستحق المراجعة." : "The appropriate legal approach depends on the facts, documents, and applicable rules. We help organize the picture and identify the questions that need review."}</p>
        <ul className="mizan-practice-help-list">{item.details.map((detail, index) => <li key={detail}><span>0{index + 1}</span><p>{detail}</p><b>↗</b></li>)}</ul>
      </div>
      <aside className="mizan-practice-side-card"><span className="mizan-practice-side-icon">✳</span><span className="mizan-editorial-kicker">{ar ? "ما الذي تتوقعه؟" : "WHAT TO EXPECT"}</span><h3>{ar ? "معلومة واضحة دون وعود غير مضمونة." : "Clear information, without unrealistic promises."}</h3><p>{ar ? "تختلف الإجراءات والنتائج بحسب الوقائع والقانون المنطبق. بعد فهم موضوعك، يمكن مناقشة المستندات المطلوبة والخطوات المحتملة." : "Procedures and outcomes vary with the facts and applicable law. Once your matter is understood, relevant documents and possible next steps can be discussed."}</p><Link href={"/" + locale + "/contact"}>{ar ? "تواصل مع المكتب" : "Contact the office"} <span>↗</span></Link></aside>
    </div></section>

    <section className="mizan-practice-topics"><div className="container"><div className="mizan-editorial-section-head"><div><span className="mizan-editorial-kicker">{ar ? "نطاق الموضوع" : "AREAS TO EXPLORE"}</span><h2>{ar ? "موضوعات قد ترتبط بمجالك." : "Topics that may relate to your matter."}</h2></div><p>{ar ? "هذه أمثلة عامة وليست قائمة حصرية أو تأكيدًا بقبول قضية بعينها." : "These are general examples, not an exhaustive list or a guarantee that a matter will be accepted."}</p></div><div className="mizan-practice-topic-grid">{item.topics.map((topic, index) => <article key={topic}><span>{["◈", "⌁", "✳"][index % 3]}</span><h3>{topic}</h3><small>0{index + 1}</small></article>)}</div></div></section>

    <section className="mizan-practice-constitution"><div className="container mizan-practice-constitution-inner"><div className="mizan-practice-constitution-heading"><span className="mizan-editorial-kicker">{ar ? "من الإطار الدستوري المصري" : "EGYPTIAN CONSTITUTIONAL FRAMEWORK"}</span><h2>{ar ? "مبادئ دستورية ذات صلة." : "Relevant constitutional principles."}</h2><p>{ar ? "يعرض هذا القسم مبادئ دستورية عامة قد تتصل بالمجال، ولا يعني أن الدستور وحده يحدد تفاصيل كل نزاع؛ فالتطبيق يعتمد على التشريعات ذات الصلة والوقائع." : "This section highlights general constitutional principles that may relate to the practice area. The Constitution alone does not determine every dispute; applicable legislation and facts matter."}</p></div><div className="mizan-practice-article-grid">{item.constitutional.map((entry) => <article key={entry.article}><span className="mizan-practice-article-number">{entry.article}</span><h3>{entry.title}</h3><p>{entry.text}</p></article>)}</div><p className="mizan-practice-legal-note">{ar ? "تنبيه: هذا شرح توعوي عام لنصوص ومبادئ دستورية، وليس فتوى أو استشارة لحالة محددة. ينبغي الرجوع إلى النص الرسمي المحدث والتشريعات المنطبقة." : "Note: This is general educational information about constitutional provisions, not an opinion or advice on a specific case. Consult the current official text and applicable legislation."}</p></div></section>

    <section className="mizan-practice-final"><div className="container"><span className="mizan-editorial-kicker">{ar ? "الخطوة التالية تبدأ بسؤال واضح" : "A CLEAR QUESTION IS A GOOD NEXT STEP"}</span><h2>{ar ? "هل تريد مناقشة تفاصيل موضوعك؟" : "Would you like to discuss your situation?"}</h2><p>{ar ? "تواصل مع المكتب لعرض ملخص عام عن المسألة ومعرفة المعلومات التي قد تحتاج إلى تجهيزها." : "Contact the office with a general outline of your matter and learn what information may be useful to prepare."}</p><Link href={"/" + locale + "/contact"}>{ar ? "ابدأ التواصل" : "Start a conversation"} ↗</Link></div></section>
    <footer className="mizan-practice-disclaimer"><div className="container">{ar ? "المحتوى للتوعية العامة فقط ولا يُعد استشارة قانونية أو ضمانًا لنتيجة. قد تتغير القوانين والتفسيرات بحسب التعديلات والوقائع." : "This content is for general information only and is not legal advice or a guarantee of outcome. Laws and interpretations may change based on amendments and facts."}</div></footer>
  </main>;
}
