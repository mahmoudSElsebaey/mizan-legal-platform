import type { Locale } from "@/lib/i18n/config";

export const practiceAreas = {
  civil: {
    ar: { title: "القضايا المدنية", summary: "مساعدة قانونية في النزاعات المدنية والمطالبات وحماية الحقوق.", details: ["فهم الوقائع والمستندات ذات الصلة", "توضيح الخيارات والإجراءات المحتملة", "شرح المستندات والخطوات التالية بلغة واضحة"] },
    en: { title: "Civil matters", summary: "Guidance on civil disputes, claims, and protecting your rights.", details: ["Understand the relevant facts and documents", "Explain potential options and procedures", "Clarify documents and next steps in plain language"] },
  },
  business: {
    ar: { title: "قانون الشركات والأعمال", summary: "دعم قانوني يساعد أصحاب الأعمال على اتخاذ قرارات أكثر وضوحًا.", details: ["مراجعة المستندات والاتفاقيات التجارية", "توضيح الاعتبارات القانونية للقرارات", "المساعدة في تحديد المخاطر التعاقدية"] },
    en: { title: "Business law", summary: "Practical legal support to help businesses make clearer decisions.", details: ["Review commercial documents and agreements", "Explain legal considerations behind decisions", "Identify contractual risks for further review"] },
  },
  family: {
    ar: { title: "الأحوال الشخصية", summary: "توجيه قانوني يحترم خصوصية المسائل الأسرية وحساسيتها.", details: ["الاستماع إلى الظروف بعناية واحترام", "شرح الإجراءات والخيارات المتاحة", "التعامل مع المعلومات الشخصية بسرية"] },
    en: { title: "Family matters", summary: "Respectful guidance for sensitive personal and family matters.", details: ["Listen carefully and respectfully to the circumstances", "Explain available procedures and options", "Treat personal information confidentially"] },
  },
  contracts: {
    ar: { title: "صياغة ومراجعة العقود", summary: "صياغة ومراجعة تساعد على فهم الالتزامات وتحديد المخاطر.", details: ["مراجعة البنود والالتزامات الأساسية", "توضيح النقاط التي تحتاج إلى تفاوض أو مراجعة", "صياغة شروط أكثر وضوحًا بحسب المعلومات المقدمة"] },
    en: { title: "Contracts", summary: "Drafting and review to clarify obligations and identify potential risks.", details: ["Review key terms and obligations", "Flag points that may need negotiation or further review", "Draft clearer terms based on the information provided"] },
  },
} as const;

export const officeContent = {
  ar: {
    title: "عن مكتب ميزان",
    intro: "نؤمن أن التواصل القانوني الجيد يبدأ بالاستماع، ويعتمد على الوضوح والاحترام والخصوصية.",
    principles: [
      { title: "وضوح قبل كل شيء", description: "نشرح المعلومات والخيارات المتاحة بلغة مفهومة، دون وعود بنتائج غير مضمونة." },
      { title: "خصوصية واحترام", description: "نتعامل مع تفاصيل المسائل القانونية بحساسية ونراعي خصوصية أصحابها." },
      { title: "خطوات مدروسة", description: "نساعد على فهم الخطوة التالية والمعلومات التي قد تحتاج إلى تجهيزها." },
    ],
  },
  en: {
    title: "About Mizan Legal",
    intro: "We believe good legal communication begins with listening and is grounded in clarity, respect, and privacy.",
    principles: [
      { title: "Clarity first", description: "We explain information and available options in plain language, without promising uncertain outcomes." },
      { title: "Privacy and respect", description: "We treat legal matters sensitively and respect the privacy of the people involved." },
      { title: "Thoughtful next steps", description: "We help clarify what comes next and which information may need to be prepared." },
    ],
  },
} as const;

export const lawyerContent = {
  ar: {
    title: "التعرّف على المحامي",
    intro: "ستُضاف هنا النبذة المهنية المعتمدة للمحامي بعد تزويدنا بالبيانات الصحيحة ومراجعتها.",
    notice: "الاسم، المؤهلات، رقم القيد، سنوات الخبرة، والصورة الشخصية غير مضافة حاليًا لتجنب نشر معلومات غير مؤكدة.",
    sections: [
      { title: "المؤهلات والخبرة", description: "تُحدّث هذه المساحة بالمؤهلات والخبرات التي يؤكدها المكتب." },
      { title: "مجالات الممارسة", description: "تُعرض مجالات العمل المعتمدة بعد مراجعتها مع المحامي." },
      { title: "التواصل", description: "يمكنك التواصل مع المكتب للاستفسار عن إمكانية المساعدة في موضوعك." },
    ],
  },
  en: {
    title: "Meet the lawyer",
    intro: "The lawyer’s approved professional biography will appear here once accurate details have been provided and reviewed.",
    notice: "Name, qualifications, bar registration, years of experience, and portrait are omitted for now to avoid publishing unverified information.",
    sections: [
      { title: "Qualifications and experience", description: "This section will be updated with credentials and experience confirmed by the office." },
      { title: "Practice areas", description: "Approved practice areas will be listed after review with the lawyer." },
      { title: "Contact", description: "Contact the office to ask whether it may be able to assist with your matter." },
    ],
  },
} as const;

