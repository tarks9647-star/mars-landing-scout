import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const en = {
  appName: "ARES·RECON",
  appTagline: "Martian Landing Reconnaissance",
  guide: "Guide",
  guideAria: "Open guide and app information",
  langToggle: "عربي",
  langAria: "Switch language to Arabic",
  linkStatus: "Orbital link nominal",

  "map.geology.title": "Crater Geology",
  "map.geology.sub": "False-color mineral mosaic",
  "map.traverse.title": "Rover Traverse",
  "map.traverse.sub": "HiRISE path-planning strip",
  "map.elevation.title": "Global Elevation",
  "map.elevation.sub": "Planetary relief raster",
  fitView: "Fit",
  nativeView: "Native 1:1",
  cursor: "Cursor",
  target: "Target",
  pixel: "PX",
  grid: "Grid",
  calibrating: "Calibrating sensor raster…",
  clickHint: "Click anywhere on the map to drop a landing target",
  keyboardHint: "Arrow keys nudge the active target",
  globalRef: "Equirectangular · planetocentric",
  localRef: "Local grid · nominal reference",
  resolution: "Native resolution",
  mapAria: "Mars map. Click to select a landing target.",

  selectedSite: "Selected landing site",
  "verdict.go": "GO for landing",
  "verdict.caution": "Caution",
  "verdict.nogo": "NO-GO",
  safetyScore: "Safety score",
  missionRisk: "Mission risk",
  slope: "Est. slope",
  elevation: "Elevation",
  iceDistance: "Water ice",
  surfaceTemp: "Surface temp",
  riskProfile: "Risk profile",
  composition: "Rock & mineral composition",
  thermalStream: "Live thermal telemetry",
  iceProximity: "Water ice proximity",

  "risk.terrain": "Roughness",
  "risk.slope": "Slope",
  "risk.hazard": "Hazards",
  "risk.altitude": "Altitude",
  "risk.thermal": "Thermal",
  "risk.dust": "Dust",

  "min.basalt": "Basalt",
  "min.ironOxide": "Iron oxides",
  "min.sulfates": "Sulfates",
  "min.clays": "Clays",
  "min.dust": "Dust / regolith",

  iceIndex: "Ice likelihood",
  iceDepth: "Est. depth",
  iceDist: "Nearest deposit",
  tempMin: "Night low",
  tempMax: "Day high",
  tempMean: "Mean",
  temperature: "Temperature",
  wind: "Wind",
  pressure: "Pressure",
  localTime: "Local solar time",
  live: "LIVE",
  targetLog: "Target log",
  noTargets: "No targets yet",
  awaitingTarget: "Awaiting target lock…",
  footerNote: "Readings are model estimates derived from image data — not mission-certified.",

  guideTitle: "Mission Guide",
  guideIntro:
    "ARES·RECON turns NASA Mars imagery into a landing reconnaissance console. Drop a target anywhere and the console reads the raster under it to estimate how safe it is to land there.",
  guideFeaturesTitle: "What it offers",
  "feature.maps.title": "Native NASA rasters",
  "feature.maps.desc": "Crater geology, rover traverse and global elevation maps at full resolution.",
  "feature.inspect.title": "Free point inspection",
  "feature.inspect.desc": "Click-to-target crosshairs with live coordinate tracking.",
  "feature.telemetry.title": "Live telemetry",
  "feature.telemetry.desc": "Safety score, risk profile, composition, ice and thermal charts update instantly.",
  "feature.log.title": "Target log",
  "feature.log.desc": "Compare recent candidate sites and jump back to any of them.",
  "feature.lang.title": "Bilingual console",
  "feature.lang.desc": "Switch between English and Arabic with full right-to-left layout.",
  guideStepsTitle: "How to use it",
  "step.1": "Choose a map from the tabs above the viewer.",
  "step.2": "Move the cursor to read live coordinates, then click to lock a target.",
  "step.3": "Read the verdict and safety score at the top of the dashboard.",
  "step.4": "Inspect risk, composition, water ice and live temperature charts.",
  "step.5": "Use Native 1:1 to inspect fine detail, and arrow keys to nudge the target.",
  guideNote:
    "Scores are modelled from albedo, texture and color of the imagery plus latitude and elevation. Use them for exploration, not flight decisions.",
  guideClose: "Start reconnaissance",
};

export type TranslationKey = keyof typeof en;

