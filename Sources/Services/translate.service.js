import { GoogleGenAI } from "@google/genai";
import config from "../../Configuration/config.js"

const translate = async function (text, inputLanguage, targetLanguage) {
  if (!text || !inputLanguage || !targetLanguage) return;
  const ai = new GoogleGenAI({ apiKey: config.geminiKey });
  const prompt = `
  Translate the following ${inputLanguage} text to casual, day-to-day ${targetLanguage} .
  While converting make sure to translate the text as it is to be used further 
  for dubbing of movies/series in ${targetLanguage} .
  
  STRICT RULES:
  1. Output ONLY the translated text.
  2. Do NOT provide explanations, options, or notes.
  3. Do NOT use quotes or bold text.
  4. Use common day to day life ${targetLanguage} as we get in dubbing with ${inputLanguage} loanwords where natural.

  Original Text: ${text}
`;

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