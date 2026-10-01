// Plain-language explanations of the station 2 results, in English, Tagalog
// and Cebuano (Bisaya).
//
// !! NEEDS CLINICAL REVIEW !!
// Like assessmentTranslations.js, this wording was drafted by a developer
// pass, not by a clinician or a professional translator. Have a clinician
// approve the English advice, and a Tagalog- and a Cebuano-speaking staff
// member read the translations against it, before patients rely on it. The
// NCMH Crisis Hotline number (1553) in the Mental and Emotional "support"
// messages must also be confirmed as current before release.
//
// Unlike the question wording, the English here has no database source, so
// all three languages live in this file. Sections are keyed by the English
// category name used in the template (both backends seed the same names).
// `assessmentText` in ../lib/assessmentText.js is the only reader: a missing
// language falls back to English, and a section with no entry (a category
// added to the database later) falls back to GENERIC_SECTION_TEXT, so a
// patient is never shown a blank verdict.
//
// Band keys match BANDS in ../lib/interpretation.js, best to worst:
// excellent, good, fair, attention, support.

/** Screen chrome for the results view. */
export const RESULTS_TEXT = {
  en: {
    title: 'Understanding your results',
    howToRead: 'Each answer earns 1 to 4 points, and 4 is the healthiest answer. A section\'s percentage is the points you earned out of the most it can earn. Because every answer earns at least 1 point, the lowest possible score is 25%, not 0%. In every section, a higher score is better.',
    disclaimer: 'This is a wellness screening, not a diagnosis. The doctor will go over it with you.',
    scoreGuide: 'Score guide',
    aboutLabel: 'What this section looks at',
    flaggedTitle: 'Answers to discuss with the doctor',
    flaggedNote: 'You chose the most concerning answer for these questions, even if the section score looks fine.',
    allSections: 'All Sections',
    overallPercent: (pct) => `${pct}% overall`,
    overallSummary: 'Overall Summary',
    overallAverage: 'Overall Average',
    bands: {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair',
      attention: 'Needs attention',
      support: 'Needs support',
    },
  },
  tl: {
    title: 'Pag-unawa sa Iyong Resulta',
    howToRead: 'Bawat sagot ay may 1 hanggang 4 na puntos, at ang 4 ang pinakamalusog na sagot. Ang porsyento ng bawat bahagi ay ang puntos na nakuha mo mula sa pinakamataas na maaaring makuha. Dahil may hindi bababa sa 1 puntos ang bawat sagot, 25% ang pinakamababang posibleng marka, hindi 0%. Sa bawat bahagi, mas mataas ang marka, mas mabuti.',
    disclaimer: 'Ito ay pagsusuri ng kalusugan at kagalingan, hindi diyagnosis. Ipapaliwanag ito sa iyo ng doktor.',
    scoreGuide: 'Gabay sa Marka',
    aboutLabel: 'Ano ang sinusuri ng bahaging ito',
    flaggedTitle: 'Mga sagot na dapat pag-usapan kasama ang doktor',
    flaggedNote: 'Pinili mo ang pinakanakababahalang sagot sa mga tanong na ito, kahit mukhang maayos ang marka ng bahagi.',
    allSections: 'Lahat ng Bahagi',
    overallPercent: (pct) => `${pct}% kabuuan`,
    overallSummary: 'Kabuuang Buod',
    overallAverage: 'Kabuuang Average',
    bands: {
      excellent: 'Napakahusay',
      good: 'Mabuti',
      fair: 'Katamtaman',
      attention: 'Kailangang Bigyang-pansin',
      support: 'Kailangan ng Suporta',
    },
  },
  ceb: {
    title: 'Pagsabot sa Imong Resulta',
    howToRead: 'Ang matag tubag adunay 1 hangtod 4 ka puntos, ug ang 4 mao ang labing himsog nga tubag. Ang porsyento sa matag bahin mao ang puntos nga imong nakuha gikan sa pinakataas nga mahimong makuha. Tungod kay ang matag tubag adunay labing menos 1 ka puntos, ang 25% mao ang pinakaubos nga posible nga marka, dili 0%. Sa matag bahin, mas taas ang marka, mas maayo.',
    disclaimer: 'Kini usa ka pagsusi sa kahimsog ug kaayohan, dili diyagnosis. Ipasabot kini kanimo sa doktor.',
    scoreGuide: 'Giya sa Marka',
    aboutLabel: 'Unsa ang gisusi niini nga bahin',
    flaggedTitle: 'Mga tubag nga angay hisgotan uban sa doktor',
    flaggedNote: 'Gipili nimo ang labing makabalaka nga tubag niini nga mga pangutana, bisan kon morag maayo ang marka sa bahin.',
    allSections: 'Tanang Bahin',
    overallPercent: (pct) => `${pct}% kinatibuk-an`,
    overallSummary: 'Kinatibuk-ang Sumaryo',
    overallAverage: 'Kinatibuk-ang Average',
    bands: {
      excellent: 'Maayo Kaayo',
      good: 'Maayo',
      fair: 'Kasarangan',
      attention: 'Kinahanglan Atimanon',
      support: 'Kinahanglan og Suporta',
    },
  },
};

