import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  DEFAULT_MODEL,
  assertGeminiConfigured,
  isGeminiConfigured,
  parseJsonFromModelText,
} from "@/lib/gemini";

export { assertGeminiConfigured, isGeminiConfigured, parseJsonFromModelText };

export function getGenAIModelJson() {
  assertGeminiConfigured();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  return genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: { responseMimeType: "application/json" },
  });
}