export const insightsContent: Record<Locale, { title: string; intro: string; articles: { slug: string; title: string; summary: string; category: string }[] }> = {
  ar: {
    title: "مقالات ورؤى قانونية",
    intro: "محتوى توعوي عام يساعد على فهم بعض المفاهيم القانونية، ولا يغني عن استشارة تناسب ظروف كل حالة.",
    articles: [
      { slug: "before-signing-a-contract", title: "ما الذي ينبغي مراجعته قبل توقيع عقد؟", summary: "نقاط عامة لفهم الالتزامات والمدة وشروط الإنهاء قبل التوقيع.", category: "العقود" },
      { slug: "prepare-for-a-consultation", title: "كيف تستعد لاستشارة قانونية؟", summary: "طريقة تنظيم الوقائع والمستندات والأسئلة لتسهيل مناقشة الموضوع.", category: "إرشادات" },
      { slug: "keep-important-documents", title: "تنظيم المستندات القانونية المهمة", summary: "خطوات عملية للاحتفاظ بنسخ واضحة من المستندات والمراسلات ذات الصلة.", category: "إرشادات" },
    ],
  },
  en: {
    title: "Legal insights",
    intro: "General educational content to help explain legal concepts. It is not a substitute for advice tailored to your circumstances.",
    articles: [
      { slug: "before-signing-a-contract", title: "What to review before signing a contract", summary: "General points to understand obligations, duration, and termination terms before signing.", category: "Contracts" },
      { slug: "prepare-for-a-consultation", title: "How to prepare for a legal consultation", summary: "Organize facts, documents, and questions to make a consultation more productive.", category: "Guidance" },
      { slug: "keep-important-documents", title: "Organizing important legal documents", summary: "Practical steps for keeping clear copies of relevant documents and correspondence.", category: "Guidance" },
    ],
  },
};

export const articleDetails: Record<string, Record<Locale, { title: string; intro: string; points: string[] }>> = {
  "before-signing-a-contract": {
    ar: { title: "ما الذي ينبغي مراجعته قبل توقيع عقد؟", intro: "تختلف المتطلبات بحسب نوع العقد والقانون المنطبق، لكن مراجعة البنود الأساسية تساعد على فهم ما توافق عليه.", points: ["تحقق من أسماء الأطراف وصفاتهم وصحة البيانات الأساسية.", "اقرأ نطاق الالتزامات والمقابل المالي والمواعيد بدقة.", "راجع شروط التجديد والإنهاء والتعويض وتسوية النزاعات.", "احتفظ بنسخة نهائية موقعة وبالمرفقات المشار إليها في العقد."] },
    en: { title: "What to review before signing a contract", intro: "Requirements vary by contract type and applicable law, but reviewing key terms helps you understand what you are agreeing to.", points: ["Check party names, capacities, and core details.", "Read the scope of obligations, fees, and deadlines carefully.", "Review renewal, termination, liability, and dispute-resolution clauses.", "Keep a signed final copy and all referenced attachments."] },
  },
  "prepare-for-a-consultation": {
    ar: { title: "كيف تستعد لاستشارة قانونية؟", intro: "التحضير المسبق يساعد على استثمار وقت الاستشارة وفهم الموضوع بصورة أوضح.", points: ["اكتب ملخصًا زمنيًا للوقائع والتواريخ المهمة.", "جهّز نسخًا من العقود والمراسلات والإخطارات ذات الصلة.", "دوّن أسئلتك والنتيجة التي تسعى إلى فهم الخيارات بشأنها.", "لا ترسل بيانات شديدة الحساسية إلا عبر وسيلة تواصل مناسبة وآمنة."] },
    en: { title: "How to prepare for a legal consultation", intro: "Preparing in advance can make a consultation more focused and help clarify the issue.", points: ["Write a short timeline of events and important dates.", "Gather relevant contracts, correspondence, and notices.", "List your questions and what outcome you want to explore.", "Avoid sending highly sensitive information through an unsuitable or insecure channel."] },
  },
  "keep-important-documents": {
    ar: { title: "تنظيم المستندات القانونية المهمة", intro: "يساعد التنظيم الجيد على الوصول إلى المعلومات ذات الصلة عند الحاجة، مع مراعاة حفظها بأمان.", points: ["استخدم أسماء ملفات واضحة تتضمن التاريخ ونوع المستند.", "احتفظ بنسخ احتياطية في مكان آمن ومناسب.", "افصل المستندات حسب الموضوع أو القضية.", "تحقق من المتطلبات القانونية الخاصة بالاحتفاظ بالأصول أو تقديمها."] },
    en: { title: "Organizing important legal documents", intro: "Good organization makes relevant information easier to find while helping keep it secure.", points: ["Use clear filenames that include the date and document type.", "Keep backups in an appropriate secure location.", "Group documents by matter or case.", "Check legal requirements for retaining or submitting original documents."] },
  },
};

export function getPracticeArea(slug: string, locale: Locale) {
  const area = practiceAreas[slug as keyof typeof practiceAreas];
  return area ? { slug, ...area[locale] } : undefined;
}
