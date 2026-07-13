const translations = {
  en: {
    pageTitle: "Shubham Info - Staff Admission Form",
    heading: "Staff Admission Form",
    subheading: "Please fill in your details carefully. Fields marked * are required.",
    name: "Full Name *",
    namePlaceholder: "Enter your full name",
    mobile: "Mobile Number *",
    mobilePlaceholder: "10-digit mobile number",
    bankAcc: "Bank Account Number *",
    bankAccPlaceholder: "Enter account number as per passbook",
    ifsc: "Bank IFSC Code *",
    ifscPlaceholder: "e.g. SBIN0001234",
    aadhar: "Aadhar Card Upload *",
    pan: "PAN Card Upload *",
    passbook: "Bank Passbook Photo *",
    passport: "Passport Size Photo *",
    signature: "Signature Upload *",
    signatureHint: "Sign on plain paper, take a clear photo, and upload it here.",
    autoCompressNote: "Your photos will be automatically resized and compressed when you upload them — no need to compress them yourself.",
    submit: "Submit Form",
    submitting: "Submitting, please wait...",
    successTitle: "Submitted Successfully",
    successMsg: "Your details have been submitted. Thank you.",
    errorDuplicate: "This mobile number has already submitted a form. Only one entry is allowed per number.",
    errorGeneric: "Something went wrong. Please check your details and try again.",
    errorUpload: "Your details were correct, but the file upload failed due to a server setup issue. Please inform the admin to check storage permissions.",
    errorRequired: "Please fill all required fields and upload all required documents.",
    errorIfsc: "Please enter a valid IFSC code (e.g. SBIN0001234 - 4 letters, then 0, then 6 letters/numbers).",
    errorFileSize: "One or more files are larger than 1 MB. Please compress before uploading (see steps above).",
    langToggle: "हिंदी में देखें",
  },
  hi: {
    pageTitle: "शुभम इन्फो - स्टाफ एडमिशन फॉर्म",
    heading: "स्टाफ एडमिशन फॉर्म",
    subheading: "कृपया अपनी जानकारी ध्यान से भरें। * वाले फील्ड भरना ज़रूरी है।",
    name: "पूरा नाम *",
    namePlaceholder: "अपना पूरा नाम अंग्रेज़ी में लिखें",
    mobile: "मोबाइल नंबर *",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर",
    bankAcc: "बैंक खाता नंबर *",
    bankAccPlaceholder: "पासबुक के अनुसार खाता नंबर लिखें",
    ifsc: "बैंक IFSC कोड *",
    ifscPlaceholder: "उदाहरण: SBIN0001234",
    aadhar: "आधार कार्ड अपलोड करें *",
    pan: "पैन कार्ड अपलोड करें *",
    passbook: "बैंक पासबुक फोटो *",
    passport: "पासपोर्ट साइज़ फोटो *",
    signature: "हस्ताक्षर अपलोड करें *",
    signatureHint: "सादे कागज़ पर हस्ताक्षर करें, साफ़ फोटो लें और यहाँ अपलोड करें।",
    autoCompressNote: "आपकी फोटो अपलोड करते समय अपने आप छोटी और कंप्रेस हो जाएगी — आपको खुद कंप्रेस करने की ज़रूरत नहीं है।",
    submit: "फॉर्म सबमिट करें",
    submitting: "सबमिट हो रहा है, कृपया प्रतीक्षा करें...",
    successTitle: "सफलतापूर्वक सबमिट हुआ",
    successMsg: "आपकी जानकारी सबमिट कर दी गई है। धन्यवाद।",
    errorDuplicate: "इस मोबाइल नंबर से पहले ही फॉर्म सबमिट हो चुका है। एक नंबर से केवल एक ही एंट्री की अनुमति है।",
    errorGeneric: "कुछ गलत हो गया। कृपया अपनी जानकारी जांचें और फिर से प्रयास करें।",
    errorUpload: "आपकी जानकारी सही थी, लेकिन सर्वर सेटिंग की समस्या के कारण फ़ाइल अपलोड नहीं हो पाई। कृपया एडमिन को स्टोरेज परमिशन जांचने के लिए बताएं।",
    errorRequired: "कृपया सभी ज़रूरी फील्ड भरें और सभी ज़रूरी दस्तावेज़ अपलोड करें।",
    errorIfsc: "कृपया सही IFSC कोड डालें (उदाहरण: SBIN0001234 - 4 अक्षर, फिर 0, फिर 6 अक्षर/अंक)।",
    errorFileSize: "एक या अधिक फाइलें 1 MB से बड़ी हैं। कृपया अपलोड करने से पहले कंप्रेस करें (ऊपर दिए स्टेप्स देखें)।",
    langToggle: "View in English",
  }
};

let currentLang = "en";

function applyLanguage(lang) {
  currentLang = lang;
  const dict = translations[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
  document.title = dict.pageTitle;
  document.documentElement.lang = lang;
  localStorage.setItem("shubhaminfo_lang", lang);
}