/**
 * What each section measures, and what each band means for it. Each message
 * says what the score suggests and one concrete next step for that area.
 */
export const SECTION_TEXT = {
  en: {
    Spiritual: {
      about: 'Your sense of purpose, inner peace, gratitude, and connection to your faith or beliefs.',
      excellent: 'You have a strong sense of purpose and inner peace. Keep up the practices that ground you.',
      good: 'You generally feel meaning and peace in your life. Small daily habits, like a moment of reflection or gratitude, help keep this strong.',
      fair: 'Your sense of purpose or inner peace is steady in some areas but weaker in others. Making time for reflection, prayer, or things that give you meaning may help.',
      attention: 'You may be feeling less purpose, peace, or connection lately. Talking with someone you trust, such as family, friends, or your faith community, can help you reconnect.',
      support: 'Many of your answers suggest you may be feeling empty, restless, or disconnected. Please talk with the doctor, a counselor, or someone you trust. You do not have to face this alone.',
    },
    Psychological: {
      about: 'How you see yourself, how you bounce back from setbacks, your confidence in making decisions, and your outlook on the future.',
      excellent: 'You show healthy self-worth, resilience, and a positive outlook. These are real strengths.',
      good: 'You generally cope well and feel confident. Keep noticing what helps you recover from hard days.',
      fair: 'Your confidence or outlook is mixed. Setting small, reachable goals and noticing your progress can help.',
      attention: 'You may be doubting yourself or finding it hard to recover from setbacks. Talking with a counselor or someone you trust can help you regain your balance.',
      support: 'Your answers suggest low self-worth, a negative outlook, or difficulty coping. Please discuss this with the doctor or a counselor. Help is available.',
    },
    Mental: {
      about: 'Your stress level, sleep, mood, worry, and ability to focus.',
      excellent: 'Your stress, sleep, mood, and focus are in a healthy range.',
      good: 'You are managing well overall. Protect your sleep (7 to 8 hours) and keep your healthy ways of handling stress.',
      fair: 'There are some signs of stress, poor sleep, or worry. Regular sleep, short breaks, and physical activity can help.',
      attention: 'Stress, worry, low mood, or poor sleep may be affecting your daily life. Please mention this to the doctor so they can help.',
      support: 'Your answers show high stress, worry, low mood, or sleep problems. Please tell the doctor about this. If you ever feel unsafe or unable to cope, call the NCMH Crisis Hotline at 1553.',
    },
    Emotional: {
      about: 'How you express and handle your feelings, your mood changes, and whether you have someone to lean on.',
      excellent: 'You handle your emotions well and have support around you.',
      good: 'You generally manage your feelings well. Keep sharing them with people you trust.',
      fair: 'Some feelings may be hard to express or manage at times. Talking to someone you trust and making time for things you enjoy can help.',
      attention: 'You may often feel overwhelmed or have few people to turn to. Consider reaching out to family, friends, or a counselor.',
      support: 'Your answers suggest your emotions often feel overwhelming and joy is hard to find. Please talk to the doctor or a counselor. If you ever feel unsafe, call the NCMH Crisis Hotline at 1553.',
    },
    Physical: {
      about: 'Body pain, tiredness during the day, appetite, bowel movements, and urination.',
      excellent: 'You report no major physical complaints. Keep up your regular check-ups and healthy habits.',
      good: 'Your body is generally doing well, with only minor complaints.',
      fair: 'You have some physical complaints, such as pain, tiredness, or changes in appetite or digestion. Mention them during your check-up.',
      attention: 'You reported several physical symptoms. Please describe them to the doctor so they can be checked.',
      support: 'You reported significant physical symptoms. Please make sure the doctor reviews them, as some may need tests or treatment.',
    },
    Financial: {
      about: 'Money stress, meeting your monthly expenses, emergency savings, and worry about debts.',
      excellent: 'You feel financially secure and in control.',
      good: 'Your finances are mostly stable. Keep building your emergency savings.',
      fair: 'Money is sometimes a source of stress. A simple budget and saving even small amounts can help.',
      attention: 'Money worries or debts may be weighing on you. Ask your HR office about financial programs, loans, or savings plans you can use.',
      support: 'Your answers show serious financial strain, which can also affect your health and sleep. Ask your HR office about financial help or counseling, and tell the doctor if it is affecting your wellbeing.',
    },
    Social: {
      about: 'Your relationships, work-life balance, support from others, and feeling included.',
      excellent: 'You have strong relationships and a good balance between work and personal life.',
      good: 'Your social life and support are generally good. Keep making time for the people who matter to you.',
      fair: 'You may sometimes feel stretched between work and personal life, or a little disconnected. Planning time with family or friends can help.',
      attention: 'You may be feeling isolated or short on support. Reaching out to co-workers, family, or community groups can help.',
      support: 'Your answers suggest you often feel isolated or without support. Please talk to the doctor or a counselor. Staying connected to others matters for your health.',
    },
  },
  tl: {
    Spiritual: {
      about: 'Ang iyong layunin sa buhay, kapayapaan ng loob, pagpapasalamat, at koneksyon sa iyong pananampalataya o paniniwala.',
      excellent: 'Malakas ang iyong pakiramdam ng layunin at kapayapaan ng loob. Ipagpatuloy ang mga gawaing nagpapatatag sa iyo.',
      good: 'Sa pangkalahatan, may kahulugan at kapayapaan ang iyong buhay. Ang maliliit na gawi araw-araw, gaya ng sandaling pagninilay o pagpapasalamat, ay tumutulong na mapanatili ito.',
      fair: 'Matatag ang iyong layunin o kapayapaan ng loob sa ilang bahagi pero mahina sa iba. Makatutulong ang paglalaan ng oras sa pagninilay, pagdarasal, o mga bagay na nagbibigay sa iyo ng kahulugan.',
      attention: 'Maaaring hindi mo gaanong nararamdaman ang layunin, kapayapaan, o koneksyon nitong mga nakaraang araw. Makatutulong ang pakikipag-usap sa taong pinagkakatiwalaan mo, gaya ng pamilya, kaibigan, o komunidad ng pananampalataya.',
      support: 'Ipinapakita ng marami sa iyong sagot na maaaring pakiramdam mo ay walang laman, hindi mapakali, o malayo sa iba. Mangyaring makipag-usap sa doktor, counselor, o taong pinagkakatiwalaan mo. Hindi mo kailangang harapin ito nang mag-isa.',
    },
    Psychological: {
      about: 'Kung paano mo tinitingnan ang iyong sarili, kung paano ka bumabangon mula sa kabiguan, ang iyong kumpiyansa sa pagpapasya, at ang iyong pananaw sa hinaharap.',
      excellent: 'Malusog ang iyong pagpapahalaga sa sarili, katatagan, at positibong pananaw. Tunay mong lakas ang mga ito.',
      good: 'Sa pangkalahatan, maayos kang nakakaraos at may kumpiyansa. Patuloy na pansinin kung ano ang tumutulong sa iyo na makabangon sa mahihirap na araw.',
      fair: 'Halo-halo ang iyong kumpiyansa o pananaw. Makatutulong ang pagtatakda ng maliliit at kayang abutin na layunin at ang pagpansin sa iyong pag-unlad.',
      attention: 'Maaaring nagdududa ka sa iyong sarili o nahihirapang makabangon mula sa kabiguan. Makatutulong ang pakikipag-usap sa counselor o taong pinagkakatiwalaan mo upang maibalik ang iyong balanse.',
      support: 'Ipinapakita ng iyong mga sagot ang mababang pagpapahalaga sa sarili, negatibong pananaw, o hirap sa pagharap sa mga problema. Mangyaring pag-usapan ito kasama ang doktor o counselor. May tulong na nakahanda para sa iyo.',
    },
    Mental: {
      about: 'Ang antas ng iyong stress, tulog, kalooban, pag-aalala, at kakayahang mag-focus.',
      excellent: 'Nasa malusog na antas ang iyong stress, tulog, kalooban, at focus.',
      good: 'Maayos ang iyong kalagayan sa pangkalahatan. Pangalagaan ang iyong tulog (7 hanggang 8 oras) at ipagpatuloy ang malulusog mong paraan ng pagharap sa stress.',
      fair: 'May ilang palatandaan ng stress, kulang na tulog, o pag-aalala. Makatutulong ang regular na tulog, maiikling pahinga, at pag-eehersisyo.',
      attention: 'Maaaring naaapektuhan ng stress, pag-aalala, malungkot na kalooban, o kulang na tulog ang iyong pang-araw-araw na buhay. Mangyaring sabihin ito sa doktor upang matulungan ka.',
      support: 'Ipinapakita ng iyong mga sagot ang mataas na stress, pag-aalala, malungkot na kalooban, o problema sa pagtulog. Mangyaring sabihin ito sa doktor. Kung pakiramdam mo ay hindi ka ligtas o hindi mo na kaya, tumawag sa NCMH Crisis Hotline sa 1553.',
    },
    Emotional: {
      about: 'Kung paano mo ipinapahayag at hinaharap ang iyong damdamin, ang mga pagbabago ng iyong kalooban, at kung may masasandalan ka.',
      excellent: 'Mahusay mong hinaharap ang iyong damdamin at may mga taong sumusuporta sa iyo.',
      good: 'Sa pangkalahatan, maayos mong napamamahalaan ang iyong damdamin. Ipagpatuloy ang pagbabahagi nito sa mga taong pinagkakatiwalaan mo.',
      fair: 'Maaaring may mga damdaming mahirap ipahayag o kontrolin paminsan-minsan. Makatutulong ang pakikipag-usap sa taong pinagkakatiwalaan mo at ang paglalaan ng oras sa mga bagay na ikinasisiya mo.',
      attention: 'Maaaring madalas kang nadadaig ng iyong damdamin o kakaunti ang iyong malalapitan. Subukang lumapit sa pamilya, kaibigan, o counselor.',
      support: 'Ipinapakita ng iyong mga sagot na madalas kang nadadaig ng iyong damdamin at mahirap para sa iyo ang makaramdam ng saya. Mangyaring makipag-usap sa doktor o counselor. Kung pakiramdam mo ay hindi ka ligtas, tumawag sa NCMH Crisis Hotline sa 1553.',
    },
    Physical: {
      about: 'Pananakit ng katawan, pagod sa maghapon, ganang kumain, pagdumi, at pag-ihi.',
      excellent: 'Wala kang malaking reklamo sa katawan. Ipagpatuloy ang regular na pagpapatingin at malulusog na gawi.',
      good: 'Maayos ang iyong katawan sa pangkalahatan, na may kaunting reklamo lamang.',
      fair: 'May ilan kang reklamo sa katawan, gaya ng pananakit, pagod, o pagbabago sa ganang kumain o pagtunaw. Banggitin ang mga ito sa iyong check-up.',
      attention: 'Nag-ulat ka ng ilang sintomas sa katawan. Mangyaring ilarawan ang mga ito sa doktor upang masuri.',
      support: 'Nag-ulat ka ng mabibigat na sintomas sa katawan. Tiyaking masuri ang mga ito ng doktor, dahil maaaring kailanganin ng ilan ang mga pagsusuri o gamutan.',
    },
    Financial: {
      about: 'Stress dahil sa pera, pagtugon sa buwanang gastusin, ipon para sa emergency, at pag-aalala sa utang.',
      excellent: 'Pakiramdam mo ay ligtas at kontrolado ang iyong pananalapi.',
      good: 'Halos matatag ang iyong pananalapi. Patuloy na dagdagan ang iyong ipon para sa emergency.',
      fair: 'Paminsan-minsan ay nagdudulot ng stress ang pera. Makatutulong ang simpleng budget at ang pag-iipon kahit maliit na halaga.',
      attention: 'Maaaring nabibigatan ka sa pag-aalala sa pera o utang. Magtanong sa inyong HR office tungkol sa mga programang pinansyal, pautang, o ipon na maaari mong magamit.',
      support: 'Ipinapakita ng iyong mga sagot ang matinding hirap sa pananalapi, na maaari ring makaapekto sa iyong kalusugan at tulog. Magtanong sa inyong HR office tungkol sa tulong o payong pinansyal, at sabihin sa doktor kung naaapektuhan na nito ang iyong kagalingan.',
    },
    Social: {
      about: 'Ang iyong mga relasyon, balanse ng trabaho at personal na buhay, suporta mula sa iba, at pakiramdam na kabilang ka.',
      excellent: 'Matibay ang iyong mga relasyon at maganda ang balanse ng iyong trabaho at personal na buhay.',
      good: 'Maayos sa pangkalahatan ang iyong buhay panlipunan at suporta. Patuloy na maglaan ng oras para sa mga taong mahalaga sa iyo.',
      fair: 'Maaaring paminsan-minsan ay nahahati ang iyong oras sa trabaho at personal na buhay, o medyo malayo ka sa iba. Makatutulong ang pagpaplano ng oras kasama ang pamilya o kaibigan.',
      attention: 'Maaaring nakararamdam ka ng pag-iisa o kakulangan sa suporta. Makatutulong ang paglapit sa mga katrabaho, pamilya, o grupo sa komunidad.',
      support: 'Ipinapakita ng iyong mga sagot na madalas kang nag-iisa o walang suporta. Mangyaring makipag-usap sa doktor o counselor. Mahalaga sa iyong kalusugan ang pagkakaroon ng koneksyon sa iba.',
    },
  },
  ceb: {
    Spiritual: {
      about: 'Ang imong katuyoan sa kinabuhi, kalinaw sa kasingkasing, pagkamapasalamaton, ug koneksyon sa imong pagtuo o gituohan.',
      excellent: 'Lig-on ang imong pagbati sa katuyoan ug kalinaw sa kasingkasing. Padayona ang mga buhat nga nagpalig-on kanimo.',
      good: 'Sa kinatibuk-an, aduna kay kahulogan ug kalinaw sa kinabuhi. Ang gagmay nga adlaw-adlaw nga batasan, sama sa makadiyot nga pagpamalandong o pagpasalamat, makatabang sa pagpadayon niini.',
      fair: 'Lig-on ang imong katuyoan o kalinaw sa pipila ka bahin apan huyang sa uban. Makatabang ang paggahin og panahon sa pagpamalandong, pag-ampo, o mga butang nga naghatag kanimo og kahulogan.',
      attention: 'Basin dili kaayo nimo mabati ang katuyoan, kalinaw, o koneksyon karong bag-o. Makatabang ang pakigsulti sa tawo nga imong gisaligan, sama sa pamilya, higala, o komunidad sa pagtuo.',
      support: 'Daghan sa imong tubag nagpakita nga basin mobati ka nga haw-ang, dili makapahulay, o layo sa uban. Palihug pakigsulti sa doktor, counselor, o tawo nga imong gisaligan. Dili nimo kinahanglan atubangon kini nga ikaw ra.',
    },
    Psychological: {
      about: 'Giunsa nimo pagtan-aw sa imong kaugalingon, giunsa nimo pagbangon gikan sa kapakyasan, ang imong pagsalig sa paghimo og desisyon, ug ang imong panglantaw sa umaabot.',
      excellent: 'Himsog ang imong pagpabili sa kaugalingon, kalig-on, ug positibo nga panglantaw. Tinuod nga kusog nimo kini.',
      good: 'Sa kinatibuk-an, maayo ka nga makasagubang ug masaligon. Padayon nga bantayi kon unsa ang makatabang kanimo nga makabangon sa lisud nga mga adlaw.',
      fair: 'Sagol ang imong pagsalig o panglantaw. Makatabang ang pagbutang og gagmay ug makab-ot nga mga tumong ug ang pagtan-aw sa imong pag-uswag.',
      attention: 'Basin nagduhaduha ka sa imong kaugalingon o naglisod sa pagbangon gikan sa kapakyasan. Makatabang ang pakigsulti sa counselor o tawo nga imong gisaligan aron mabalik ang imong balanse.',
      support: 'Ang imong mga tubag nagpakita og ubos nga pagpabili sa kaugalingon, negatibo nga panglantaw, o kalisud sa pagsagubang sa mga problema. Palihug hisgoti kini uban sa doktor o counselor. Adunay tabang nga andam alang kanimo.',
    },
    Mental: {
      about: 'Ang lebel sa imong stress, katulog, pamati, kabalaka, ug abilidad sa pag-focus.',
      excellent: 'Anaa sa himsog nga lebel ang imong stress, katulog, pamati, ug focus.',
      good: 'Maayo ang imong kahimtang sa kinatibuk-an. Atimana ang imong katulog (7 hangtod 8 ka oras) ug padayona ang imong himsog nga paagi sa pagsagubang sa stress.',
      fair: 'Adunay pipila ka timailhan sa stress, kulang nga katulog, o kabalaka. Makatabang ang regular nga katulog, mubo nga pahulay, ug pag-ehersisyo.',
      attention: 'Basin naapektuhan sa stress, kabalaka, kaguol, o kulang nga katulog ang imong adlaw-adlaw nga kinabuhi. Palihug isulti kini sa doktor aron matabangan ka.',
      support: 'Ang imong mga tubag nagpakita og taas nga stress, kabalaka, kaguol, o problema sa katulog. Palihug isulti kini sa doktor. Kon mobati ka nga dili ka luwas o dili na nimo kaya, tawag sa NCMH Crisis Hotline sa 1553.',
    },
    Emotional: {
      about: 'Giunsa nimo pagpahayag ug pagdumala sa imong pagbati, ang mga kausaban sa imong pamati, ug kon aduna kay masandigan.',
      excellent: 'Maayo nimo nga madumala ang imong pagbati ug aduna kay mga tawo nga nagsuporta kanimo.',
      good: 'Sa kinatibuk-an, maayo nimo nga madumala ang imong pagbati. Padayon sa pagpaambit niini sa mga tawo nga imong gisaligan.',
      fair: 'Basin adunay mga pagbati nga lisud ipahayag o dumalahon usahay. Makatabang ang pakigsulti sa tawo nga imong gisaligan ug ang paggahin og panahon sa mga butang nga imong ganahan.',
      attention: 'Basin kanunay kang mabug-atan sa imong pagbati o gamay ra ang imong maduolan. Sulayi ang pagduol sa pamilya, higala, o counselor.',
      support: 'Ang imong mga tubag nagpakita nga kanunay kang mabug-atan sa imong pagbati ug lisud alang kanimo ang pagbati og kalipay. Palihug pakigsulti sa doktor o counselor. Kon mobati ka nga dili ka luwas, tawag sa NCMH Crisis Hotline sa 1553.',
    },
    Physical: {
      about: 'Sakit sa lawas, kakapoy sulod sa adlaw, gana sa pagkaon, pagkalibang, ug pagpangihi.',
      excellent: 'Wala kay dagkong reklamo sa lawas. Padayona ang regular nga pagpatan-aw ug himsog nga mga batasan.',
      good: 'Maayo ang imong lawas sa kinatibuk-an, nga adunay gamay ra nga reklamo.',
      fair: 'Aduna kay pipila ka reklamo sa lawas, sama sa sakit, kakapoy, o kausaban sa gana sa pagkaon o pagtunaw. Hisgoti kini sa imong check-up.',
      attention: 'Nagtaho ka og pipila ka sintomas sa lawas. Palihug isaysay kini sa doktor aron masusi.',
      support: 'Nagtaho ka og grabe nga mga sintomas sa lawas. Siguroha nga masusi kini sa doktor, kay ang uban basin magkinahanglan og pagsusi o pagtambal.',
    },
    Financial: {
      about: 'Stress tungod sa kwarta, pagsugakod sa binulan nga galastohan, tinigom para sa emergency, ug kabalaka sa utang.',
      excellent: 'Mobati ka nga luwas ug kontrolado ang imong panalapi.',
      good: 'Halos lig-on ang imong panalapi. Padayon sa pagdugang sa imong tinigom para sa emergency.',
      fair: 'Usahay ang kwarta mahimong hinungdan sa stress. Makatabang ang yano nga budget ug ang pagtigom bisan gamay nga kantidad.',
      attention: 'Basin nabug-atan ka sa kabalaka sa kwarta o utang. Pangutana sa inyong HR office bahin sa mga programa sa panalapi, pahulam, o tinigom nga mahimo nimong magamit.',
      support: 'Ang imong mga tubag nagpakita og grabe nga kalisud sa panalapi, nga mahimo usab makaapekto sa imong kahimsog ug katulog. Pangutana sa inyong HR office bahin sa tabang o tambag sa panalapi, ug isulti sa doktor kon naapektuhan na niini ang imong kaayohan.',
    },
    Social: {
      about: 'Ang imong mga relasyon, balanse sa trabaho ug personal nga kinabuhi, suporta gikan sa uban, ug pagbati nga apil ka.',
      excellent: 'Lig-on ang imong mga relasyon ug maayo ang balanse sa imong trabaho ug personal nga kinabuhi.',
      good: 'Maayo sa kinatibuk-an ang imong sosyal nga kinabuhi ug suporta. Padayon sa paggahin og panahon alang sa mga tawo nga importante kanimo.',
      fair: 'Basin usahay mobati ka nga nabahin ang imong panahon tali sa trabaho ug personal nga kinabuhi, o medyo layo ka sa uban. Makatabang ang pagplano og panahon uban sa pamilya o higala.',
      attention: 'Basin mobati ka nga nag-inusara o kulang sa suporta. Makatabang ang pagduol sa mga kauban sa trabaho, pamilya, o grupo sa komunidad.',
      support: 'Ang imong mga tubag nagpakita nga kanunay kang mobati nga nag-inusara o walay suporta. Palihug pakigsulti sa doktor o counselor. Importante sa imong kahimsog ang pagbaton og koneksyon sa uban.',
    },
  },
};

