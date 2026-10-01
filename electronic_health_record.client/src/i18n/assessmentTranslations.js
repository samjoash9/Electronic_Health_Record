// Tagalog and Cebuano (Bisaya) wording for the station 2 wellness assessment.
//
// !! NEEDS CLINICAL REVIEW !!
// This wording was drafted by a developer pass, not by a clinician or a
// professional translator. Have a Tagalog- and a Cebuano-speaking staff
// member read it against the English before it is used with real patients:
// a mistranslated symptom question changes what a patient reports, and the
// score derived from it is used clinically. Nothing here is wired to fail
// loudly if the wording is wrong -- only a human read will catch that.
//
// Kept on the client rather than in the AssessmentQuestions table so this
// ships without a migration. The trade-off: if someone edits a question's
// English text in the database, the translation here does not follow, and
// the patient silently reads outdated wording. `assessmentText` in
// ../lib/assessmentText.js is the only reader; it falls back to English
// whenever a key is missing, so an untranslated or renamed question
// degrades to English instead of rendering blank.
//
// EVERYTHING is keyed by its English source text, not by ID. IDs looked
// like the stable choice but are not: the mock seed numbers these questions
// 101-705 while the database seeds the same 35 questions as 1-35, so an
// ID-keyed table matches only whichever backend it was written against and
// silently falls back to English on the other. The English text is
// identical in both, so it is the only key that works for both. Option
// labels are keyed the same way and lowercased -- the same handful
// ("Always", "Often", ...) is reused across ~10 questions each, so keying
// by text translates them once instead of 140 times.

/** Language codes this module can serve. `en` means "use the source text". */
export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'tl', label: 'Tagalog', short: 'TL' },
  { code: 'ceb', label: 'Bisaya', short: 'CEB' },
];

export const DEFAULT_LANGUAGE = 'en';

/** Category display names, keyed by the English name used in the template. */
export const CATEGORY_NAMES = {
  tl: {
    Spiritual: 'Espirituwal',
    Psychological: 'Sikolohikal',
    Mental: 'Pangkaisipan',
    Emotional: 'Damdamin',
    Physical: 'Pisikal',
    Financial: 'Pinansyal',
    Social: 'Panlipunan',
  },
  ceb: {
    Spiritual: 'Espirituwal',
    Psychological: 'Sikolohikal',
    Mental: 'Panghunahuna',
    Emotional: 'Pagbati',
    Physical: 'Pisikal',
    Financial: 'Pinansyal',
    Social: 'Sosyal',
  },
};

