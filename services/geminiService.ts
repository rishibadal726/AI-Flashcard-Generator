
import { GoogleGenAI, Type } from "@google/genai";
import type { Flashcard, FileData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateFlashcards = async (
  fileData: FileData,
  maxCards: number
): Promise<Flashcard[]> => {
  const { content, mimeType } = fileData;

  const prompt = `
    Based on the provided content, generate a maximum of ${maxCards} flashcards.
    Each flashcard must have a concise 'question' and a short, easy-to-understand 'answer'.
    The goal is to create effective study material. Avoid overly long text on either side of the card.
    Return the result as a JSON array of objects, where each object has a 'question' and 'answer' key.
  `;
  
  const model = 'gemini-2.5-flash';

  const contents = mimeType.startsWith('image/')
    ? {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: content,
            },
          },
        ],
      }
    : {
        parts: [
          { text: prompt },
          { text: `Here is the content:\n\n${content}` },
        ],
      };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ["question", "answer"],
          },
        },
      },
    });

    // FIX: When a responseSchema is used, the response text is a clean JSON string.
    // The .trim() is not necessary and could cause issues if the response is unexpectedly empty.
    const jsonText = response.text;
    const flashcards: Flashcard[] = JSON.parse(jsonText);
    
    if (!Array.isArray(flashcards) || flashcards.some(fc => !fc.question || !fc.answer)) {
      throw new Error("Invalid flashcard format received from AI.");
    }
    
    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards. The AI model might be busy or the content could not be processed.");
  }
};