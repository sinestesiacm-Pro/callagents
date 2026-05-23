export type RetellLanguage =
  | "en-US" | "en-IN" | "en-GB" | "en-AU" | "en-NZ"
  | "de-DE"
  | "es-ES" | "es-419"
  | "hi-IN"
  | "fr-FR" | "fr-CA"
  | "ja-JP"
  | "pt-PT" | "pt-BR"
  | "zh-CN"
  | "ru-RU" | "it-IT" | "ko-KR"
  | "nl-NL" | "nl-BE"
  | "pl-PL" | "tr-TR" | "vi-VN"
  | "multi";

const langMap: Record<string, RetellLanguage> = {
  es: "es-ES",
  en: "en-US",
  pt: "pt-BR",
  fr: "fr-FR",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  zh: "zh-CN",
  ru: "ru-RU",
  hi: "hi-IN",
  nl: "nl-NL",
  pl: "pl-PL",
  tr: "tr-TR",
  vi: "vi-VN",
};

export function toRetellLanguage(short: string): RetellLanguage {
  return langMap[short] || "multi";
}
