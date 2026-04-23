import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface TranslationResult {
  identifiedLanguage: string;
  transcription: string;
  translation: string;
}

/**
 * Translates existing text into a specific target language.
 * @param text The text to translate
 * @param targetLanguage The target language name
 */
export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          text: `Translate the following text into ${targetLanguage}:
"${text}"

Return ONLY the translated text.`,
        },
      ],
    },
  });

  return response.text?.trim() || "";
}

/**
 * @param base64Audio Base64 encoded audio string
 * @param mimeType Mime type of the audio (e.g., 'audio/webm')
 * @param targetLanguage The name of the language to translate into (e.g., 'Malayalam')
 */
export async function processVoiceInput(base64Audio: string, mimeType: string, targetLanguage: string): Promise<TranslationResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType,
          },
        },
        {
          text: `Task: 
1. Identify the language spoken in this audio.
2. Transcribe exactly what was said in its native script.
3. Translate the transcription into ${targetLanguage}.

Return the result STRICTLY as a JSON object with the following structure:
{
  "identifiedLanguage": "Language Name",
  "transcription": "Original transcript",
  "translation": "Translated text in ${targetLanguage}"
}`,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedLanguage: { type: Type.STRING },
          transcription: { type: Type.STRING },
          translation: { type: Type.STRING },
        },
        required: ["identifiedLanguage", "transcription", "translation"],
      },
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Could not process audio. Please try again.");
  }
}