/** The verdict on the overall average. */
export const OVERALL_TEXT = {
  en: {
    excellent: 'Your overall wellness is excellent. Keep up your healthy habits.',
    good: 'Your overall wellness is good. Check the sections above for anything you could still strengthen.',
    fair: 'Your overall wellness is fair. Some areas need attention; look at the sections marked Fair or lower.',
    attention: 'Several areas of your wellness need attention. Please go over them with the doctor.',
    support: 'Many areas show you may need support. Please discuss these results with the doctor. Help is available.',
  },
  tl: {
    excellent: 'Napakahusay ng iyong kabuuang kalusugan at kagalingan. Ipagpatuloy ang iyong malulusog na gawi.',
    good: 'Mabuti ang iyong kabuuang kalusugan at kagalingan. Tingnan ang mga bahagi sa itaas para sa anumang maaari pang pagbutihin.',
    fair: 'Katamtaman ang iyong kabuuang kalusugan at kagalingan. May mga bahaging kailangang bigyang-pansin; tingnan ang mga may markang Katamtaman o mas mababa.',
    attention: 'Ilang bahagi ng iyong kalusugan at kagalingan ang kailangang bigyang-pansin. Mangyaring pag-usapan ang mga ito kasama ang doktor.',
    support: 'Maraming bahagi ang nagpapakitang maaaring kailangan mo ng suporta. Mangyaring pag-usapan ang resultang ito kasama ang doktor. May tulong na nakahanda.',
  },
  ceb: {
    excellent: 'Maayo kaayo ang imong kinatibuk-ang kahimsog ug kaayohan. Padayona ang imong himsog nga mga batasan.',
    good: 'Maayo ang imong kinatibuk-ang kahimsog ug kaayohan. Tan-awa ang mga bahin sa ibabaw alang sa bisan unsang mahimo pang mapalambo.',
    fair: 'Kasarangan ang imong kinatibuk-ang kahimsog ug kaayohan. Adunay mga bahin nga kinahanglan atimanon; tan-awa ang mga adunay markang Kasarangan o mas ubos.',
    attention: 'Pipila ka bahin sa imong kahimsog ug kaayohan ang kinahanglan atimanon. Palihug hisgoti kini uban sa doktor.',
    support: 'Daghang bahin ang nagpakita nga basin kinahanglan ka og suporta. Palihug hisgoti kini nga resulta uban sa doktor. Adunay tabang nga andam.',
  },
};

