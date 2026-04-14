import { GoogleGenAI } from "@google/genai";
import config from "../../Configuration/config.js"

const translate = async function (text, inputLanguage, targetLanguage) {
  if (!text || !inputLanguage || !targetLanguage) return;
  const ai = new GoogleGenAI({ apiKey: config.geminiKey });
  const prompt = `ROLE: Professional Movie Dubbing Translator & Script Adapter.
TASK:
Translate the following ${inputLanguage} text into natural, conversational ${targetLanguage} 
with the same meaning and intent. The translation MUST be semantic, not phonetic.

CRITICAL TRANSLATION RULES:
1. MEANING FIRST: Always translate the meaning. NEVER transliterate or copy pronunciation from ${inputLanguage}.
   Example: "Hey there" → a natural greeting in ${targetLanguage}, NOT phonetic text.
2. NAMES: Keep proper names unchanged (e.g., William, New York).
3. NATURAL SPEECH: The result should sound like a real person speaking in a movie dub.
4. NO WORD-BY-WORD TRANSLATION: Rewrite if needed to sound natural.

TTS OPTIMIZATION:
5. NUMBERS: Convert digits into spoken words in ${targetLanguage}.
6. ABBREVIATIONS: Expand into spoken form.
7. PUNCTUATION: Use commas and periods only for natural pauses (no extra spacing).
8. SYMBOLS: Replace symbols with words.

STRICT OUTPUT:
- Output ONLY the final translated sentence.
- No explanations.
- No phonetic spellings.
- No extra spaces between words.

Original Text:
${text}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite", // Ensure model name is correct for 2026
      contents: [
        {
          role: "user",
          parts: [{
            text: `${prompt}`
          }]
        }
      ]
    });
    console.log("Translated Hindi:", response.text);
    return response.text;
  } catch (error) {
    console.error("Error occurred:", error.message);
  }
}

export { translate };