const ar: Record<TranslationKey, string> = {
  appName: "ARES·RECON",
  appTagline: "استطلاع مواقع الهبوط على المريخ",
  guide: "الدليل",
  guideAria: "فتح الدليل ومعلومات التطبيق",
  langToggle: "EN",
  langAria: "التبديل إلى الإنجليزية",
  linkStatus: "الارتباط المداري مستقر",

  "map.geology.title": "جيولوجيا الفوهة",
  "map.geology.sub": "فسيفساء معدنية بألوان مُعزَّزة",
  "map.traverse.title": "مسار المركبة",
  "map.traverse.sub": "شريط تخطيط المسار HiRISE",
  "map.elevation.title": "الارتفاع العالمي",
  "map.elevation.sub": "خريطة تضاريس الكوكب",
  fitView: "ملاءمة",
  nativeView: "الدقة الأصلية",
  cursor: "المؤشر",
  target: "الهدف",
  pixel: "بكسل",
  grid: "الشبكة",
  calibrating: "جارٍ معايرة بيانات المستشعر…",
  clickHint: "انقر في أي مكان على الخريطة لتحديد هدف الهبوط",
  keyboardHint: "استخدم الأسهم لتحريك الهدف النشط",
  globalRef: "إسقاط متساوي المستطيلات · مركزي",
  localRef: "شبكة محلية · مرجع تقريبي",
  resolution: "الدقة الأصلية",
  mapAria: "خريطة المريخ. انقر لاختيار هدف الهبوط.",

  selectedSite: "موقع الهبوط المحدد",
  "verdict.go": "صالح للهبوط",
  "verdict.caution": "حذر",
  "verdict.nogo": "غير صالح",
  safetyScore: "درجة الأمان",
  missionRisk: "مخاطر المهمة",
  slope: "الانحدار التقديري",
  elevation: "الارتفاع",
  iceDistance: "الجليد المائي",
  surfaceTemp: "حرارة السطح",
  riskProfile: "ملف المخاطر",
  composition: "تركيب الصخور والمعادن",
  thermalStream: "القياس الحراري المباشر",
  iceProximity: "القرب من الجليد المائي",

  "risk.terrain": "الوعورة",
  "risk.slope": "الانحدار",
  "risk.hazard": "العوائق",
  "risk.altitude": "الارتفاع",
  "risk.thermal": "الحرارة",
  "risk.dust": "الغبار",

  "min.basalt": "بازلت",
  "min.ironOxide": "أكاسيد الحديد",
  "min.sulfates": "كبريتات",
  "min.clays": "طين",
  "min.dust": "غبار / ريغوليث",

  iceIndex: "احتمال الجليد",
  iceDepth: "العمق التقديري",
  iceDist: "أقرب ترسّب",
  tempMin: "أدنى ليلاً",
  tempMax: "أعلى نهاراً",
  tempMean: "المتوسط",
  temperature: "الحرارة",
  wind: "الرياح",
  pressure: "الضغط",
  localTime: "التوقيت الشمسي المحلي",
  live: "مباشر",
  targetLog: "سجل الأهداف",
  noTargets: "لا توجد أهداف بعد",
  awaitingTarget: "في انتظار تثبيت الهدف…",
  footerNote: "القراءات تقديرات نموذجية مستخلصة من بيانات الصور — وليست معتمدة للمهام.",

  guideTitle: "دليل المهمة",
  guideIntro:
    "يحوّل ARES·RECON صور ناسا للمريخ إلى لوحة استطلاع لمواقع الهبوط. ضع هدفاً في أي مكان وستقرأ اللوحة البيانات تحته لتقدير مدى أمان الهبوط هناك.",
  guideFeaturesTitle: "ما يقدّمه التطبيق",
  "feature.maps.title": "خرائط ناسا الأصلية",
  "feature.maps.desc": "خرائط جيولوجيا الفوهة ومسار المركبة والارتفاع العالمي بدقتها الكاملة.",
  "feature.inspect.title": "فحص حر لأي نقطة",
  "feature.inspect.desc": "تصويب بالنقر مع تتبّع مباشر للإحداثيات.",
  "feature.telemetry.title": "قياسات مباشرة",
  "feature.telemetry.desc": "درجة الأمان وملف المخاطر والتركيب والجليد والحرارة تتحدّث فوراً.",
  "feature.log.title": "سجل الأهداف",
  "feature.log.desc": "قارن المواقع المرشّحة الأخيرة وعُد إلى أي منها.",
  "feature.lang.title": "واجهة ثنائية اللغة",
  "feature.lang.desc": "بدّل بين العربية والإنجليزية مع تخطيط كامل من اليمين إلى اليسار.",
  guideStepsTitle: "طريقة الاستخدام",
  "step.1": "اختر خريطة من الألسنة أعلى العارض.",
  "step.2": "حرّك المؤشر لقراءة الإحداثيات مباشرة، ثم انقر لتثبيت الهدف.",
  "step.3": "اقرأ الحكم ودرجة الأمان أعلى لوحة القياسات.",
  "step.4": "افحص مخططات المخاطر والتركيب والجليد المائي والحرارة المباشرة.",
  "step.5": "استخدم الدقة الأصلية لرؤية التفاصيل الدقيقة، والأسهم لتحريك الهدف.",
  guideNote:
    "تُحسب الدرجات من سطوع الصورة ونسيجها ولونها إضافةً إلى خط العرض والارتفاع. استخدمها للاستكشاف لا لقرارات الطيران.",
  guideClose: "ابدأ الاستطلاع",
};

export type Lang = "en" | "ar";
const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, ar };
const STORAGE_KEY = "ares-recon-lang";

interface I18nValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: TranslationKey) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ar" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const t = useCallback((key: TranslationKey) => dictionaries[lang][key] ?? key, [lang]);
  const toggleLang = useCallback(() => setLang((l) => (l === "en" ? "ar" : "en")), []);

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", t, toggleLang }),
    [lang, t, toggleLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function formatLat(lat: number, lang: Lang) {
  const hemi = lat >= 0 ? (lang === "ar" ? "ش" : "N") : lang === "ar" ? "ج" : "S";
  return `${Math.abs(lat).toFixed(2)}°${hemi}`;
}

export function formatLon(lon: number, lang: Lang) {
  const hemi = lon >= 0 ? (lang === "ar" ? "شر" : "E") : lang === "ar" ? "غ" : "W";
  return `${Math.abs(lon).toFixed(2)}°${hemi}`;
}