/** Used for a section that has no entry in SECTION_TEXT. */
export const GENERIC_SECTION_TEXT = {
  en: {
    excellent: 'This area is a strength for you.',
    good: 'This area is generally healthy.',
    fair: 'This area is mixed; some answers need attention.',
    attention: 'This area needs attention. Please discuss it with the doctor.',
    support: 'This area shows you may need support. Please discuss it with the doctor.',
  },
  tl: {
    excellent: 'Kalakasan mo ang bahaging ito.',
    good: 'Malusog sa pangkalahatan ang bahaging ito.',
    fair: 'Halo-halo ang bahaging ito; may ilang sagot na kailangang bigyang-pansin.',
    attention: 'Kailangang bigyang-pansin ang bahaging ito. Mangyaring pag-usapan ito kasama ang doktor.',
    support: 'Ipinapakita ng bahaging ito na maaaring kailangan mo ng suporta. Mangyaring pag-usapan ito kasama ang doktor.',
  },
  ceb: {
    excellent: 'Kusog nimo kini nga bahin.',
    good: 'Himsog sa kinatibuk-an kini nga bahin.',
    fair: 'Sagol kini nga bahin; adunay pipila ka tubag nga kinahanglan atimanon.',
    attention: 'Kinahanglan atimanon kini nga bahin. Palihug hisgoti kini uban sa doktor.',
    support: 'Kini nga bahin nagpakita nga basin kinahanglan ka og suporta. Palihug hisgoti kini uban sa doktor.',
  },
};
