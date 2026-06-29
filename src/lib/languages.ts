/**
 * Supported languages for LangsHub.
 * hasTransliteration = true means the language benefits from a phonetic
 * romanisation layer (e.g. Pinyin for Chinese, Romaji for Japanese).
 * When false, the transliteration field is hidden in the UI.
 */
export interface Language {
  code: string;      // ISO 639-1
  name: string;
  flag: string;      // emoji flag
  hasTransliteration: boolean;
  transliterationLabel?: string; // e.g. "Pinyin", "Romaji", "Romanisation"
  rtl?: boolean;     // right-to-left script
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English",    flag: "🇬🇧", hasTransliteration: false },
  { code: "fr", name: "French",     flag: "🇫🇷", hasTransliteration: false },
  { code: "es", name: "Spanish",    flag: "🇪🇸", hasTransliteration: false },
  { code: "de", name: "German",     flag: "🇩🇪", hasTransliteration: false },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", hasTransliteration: false },
  { code: "it", name: "Italian",    flag: "🇮🇹", hasTransliteration: false },
  { code: "nl", name: "Dutch",      flag: "🇳🇱", hasTransliteration: false },
  { code: "sv", name: "Swedish",    flag: "🇸🇪", hasTransliteration: false },
  { code: "pl", name: "Polish",     flag: "🇵🇱", hasTransliteration: false },
  { code: "tr", name: "Turkish",    flag: "🇹🇷", hasTransliteration: false },
  { code: "ru", name: "Russian",    flag: "🇷🇺", hasTransliteration: true, transliterationLabel: "Romanisation" },
  { code: "ar", name: "Arabic",     flag: "🇸🇦", hasTransliteration: true, transliterationLabel: "Romanisation", rtl: true },
  { code: "hi", name: "Hindi",      flag: "🇮🇳", hasTransliteration: true, transliterationLabel: "Romanisation" },
  { code: "zh", name: "Chinese",    flag: "🇨🇳", hasTransliteration: true, transliterationLabel: "Pinyin" },
  { code: "ja", name: "Japanese",   flag: "🇯🇵", hasTransliteration: true, transliterationLabel: "Romaji" },
  { code: "ko", name: "Korean",     flag: "🇰🇷", hasTransliteration: true, transliterationLabel: "Romanisation" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", hasTransliteration: false },
  { code: "th", name: "Thai",       flag: "🇹🇭", hasTransliteration: true, transliterationLabel: "Romanisation" },
  { code: "el", name: "Greek",      flag: "🇬🇷", hasTransliteration: false },
  { code: "he", name: "Hebrew",     flag: "🇮🇱", hasTransliteration: true, transliterationLabel: "Romanisation", rtl: true },
];

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find(l => l.code === code);
}

export function getLangLabel(code: string): string {
  const l = getLanguage(code);
  return l ? `${l.flag} ${l.name}` : code;
}

// ── Sample card shown on the landing page per language pair ─────────────────
const SAMPLE_CARDS: Record<string, { sourceText: string; transliteration?: string; targetText: string }> = {
  "en-es": { sourceText: "hello",      targetText: "hola" },
  "en-fr": { sourceText: "hello",      targetText: "bonjour" },
  "en-de": { sourceText: "hello",      targetText: "hallo" },
  "en-pt": { sourceText: "hello",      targetText: "olá" },
  "en-it": { sourceText: "hello",      targetText: "ciao" },
  "en-nl": { sourceText: "hello",      targetText: "hallo" },
  "en-sv": { sourceText: "hello",      targetText: "hej" },
  "en-pl": { sourceText: "hello",      targetText: "cześć" },
  "en-tr": { sourceText: "hello",      targetText: "merhaba" },
  "en-ru": { sourceText: "hello",      transliteration: "Privet", targetText: "Привет" },
  "en-ar": { sourceText: "hello",      transliteration: "Marhaban", targetText: "مرحبا" },
  "en-hi": { sourceText: "hello",      transliteration: "Namaste", targetText: "नमस्ते" },
  "en-zh": { sourceText: "hello",      transliteration: "nǐ hǎo", targetText: "你好" },
  "en-ja": { sourceText: "hello",      transliteration: "Konnichiwa", targetText: "こんにちは" },
  "en-ko": { sourceText: "hello",      transliteration: "Annyeonghaseyo", targetText: "안녕하세요" },
  "en-vi": { sourceText: "hello",      targetText: "xin chào" },
  "en-th": { sourceText: "hello",      transliteration: "Sawadee", targetText: "สวัสดี" },
  "en-el": { sourceText: "hello",      targetText: "γεια σας" },
  "en-he": { sourceText: "hello",      transliteration: "Shalom", targetText: "שלום" },
};

export function getSampleCard(sourceLang: string, targetLang: string) {
  const key = `${sourceLang}-${targetLang}`;
  return SAMPLE_CARDS[key] ?? { sourceText: "hello", targetText: "..." };
}

// ── Language-pair preference persisted in localStorage ──────────────────────
const SOURCE_KEY = "lh_source_lang";
const TARGET_KEY = "lh_target_lang";

export function getStoredPair(): { sourceLang: string; targetLang: string } {
  if (typeof window === "undefined") return { sourceLang: "en", targetLang: "es" };
  return {
    sourceLang: localStorage.getItem(SOURCE_KEY) ?? "en",
    targetLang: localStorage.getItem(TARGET_KEY) ?? "es",
  };
}

export function setStoredPair(sourceLang: string, targetLang: string) {
  localStorage.setItem(SOURCE_KEY, sourceLang);
  localStorage.setItem(TARGET_KEY, targetLang);
}
