import { GoogleGenAI } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWordList = async (prompt: string): Promise<string[]> => {
  try {
    const ai = getGeminiClient();
    
    // We want a JSON array of strings
    const systemInstruction = `
      You are a creative assistant for an AR filter app. 
      Generate a list of 20 short, punchy words or phrases based on the user's theme.
      Include emojis mixed with text.
      Keep individual strings under 6 characters if possible for better visibility.
      Output ONLY a raw JSON array of strings. No markdown formatting.
      Example: ["Wow!", "OMG", "🔥", "Cool", "Nice!"]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
        return parsed.map(String);
    }
    return [];

  } catch (error) {
    console.error("Gemini generation error:", error);
    throw error;
  }
};