/** Question wording, keyed by the exact English source text. */
export const QUESTION_TEXT = {
  tl: {
    // Spiritual
    'Do you have a clear sense of purpose in life?': 'Malinaw ba sa iyo ang iyong layunin sa buhay?',
    'Do you feel inner peace most of the time?': 'Nararamdaman mo ba ang kapayapaan ng loob sa halos lahat ng oras?',
    'Do you regularly practice gratitude?': 'Regular ka bang nagpapasalamat?',
    'Do you find comfort in your faith or personal beliefs?': 'Nakakahanap ka ba ng kaaliwan sa iyong pananampalataya o paniniwala?',
    'Do you feel connected to something greater than yourself?': 'Nararamdaman mo bang may koneksyon ka sa isang bagay na mas dakila kaysa sa iyong sarili?',
    // Psychological
    'How would you rate your overall sense of self-worth?': 'Paano mo ilalarawan ang iyong pagpapahalaga sa sarili?',
    'How well do you bounce back after a setback?': 'Gaano ka kabilis makabangon matapos ang isang kabiguan?',
    'How confident are you in making everyday decisions?': 'Gaano ka katiwala sa iyong sarili sa paggawa ng pang-araw-araw na desisyon?',
    'Do you feel in control of your thoughts and reactions?': 'Nararamdaman mo bang kontrolado mo ang iyong isip at reaksyon?',
    'How would you describe your outlook on the future?': 'Paano mo ilalarawan ang iyong pananaw sa hinaharap?',
    // Mental
    'How would you rate your current stress level?': 'Paano mo ilalarawan ang antas ng iyong stress ngayon?',
    'How many hours of sleep do you get on average?': 'Ilang oras ka karaniwang natutulog?',
    'How would you describe your general mood lately?': 'Paano mo ilalarawan ang iyong pangkalahatang kalooban nitong mga nakaraang araw?',
    'Do you experience frequent anxiety or worry?': 'Madalas ka bang makaramdam ng pagkabalisa o pag-aalala?',
    'Do you have difficulty concentrating or focusing?': 'Nahihirapan ka bang mag-concentrate o mag-focus?',
    // Emotional
    'How comfortable are you expressing your feelings to others?': 'Gaano ka kakomportable sa pagsasabi ng iyong nararamdaman sa iba?',
    'How often do you experience sudden mood swings?': 'Gaano kadalas nagbabago nang biglaan ang iyong kalooban?',
    'Do you have someone you can turn to when you feel emotionally overwhelmed?': 'May taong mapagsasabihan ka ba kapag hindi mo na kaya ang iyong nararamdaman?',
    'How often do you feel overwhelmed by your emotions?': 'Gaano kadalas kang nadadaig ng iyong damdamin?',
    'How often do you feel joy or contentment in daily life?': 'Gaano kadalas kang nakakaramdam ng saya o kontento sa araw-araw?',
    // Physical
    'Do you experience any chronic pain?': 'Nakakaranas ka ba ng matagalang pananakit ng katawan?',
    'How often do you feel fatigued during the day?': 'Gaano kadalas kang nakakaramdam ng pagod sa buong araw?',
    'How is your appetite?': 'Kumusta ang iyong ganang kumain?',
    'How regular are your bowel movements?': 'Gaano karegular ang iyong pagdumi?',
    'Do you experience any urinary problems?': 'Nakakaranas ka ba ng problema sa pag-ihi?',
    // Financial
    'How often do you feel stressed about money?': 'Gaano kadalas kang nag-aalala tungkol sa pera?',
    'How well can you meet your monthly expenses?': 'Nakakayanan mo ba ang iyong buwanang gastusin?',
    'Do you have savings set aside for emergencies?': 'May naipon ka bang pera para sa emergency?',
    'How often do you worry about outstanding debts?': 'Gaano kadalas kang nag-aalala tungkol sa iyong mga utang?',
    'How confident are you in your financial future?': 'Gaano ka katiwala sa iyong kinabukasan sa pananalapi?',
    // Social
    'How would you rate your relationships with family and friends?': 'Paano mo ilalarawan ang iyong relasyon sa pamilya at mga kaibigan?',
    'How satisfied are you with your work-life balance?': 'Gaano ka kakontento sa balanse ng iyong trabaho at personal na buhay?',
    'Do you have people you can rely on for support?': 'May mga taong maaasahan ka ba kapag kailangan mo ng tulong?',
    'How often do you feel isolated or left out?': 'Gaano kadalas kang nakakaramdam na nag-iisa ka o naiiwan?',
    'How often do you take part in social or community activities?': 'Gaano kadalas kang sumasali sa mga gawaing panlipunan o pangkomunidad?',
  },
  ceb: {
    // Spiritual
    'Do you have a clear sense of purpose in life?': 'Klaro ba kanimo ang imong katuyoan sa kinabuhi?',
    'Do you feel inner peace most of the time?': 'Mobati ka ba ug kalinaw sa kasingkasing sa kadaghanan sa panahon?',
    'Do you regularly practice gratitude?': 'Kanunay ka bang mapasalamaton?',
    'Do you find comfort in your faith or personal beliefs?': 'Makakita ka ba ug kahupayan sa imong pagtuo o personal nga gituohan?',
    'Do you feel connected to something greater than yourself?': 'Mobati ka ba nga konektado ka sa usa ka butang nga mas labaw pa kanimo?',
    // Psychological
    'How would you rate your overall sense of self-worth?': 'Unsaon nimo paghulagway sa imong pagtan-aw sa kaugalingon nga bili?',
    'How well do you bounce back after a setback?': 'Unsa ka paspas ka makabangon human sa kapakyasan?',
    'How confident are you in making everyday decisions?': 'Unsa ka masaligon sa imong kaugalingon sa paghimo ug adlaw-adlaw nga desisyon?',
    'Do you feel in control of your thoughts and reactions?': 'Mobati ka ba nga kontrolado nimo ang imong hunahuna ug reaksyon?',
    'How would you describe your outlook on the future?': 'Unsaon nimo paghulagway sa imong panglantaw sa umaabot?',
    // Mental
    'How would you rate your current stress level?': 'Unsaon nimo paghulagway sa imong lebel sa stress karon?',
    'How many hours of sleep do you get on average?': 'Pila ka oras ka kasagaran matulog?',
    'How would you describe your general mood lately?': 'Unsaon nimo paghulagway sa imong kinatibuk-ang pamati karong bag-o?',
    'Do you experience frequent anxiety or worry?': 'Kanunay ka bang mobati ug kabalaka o kahadlok?',
    'Do you have difficulty concentrating or focusing?': 'Naglisod ka ba sa pag-concentrate o pag-focus?',
    // Emotional
    'How comfortable are you expressing your feelings to others?': 'Unsa ka komportable sa pagsulti sa imong gibati ngadto sa uban?',
    'How often do you experience sudden mood swings?': 'Unsa ka subsob nga kalit nga mausab ang imong pamati?',
    'Do you have someone you can turn to when you feel emotionally overwhelmed?': 'Aduna ka bay tawo nga maduolan kon dili na nimo kaya ang imong gibati?',
    'How often do you feel overwhelmed by your emotions?': 'Unsa ka subsob nga mabug-atan ka sa imong pagbati?',
    'How often do you feel joy or contentment in daily life?': 'Unsa ka subsob nga mobati ka ug kalipay o katagbawan matag adlaw?',
    // Physical
    'Do you experience any chronic pain?': 'Nakasinati ka ba ug dugay nga sakit sa lawas?',
    'How often do you feel fatigued during the day?': 'Unsa ka subsob nga mobati ka ug kakapoy sulod sa adlaw?',
    'How is your appetite?': 'Kumusta ang imong gana sa pagkaon?',
    'How regular are your bowel movements?': 'Unsa ka regular ang imong pagkalibang?',
    'Do you experience any urinary problems?': 'Nakasinati ka ba ug problema sa pagpangihi?',
    // Financial
    'How often do you feel stressed about money?': 'Unsa ka subsob nga mabalaka ka bahin sa kwarta?',
    'How well can you meet your monthly expenses?': 'Kaya ba nimo ang imong binulan nga galastohan?',
    'Do you have savings set aside for emergencies?': 'Aduna ka bay natigom nga kwarta para sa emergency?',
    'How often do you worry about outstanding debts?': 'Unsa ka subsob nga mabalaka ka bahin sa imong mga utang?',
    'How confident are you in your financial future?': 'Unsa ka masaligon sa imong umaabot nga panalapi?',
    // Social
    'How would you rate your relationships with family and friends?': 'Unsaon nimo paghulagway sa imong relasyon sa pamilya ug mga higala?',
    'How satisfied are you with your work-life balance?': 'Unsa ka kontento sa balanse sa imong trabaho ug personal nga kinabuhi?',
    'Do you have people you can rely on for support?': 'Aduna ka bay mga tawo nga masaligan kon magkinahanglan ka ug tabang?',
    'How often do you feel isolated or left out?': 'Unsa ka subsob nga mobati ka nga nag-inusara o gibiyaan?',
    'How often do you take part in social or community activities?': 'Unsa ka subsob nga moapil ka sa mga kalihokan sa katilingban o komunidad?',
  },
};

