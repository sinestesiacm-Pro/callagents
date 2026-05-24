export async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    // The response is [[["translated text", "original", ...]], ...]
    const translated = data?.[0]?.map((segment: string[]) => segment[0]).join("") || text;
    return translated;
  } catch {
    return text;
  }
}
