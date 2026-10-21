import type { Locale } from "./config";
export const dictionaries = {
  ar: {
    nav: { home: "الرئيسية", services: "مجالاتنا", about: "عن المكتب", contact: "تواصل معنا", book: "احجز استشارة" },
    hero: { eyebrow: "وضوح قانوني. ثقة تبني المستقبل.", title: "حقوقك تستحق\nرؤية واضحة.", description: "نحوّل التعقيد القانوني إلى خطوات مفهومة، باستشارة دقيقة وتواصل إنساني يحترم وقتك وخصوصيتك.", primary: "احجز استشارة", secondary: "اكتشف مجالاتنا", note: "خصوصيتك أولويتنا، وكل خطوة تبدأ بالاستماع." },
    trust: [{value:"01",label:"استماع قبل الحل"},{value:"02",label:"خطوات واضحة"},{value:"03",label:"سرية واهتمام"}],
    services: { eyebrow:"كيف نساعدك", title:"خبرة قانونية، بلغة واضحة.", description:"نبدأ بفهم موقفك، ثم نوضح الخيارات المتاحة والخطوة الأنسب لحالتك.", items:[{number:"01",title:"القضايا المدنية",description:"دعم قانوني في النزاعات المدنية والمطالبات والحقوق."},{number:"02",title:"قانون الشركات",description:"مراجعة العقود والاستشارات التي تدعم قرارات أعمالك."},{number:"03",title:"الأحوال الشخصية",description:"توجيه قانوني باحترام وخصوصية في المسائل الأسرية."},{number:"04",title:"صياغة العقود",description:"صياغة ومراجعة واضحة تساعد على تقليل المخاطر."}]},
    about:{eyebrow:"نهجنا",title:"القانون لا يجب أن يكون غامضًا.",description:"نؤمن أن الاستشارة الجيدة لا تكتفي بذكر النصوص؛ بل تشرح معناها، والخيارات المتاحة، وما يمكن توقعه بعد ذلك."},
    cta:{title:"ابدأ بمحادثة واضحة.",description:"شاركنا الخطوط العامة لموضوعك، وسنساعدك على معرفة الخطوة التالية.",button:"تواصل مع المكتب"},
    footer:"معلومات الموقع تعريفية عامة ولا تُعد استشارة قانونية أو ضمانًا لنتيجة قضية."
  },
  en: {
    nav: { home:"Home", services:"Practice areas", about:"About", contact:"Contact", book:"Book a consultation" },
    hero: { eyebrow:"Legal clarity. Confidence for what comes next.", title:"Your rights deserve\na clearer path.", description:"We turn legal complexity into understandable next steps through thoughtful advice and communication that respects your time and privacy.", primary:"Book a consultation", secondary:"Explore practice areas", note:"Your privacy comes first. Every matter begins with listening." },
    trust:[{value:"01",label:"Listen before advising"},{value:"02",label:"Clear next steps"},{value:"03",label:"Privacy and care"}],
    services:{eyebrow:"How we can help",title:"Legal expertise, in plain language.",description:"We start by understanding your situation, then explain the available options and a sensible next step.",items:[{number:"01",title:"Civil matters",description:"Guidance on civil disputes, claims, and protecting your rights."},{number:"02",title:"Business law",description:"Contract reviews and practical advice for business decisions."},{number:"03",title:"Family matters",description:"Respectful, confidential guidance for sensitive family issues."},{number:"04",title:"Contracts",description:"Clear drafting and review to help identify and reduce risk."}]},
    about:{eyebrow:"Our approach",title:"The law should not feel like a mystery.",description:"Good legal advice does more than quote rules. It explains what they mean, which options may be available, and what to expect next."},
    cta:{title:"Start with a clear conversation.",description:"Share a brief overview of your matter and we will help you understand the next step.",button:"Contact the office"},
    footer:"Website content is general information, not legal advice or a guarantee of any case outcome."
  }
} as const satisfies Record<Locale, object>;
export function getDictionary(locale: Locale) { return dictionaries[locale]; }
