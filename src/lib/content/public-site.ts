import type { Locale } from "@/lib/i18n/config";

export const practiceAreas = {
  civil: {
    ar: { title: "القانون المدني", summary: "إطار ينظم كثيرًا من المعاملات والالتزامات والحقوق الخاصة والتعويض عن الضرر.", details: ["فهم طبيعة العلاقة القانونية والمستندات المتبادلة", "مراجعة الالتزامات والمطالبات والتعويضات المحتملة", "شرح مسارات تسوية النزاع والإجراءات ذات الصلة"], constitutional: [{ article: "المادة 35", title: "حماية الملكية", text: "تكفل حماية الملكية الخاصة وفقًا للقانون، وهو مبدأ قد يكون ذا صلة ببعض المنازعات المدنية." }, { article: "المادة 97", title: "حق التقاضي", text: "تكفل حق التقاضي وتحظر تحصين أي عمل أو قرار إداري من رقابة القضاء." }], topics: ["الالتزامات والتعويض", "المطالبات المدنية", "الملكية والحقوق الخاصة"] },
    en: { title: "Civil law", summary: "A framework governing many private rights, obligations, transactions, and claims for harm.", details: ["Understand the legal relationship and exchanged documents", "Review obligations, claims, and potential compensation", "Explain relevant dispute-resolution routes and procedures"], constitutional: [{ article: "Article 35", title: "Property protection", text: "Protects private property in accordance with the law and may be relevant to some civil disputes." }, { article: "Article 97", title: "Right to litigate", text: "Guarantees access to courts and prohibits immunizing administrative acts or decisions from judicial review." }], topics: ["Obligations and compensation", "Civil claims", "Property and private rights"] },
  },
  business: {
    ar: { title: "القانون التجاري", summary: "قواعد تنظم جوانب من الأعمال والمعاملات التجارية والعلاقات بين التجار والشركات.", details: ["مراجعة الاتفاقيات والمراسلات التجارية", "تحديد المسائل التي تحتاج إلى تدقيق في الالتزامات والمواعيد", "توضيح الخيارات العامة عند نشوء خلاف تجاري"], constitutional: [{ article: "المادة 27", title: "النشاط الاقتصادي", text: "تتناول تنظيم النشاط الاقتصادي وأهدافه وضماناته العامة؛ أما التفاصيل التجارية فتحددها القوانين المنظمة." }, { article: "المادة 97", title: "حق التقاضي", text: "توفر الإطار الدستوري العام للجوء إلى القضاء عند توافر شروط الدعوى." }], topics: ["المعاملات التجارية", "نزاعات الأعمال", "اتفاقيات الشركات"] },
    en: { title: "Commercial law", summary: "Rules governing aspects of business transactions and relationships between merchants and companies.", details: ["Review commercial agreements and correspondence", "Identify obligations and deadlines requiring closer review", "Explain general options when a commercial dispute arises"], constitutional: [{ article: "Article 27", title: "Economic activity", text: "Addresses the general organization, aims, and guarantees of economic activity; specific commercial rules come from legislation." }, { article: "Article 97", title: "Right to litigate", text: "Provides the general constitutional framework for access to courts when procedural requirements are met." }], topics: ["Commercial transactions", "Business disputes", "Company agreements"] },
  },
  criminal: {
    ar: { title: "القانون الجنائي", summary: "يتناول التجريم والعقاب وضمانات التحقيق والمحاكمة وحقوق الدفاع وفق القانون.", details: ["تنظيم الوقائع والتواريخ والمستندات المتاحة", "شرح الضمانات الإجرائية العامة وحق الاستعانة بمحامٍ", "توضيح أهمية الالتزام بالمواعيد والإجراءات الرسمية"], constitutional: [{ article: "المادة 96", title: "قرينة البراءة والمحاكمة العادلة", text: "تقرر أن المتهم بريء حتى تثبت إدانته في محاكمة قانونية عادلة تكفل له ضمانات الدفاع." }, { article: "المادة 98", title: "حق الدفاع", text: "حق الدفاع أصالة أو بالوكالة مكفول، وتكفل الدولة لغير القادرين ماليًا وسائل الدفاع وفقًا للقانون." }], topics: ["ضمانات التحقيق والمحاكمة", "حق الدفاع", "الإجراءات الجنائية"] },
    en: { title: "Criminal law", summary: "Addresses offences, penalties, and safeguards during investigation and trial under the law.", details: ["Organize relevant events, dates, and available documents", "Explain general procedural safeguards and access to counsel", "Highlight the importance of official deadlines and procedures"], constitutional: [{ article: "Article 96", title: "Presumption of innocence and fair trial", text: "Provides that an accused person is presumed innocent until proven guilty in a fair legal trial with defense guarantees." }, { article: "Article 98", title: "Right of defence", text: "Guarantees the right of defence in person or by proxy and state support for those unable to afford it, as regulated by law." }], topics: ["Investigation and trial safeguards", "Right of defence", "Criminal procedure"] },
  },
  family: {
    ar: { title: "قانون الأسرة والأحوال الشخصية", summary: "ينظم مسائل أسرية وشخصية متعددة، وتختلف القواعد والإجراءات بحسب نوع المسألة والقانون المنطبق.", details: ["الاستماع إلى الوقائع مع مراعاة الخصوصية", "تحديد المستندات والمعلومات اللازمة لفهم المسألة", "شرح الإجراءات العامة والخيارات التي قد تكون متاحة"], constitutional: [{ article: "المادة 10", title: "الأسرة والتماسك المجتمعي", text: "تؤكد أن الأسرة أساس المجتمع، وتلتزم الدولة بحماية تماسكها واستقرارها." }, { article: "المادة 11", title: "المساواة وحماية المرأة", text: "تقرر مبادئ المساواة وتكافؤ الفرص والحماية من صور العنف وفقًا لما يحدده الدستور والقانون." }], topics: ["مسائل الأسرة", "الحقوق والالتزامات الأسرية", "الإجراءات أمام الجهات المختصة"] },
    en: { title: "Family and personal status law", summary: "Governs a range of family and personal matters, with rules depending on the issue and applicable law.", details: ["Listen to the circumstances with respect for privacy", "Identify documents and information needed to understand the matter", "Explain general procedures and options that may be available"], constitutional: [{ article: "Article 10", title: "Family and social cohesion", text: "Recognizes the family as the basis of society and requires the state to protect its cohesion and stability." }, { article: "Article 11", title: "Equality and protection of women", text: "Sets out principles of equality, equal opportunity, and protection against forms of violence as provided by the Constitution and law." }], topics: ["Family matters", "Family rights and obligations", "Procedures before competent authorities"] },
  },
  contracts: {
    ar: { title: "العقود والاستشارات القانونية", summary: "مراجعة وصياغة العقود لفهم الحقوق والالتزامات وتقليل الغموض قبل اتخاذ القرار.", details: ["مراجعة أطراف العقد ونطاقه ومدته", "توضيح الالتزامات المالية وشروط الإنهاء وتسوية النزاعات", "تحديد البنود التي تستلزم مراجعة أو تفاوضًا إضافيًا"], constitutional: [{ article: "المادة 94", title: "سيادة القانون", text: "تقرر خضوع الدولة للقانون واستقلال القضاء، وهي من المبادئ العامة الحاكمة للنظام القانوني." }, { article: "المادة 35", title: "حماية الملكية", text: "تقرر حماية الملكية الخاصة وفقًا للقانون؛ أما صحة العقد وآثاره فتتحدد وفق القواعد القانونية المنطبقة." }], topics: ["صياغة ومراجعة العقود", "الالتزامات والإنهاء", "تسوية المنازعات"] },
    en: { title: "Contracts and legal counsel", summary: "Reviewing and drafting agreements to clarify rights and obligations before decisions are made.", details: ["Review the parties, scope, and duration", "Clarify financial obligations, termination, and dispute-resolution terms", "Flag clauses that may need further review or negotiation"], constitutional: [{ article: "Article 94", title: "Rule of law", text: "Establishes that the state is subject to law and recognizes judicial independence as a foundational principle." }, { article: "Article 35", title: "Property protection", text: "Protects private property under the law; contract validity and effects depend on applicable legal rules." }], topics: ["Contract drafting and review", "Obligations and termination", "Dispute resolution"] },
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
