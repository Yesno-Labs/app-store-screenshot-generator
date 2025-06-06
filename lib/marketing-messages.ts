export interface MarketingMessageRow {
  language: string;
  messages: string[];
}

// Parse CSV data manually since we know the exact structure
export const parseMarketingMessages = (
  csvText: string
): MarketingMessageRow[] => {
  const lines = csvText.trim().split("\n");
  const headerLine = lines[0];
  const dataLines = lines.slice(1);

  const results: MarketingMessageRow[] = [];

  for (const line of dataLines) {
    // Split by comma, but handle quoted fields properly
    const fields = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }

    // Add the last field
    fields.push(currentField);

    if (fields.length >= 9) {
      // Should have 9 fields (language + 8 messages)
      const language = fields[0];
      const messages = fields.slice(1, 9); // Take 8 messages

      results.push({
        language,
        messages,
      });
    }
  }

  return results;
};

export const marketingMessagesCSV = `Localizations,Screenshot_1,Screenshot_2,Screenshot_3,Screenshot_4,Screenshot_5,Screenshot_6,Screenshot_7,Screenshot_8
English (U.S.),Most common questions,"JS, React and React Native",Test your knowledge,Interview questions & Quizzes,Detailed explanations,Try to guess the answer,Javascript common topics,React Native Essentials
Arabic,الأسئلة الأكثر شيوعًا,JS وReact وReact Native,اختبر معلوماتك,أسئلة المقابلات والاختبارات,شروحات مفصلة,حاول تخمين الإجابة,مواضيع جافاسكريبت الشائعة,أساسيات React Native
Catalan,Preguntes més freqüents,"JS, React i React Native",Posa a prova els teus coneixements,Preguntes d'entrevista i qüestionaris,Explicacions detallades,Intenta endevinar la resposta,Temes comuns de Javascript,Fonaments de React Native
Chinese (Simplified),最常见的问题,JS、React 和 React Native,测试您的知识,面试问题与测验,详细解析,猜猜答案,Javascript 常见主题,React Native 精华
Chinese (Traditional),最常見的問題,JS、React 和 React Native,測試您的知識,面試問題與測驗,詳細解析,猜猜答案,Javascript 常見主題,React Native 精華
Croatian,Najčešća pitanja,"JS, React i React Native",Testiraj svoje znanje,Pitanja za intervju i kvizovi,Detaljna objašnjenja,Pokušaj pogoditi odgovor,Uobičajene Javascript teme,Osnove React Nativea
Czech,Nejčastější otázky,"JS, React a React Native",Otestujte si své znalosti,Otázky k pohovoru a kvízy,Podrobná vysvětlení,Zkuste uhodnout odpověď,Běžná témata Javascriptu,Základy React Native
Danish,Mest almindelige spørgsmål,"JS, React og React Native",Test din viden,Spørgsmål til samtale & quizzer,Detaljerede forklaringer,Prøv at gætte svaret,Almindelige Javascript-emner,Det grundlæggende i React Native
Dutch,Meestgestelde vragen,"JS, React en React Native",Test je kennis,Sollicitatievragen & quizzen,Gedetailleerde uitleg,Probeer het antwoord te raden,Veelvoorkomende Javascript-onderwerpen,De basis van React Native
English (Australia),Most common questions,"JS, React and React Native",Test your knowledge,Interview questions & Quizzes,Detailed explanations,Try to guess the answer,Javascript common topics,React Native Essentials
English (Canada),Most common questions,"JS, React and React Native",Test your knowledge,Interview questions & Quizzes,Detailed explanations,Try to guess the answer,Javascript common topics,React Native Essentials
English (U.K.),Most common questions,"JS, React and React Native",Test your knowledge,Interview questions & Quizzes,Detailed explanations,Try to guess the answer,Javascript common topics,React Native Essentials
Finnish,Yleisimmät kysymykset,"JS, React ja React Native",Testaa tietosi,Haastattelukysymykset & visat,Yksityiskohtaiset selitykset,Yritä arvata vastaus,Yleiset Javascript-aiheet,React Nativen perusteet
French,Questions fréquentes,"JS, React et React Native",Testez vos connaissances,Questions d'entretien & Quiz,Explications détaillées,Essayez de deviner la réponse,Sujets Javascript courants,Les bases de React Native
French (Canada),Questions fréquentes,"JS, React et React Native",Testez vos connaissances,Questions d'entrevue et quiz,Explications détaillées,Essayez de deviner la réponse,Sujets Javascript courants,Les bases de React Native
German,Häufigste Fragen,"JS, React & React Native",Teste dein Wissen,Bewerbungsfragen & Quizze,Detaillierte Erklärungen,"Versuche, die Antwort zu erraten",Häufige Javascript-Themen,React Native Grundlagen
Greek,Οι πιο συχνές ερωτήσεις,"JS, React και React Native",Δοκιμάστε τις γνώσεις σας,Ερωτήσεις συνέντευξης & Κουίζ,Λεπτομερείς εξηγήσεις,Προσπαθήστε να μαντέψετε την απάντηση,Κοινά θέματα Javascript,Τα απαραίτητα του React Native
Hebrew,השאלות הנפוצות ביותר,"JS, React ו-React Native",בחן את הידע שלך,שאלות ראיון ומבחנים,הסברים מפורטים,נסה לנחש את התשובה,נושאים נפוצים ב-Javascript,יסודות React Native
Hindi,सबसे आम सवाल,"JS, React और React Native",अपने ज्ञान का परीक्षण करें,साक्षात्कार प्रश्न और क्विज़,विस्तृत स्पष्टीकरण,जवाब का अनुमान लगाने की कोशिश करें,सामान्य जावास्क्रिप्ट विषय,React Native की मूल बातें
Hungarian,Leggyakoribb kérdések,"JS, React és React Native",Tedd próbára a tudásod,Interjúkérdések és kvízek,Részletes magyarázatok,Próbáld kitalálni a választ,Gyakori Javascript-témák,React Native alapok
Indonesian,Pertanyaan paling umum,"JS, React, dan React Native",Uji pengetahuanmu,Pertanyaan wawancara & Kuis,Penjelasan mendetail,Coba tebak jawabannya,Topik umum Javascript,Dasar-dasar React Native
Italian,Le domande più comuni,"JS, React e React Native",Metti alla prova le tue conoscenze,Domande da colloquio e quiz,Spiegazioni dettagliate,Prova a indovinare la risposta,Argomenti comuni di Javascript,Le basi di React Native
Japanese,よくある質問,JS、React、React Native,知識を試そう,面接問題とクイズ,詳しい解説,答えを推測してみよう,Javascript の主なトピック,React Native の基礎
Korean,가장 일반적인 질문,"JS, React 및 React Native",당신의 지식을 시험해 보세요,인터뷰 질문 및 퀴즈,상세한 설명,정답을 맞춰보세요,Javascript 주요 토픽,React Native 핵심
Malay,Soalan paling lazim,"JS, React dan React Native",Uji pengetahuan anda,Soalan temuduga & Kuiz,Penjelasan terperinci,Cuba teka jawapannya,Topik lazim Javascript,Asas React Native
Norwegian,De vanligste spørsmålene,"JS, React og React Native",Test kunnskapen din,Intervjuspørsmål og quizer,Detaljerte forklaringer,Prøv å gjette svaret,Vanlige Javascript-emner,Grunnleggende React Native
Polish,Najczęstsze pytania,"JS, React i React Native",Sprawdź swoją wiedzę,Pytania rekrutacyjne i quizy,Szczegółowe wyjaśnienia,Spróbuj odgadnąć odpowiedź,Popularne tematy Javascript,Podstawy React Native
Portuguese (Brazil),Perguntas mais comuns,"JS, React e React Native",Teste seus conhecimentos,Perguntas de entrevista e quizzes,Explicações detalhadas,Tente adivinhar a resposta,Tópicos comuns de Javascript,Fundamentos do React Native
Portuguese (Portugal),Perguntas mais comuns,"JS, React e React Native",Teste os seus conhecimentos,Perguntas de entrevista e quizzes,Explicações detalhadas,Tente adivinhar a resposta,Tópicos comuns de Javascript,Fundamentos de React Native
Romanian,Cele mai frecvente întrebări,"JS, React și React Native",Testează-ți cunoștințele,Întrebări de interviu și teste,Explicații detaliate,Încearcă să ghicești răspunsul,Subiecte comune Javascript,Bazele React Native
Russian,Самые частые вопросы,"JS, React и React Native",Проверьте свои знания,Вопросы с собеседований и квизы,Подробные объяснения,Попробуйте угадать ответ,Основные темы Javascript,Основы React Native
Slovak,Najčastejšie otázky,"JS, React a React Native",Otestujte si svoje vedomosti,Otázky na pohovor a kvízy,Podrobné vysvetlenia,Skúste uhádnuť odpoveď,Bežné témy Javascriptu,Základy React Native
Spanish (Mexico),Preguntas más comunes,"JS, React y React Native",Pon a prueba tus conocimientos,Preguntas de entrevista y quizzes,Explicaciones detalladas,Intenta adivinar la respuesta,Temas comunes de Javascript,Fundamentos de React Native
Spanish (Spain),Preguntas más frecuentes,"JS, React y React Native",Pon a prueba tus conocimientos,Preguntas de entrevista y quizzes,Explicaciones detalladas,Intenta adivinar la respuesta,Temas comunes de Javascript,Fundamentos de React Native
Swedish,Vanligaste frågorna,"JS, React och React Native",Testa dina kunskaper,Intervjufrågor och quiz,Detaljerade förklaringar,Försök gissa svaret,Vanliga Javascript-ämnen,Grunderna i React Native
Thai,คำถามที่พบบ่อยที่สุด,"JS, React และ React Native",ทดสอบความรู้ของคุณ,คำถามสัมภาษณ์และแบบทดสอบ,คำอธิบายโดยละเอียด,ลองเดาคำตอบดูสิ,หัวข้อทั่วไปของ Javascript,พื้นฐาน React Native
Turkish,En sık sorulan sorular,"JS, React ve React Native",Bilgini sına,Mülakat soruları ve testler,Ayrıntılı açıklamalar,Cevabı tahmin etmeye çalış,Yaygın Javascript konuları,React Native Temelleri
Ukrainian,Найпоширеніші запитання,"JS, React та React Native",Перевірте свої знання,Питання для співбесіди та квізи,Детальні пояснення,Спробуйте вгадати відповідь,Популярні теми Javascript,Основи React Native
Vietnamese,Các câu hỏi thường gặp,"JS, React và React Native",Kiểm tra kiến thức của bạn,Câu hỏi phỏng vấn & đố vui,Giải thích chi tiết,Thử đoán câu trả lời,Các chủ đề Javascript phổ biến,React Native cơ bản`;

// Get all available languages
export const getAvailableLanguages = (): string[] => {
  const parsed = parseMarketingMessages(marketingMessagesCSV);
  return parsed.map((row) => row.language);
};

// Get marketing messages for a specific language
export const getMarketingMessagesForLanguage = (language: string): string[] => {
  const parsed = parseMarketingMessages(marketingMessagesCSV);
  const row = parsed.find((row) => row.language === language);
  return row ? row.messages : [];
};
