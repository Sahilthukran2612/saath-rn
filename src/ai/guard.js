// The safety rules for anything an AI writes, applied on the phone to every reply, whatever the server did.
// Saath never calculates or suggests a dose, never diagnoses, and never says what a reading means. If the model
// breaks one of those rules the text is thrown away and a safe line is shown instead. Pure functions, tested.

// An amount of a medicine: "500 mg", "2 tablets", "10 units", "1 ml", "two tablets" ...
// (JavaScript's \b only knows ASCII letters, so the Hindi half has no \b.)
const AMOUNT = new RegExp(
  '\\b(?:\\d+(?:[.,]\\d+)?|one|two|three|four|five|half)\\s*(?:mg|mcg|µg|ml|iu|units?|u|tabs?|tablets?|pills?|capsules?|drops?|spoons?|teaspoons?)\\b' +
    '|(?:\\d+|आधा|एक|दो|तीन|चार|पाँच)\\s*(?:गोली|गोलियाँ|यूनिट|मिलीग्राम|बूँद|चम्मच)',
  'i'
);
// Words that tell a person to change what they take.
const DOSE_VERBS =
  /\b(increase|decrease|reduce|raise|lower|double|halve|skip|stop|start|take (?:an )?extra|take more|take less|adjust)\b[^.!?\n]{0,40}\b(dose|insulin|medicine|medication|tablet|pill|metformin|glimepiride)\b|\b(dose|insulin)\b[^.!?\n]{0,30}\b(increase|decrease|reduce|raise|lower|double|halve|skip|stop|adjust)\b|(खुराक|इंसुलिन|दवा)[^।.!?\n]{0,30}(बढ़ा|घटा|कम कर|ज़्यादा कर|बंद कर|छोड़)/i;
// A diagnosis, or a reading called good or bad.
const DIAGNOSIS =
  /\byou (?:have|probably have|may have|might have|likely have|are suffering from|suffer from)\b[^.!?\n]{0,40}\b(diabet|hypo|hyper|infection|neuropathy|retinopathy|kidney|heart|cancer|anaemia|anemia|thyroid)|\b(diagnos(?:e|is|ed)|you are diabetic|it is diabetes|that means you)\b|\b(sugar|glucose|reading|level)\b[^.!?\n]{0,30}\b(is|are|looks?|seems?)\b[^.!?\n]{0,15}\b(too high|too low|dangerous|normal|abnormal|good|bad|fine|healthy|controlled|uncontrolled)\b|(आपको|आप)[^।.!?\n]{0,25}(डायबिटीज़|मधुमेह|संक्रमण|बीमारी)[^।.!?\n]{0,15}(है|हो सकता)/i;

export const violates = (text) => {
  const s = String(text || '');
  return AMOUNT.test(s) || DOSE_VERBS.test(s) || DIAGNOSIS.test(s);
};

// Anything that sounds like an emergency or a very low sugar is never chatted about. The phone points to the real
// alert and a real person. These are matched on what the PERSON typed, before anything is sent anywhere.
const EMERGENCY =
  /\b(chest pain|heart attack|can'?t breathe|cannot breathe|hard to breathe|unconscious|fainted|passed out|collapsed|seizure|stroke|bleeding|very low sugar|sugar (?:is )?(?:very )?low|low sugar|hypo|shaking and sweating|suicid|kill myself|want to die|fell down|i fell|have fallen)\b|(सीने में दर्द|दिल का दौरा|साँस नहीं|सांस नहीं|बेहोश|चक्कर खाकर गिर|दौरा पड़|खून बह|शुगर (?:बहुत )?कम|गिर गया|गिर गई|मरना चाहता|मरना चाहती)/i;

export const isEmergency = (text) => EMERGENCY.test(String(text || ''));

export const SAFE_LINE = {
  en: 'I cannot help with that safely. Please ask your doctor or the clinic, or one of the people in your circle.',
  hi: 'मैं इसमें सुरक्षित तरीके से मदद नहीं कर सकता। कृपया अपने डॉक्टर, क्लिनिक या अपने घेरे के किसी व्यक्ति से पूछें।',
};

// A model reply, made safe. Strips markup, caps the length, replaces anything that breaks the rules.
export function sanitizeReply(text, lang = 'en', max = 700) {
  const clean = String(text || '')
    .replace(/[*_`#>]+/g, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
  if (!clean || violates(clean)) return { text: SAFE_LINE[lang] || SAFE_LINE.en, blocked: true };
  return { text: clean, blocked: false };
}

// One suggestion card from the model: a short title and a short body, both safe, or nothing.
export function sanitizeCard(card, lang = 'en') {
  if (!card || typeof card !== 'object') return null;
  const title = String(card.title || '')
    .replace(/[*_`#>]+/g, '')
    .trim()
    .slice(0, 48);
  const body = String(card.body || '')
    .replace(/[*_`#>]+/g, '')
    .trim()
    .slice(0, 160);
  if (title.length < 3 || body.length < 8) return null;
  if (violates(title) || violates(body)) return null;
  void lang;
  return { title, body };
}