/**
 * Answer labels, keyed by their lowercased English text. Keyed by text
 * rather than optionID because the same few labels repeat across most of
 * the 35 questions.
 */
export const OPTION_TEXT = {
  tl: {
    'strongly agree': 'Lubos na Sumasang-ayon',
    agree: 'Sumasang-ayon',
    disagree: 'Hindi Sumasang-ayon',
    'strongly disagree': 'Lubos na Hindi Sumasang-ayon',
    always: 'Palagi',
    often: 'Madalas',
    sometimes: 'Minsan',
    rarely: 'Bihira',
    never: 'Hindi Kailanman',
    'most of the time': 'Kadalasan',
    'very good': 'Napakahusay',
    good: 'Mahusay',
    fair: 'Katamtaman',
    poor: 'Mahina',
    excellent: 'Napakahusay',
    'very well': 'Napakahusay',
    well: 'Mahusay',
    poorly: 'Mahina',
    'very poorly': 'Napakahina',
    'very confident': 'Lubos na Kumpiyansa',
    confident: 'May Kumpiyansa',
    unsure: 'Hindi Sigurado',
    'very unsure': 'Lubos na Hindi Sigurado',
    'very positive': 'Lubos na Positibo',
    positive: 'Positibo',
    negative: 'Negatibo',
    'very negative': 'Lubos na Negatibo',
    none: 'Wala',
    mild: 'Bahagya',
    moderate: 'Katamtaman',
    severe: 'Malubha',
    'less than 5 hrs': 'Mas mababa sa 5 oras',
    '5-6 hrs': '5-6 na oras',
    '7-8 hrs': '7-8 na oras',
    'more than 8 hrs': 'Higit sa 8 oras',
    'very comfortable': 'Lubos na Komportable',
    comfortable: 'Komportable',
    uncomfortable: 'Hindi Komportable',
    'very uncomfortable': 'Lubos na Hindi Komportable',
    'very regular': 'Napakaregular',
    regular: 'Regular',
    irregular: 'Hindi Regular',
    'very irregular': 'Lubos na Hindi Regular',
    'very satisfied': 'Lubos na Kontento',
    satisfied: 'Kontento',
    unsatisfied: 'Hindi Kontento',
    'very unsatisfied': 'Lubos na Hindi Kontento',
  },
  ceb: {
    'strongly agree': 'Hugot nga Miuyon',
    agree: 'Miuyon',
    disagree: 'Wala Miuyon',
    'strongly disagree': 'Hugot nga Wala Miuyon',
    always: 'Kanunay',
    often: 'Kasagaran',
    sometimes: 'Usahay',
    rarely: 'Panagsa',
    never: 'Wala Gyud',
    'most of the time': 'Halos Kanunay',
    'very good': 'Maayo Kaayo',
    good: 'Maayo',
    fair: 'Kasarangan',
    poor: 'Huyang',
    excellent: 'Labing Maayo',
    'very well': 'Maayo Kaayo',
    well: 'Maayo',
    poorly: 'Huyang',
    'very poorly': 'Huyang Kaayo',
    'very confident': 'Masaligon Kaayo',
    confident: 'Masaligon',
    unsure: 'Dili Sigurado',
    'very unsure': 'Dili Gyud Sigurado',
    'very positive': 'Positibo Kaayo',
    positive: 'Positibo',
    negative: 'Negatibo',
    'very negative': 'Negatibo Kaayo',
    none: 'Wala',
    mild: 'Gamay',
    moderate: 'Kasarangan',
    severe: 'Grabe',
    'less than 5 hrs': 'Ubos sa 5 ka oras',
    '5-6 hrs': '5-6 ka oras',
    '7-8 hrs': '7-8 ka oras',
    'more than 8 hrs': 'Sobra sa 8 ka oras',
    'very comfortable': 'Komportable Kaayo',
    comfortable: 'Komportable',
    uncomfortable: 'Dili Komportable',
    'very uncomfortable': 'Dili Gyud Komportable',
    'very regular': 'Regular Kaayo',
    regular: 'Regular',
    irregular: 'Dili Regular',
    'very irregular': 'Dili Gyud Regular',
    'very satisfied': 'Kontento Kaayo',
    satisfied: 'Kontento',
    unsatisfied: 'Dili Kontento',
    'very unsatisfied': 'Dili Gyud Kontento',
  },
};

/** Kiosk chrome that sits beside the questions. */
export const UI_TEXT = {
  tl: {
    answeredOverall: (answered, total) => `${answered} sa ${total} ang nasagutan`,
    questionsLeft: (n) => `${n} pang tanong sa bahaging ito`,
    next: 'Susunod',
    previous: 'Bumalik',
    done: 'Tapos na',
    language: 'Wika',
  },
  ceb: {
    answeredOverall: (answered, total) => `${answered} sa ${total} ang natubag`,
    questionsLeft: (n) => `${n} pa ka pangutana niini nga bahin`,
    next: 'Sunod',
    previous: 'Balik',
    done: 'Human na',
    language: 'Pinulongan',
  },
};
