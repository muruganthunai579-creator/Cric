import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { PredictionState } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAstrologicalInsight = async (prediction: PredictionState): Promise<string> => {
  if (!process.env.API_KEY) return "AI Insights unavailable: API Key missing.";

  const ai = getClient();
  const modelId = 'gemini-2.5-flash';

  const prompt = `
    You are an expert Vedic Astrologer specializing in Pancha Pakshi Shastra (Five Birds Astrology).
    
    Interpret the following prediction for a cricket match:
    
    Match: ${prediction.teamA} vs ${prediction.teamB}
    Day: ${prediction.dayOfWeek}
    Moon Phase: ${prediction.moonPhase}
    Time Slot (Yama): ${prediction.timeSlot}
    
    Team A (${prediction.teamA}):
    - Bird: ${prediction.birdA}
    - Activity State: ${prediction.activityA}
    
    Team B (${prediction.teamB}):
    - Bird: ${prediction.birdB}
    - Activity State: ${prediction.activityB}
    
    Winner Predicted: ${prediction.winner}
    
    Please provide a mystical yet logical explanation of why the winner is favored based on the relationship between the birds and their activities (Rule/Eat/Walk/Sleep/Die). 
    Keep it concise (under 150 words) and engaging. Use astrological terminology but explain it simply.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || " The stars are silent currently.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The cosmic connection is currently weak. (AI Error)";
  }
};

export const chatWithAstrologer = async (history: {role: 'user'|'model', text: string}[], newMessage: string): Promise<string> => {
    if (!process.env.API_KEY) return "Chat unavailable: API Key missing.";

    const ai = getClient();
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are a mystical Pancha Pakshi Astrologer. You answer queries about cricket predictions, lucky times, and bird compatibility. Be helpful, concise, and mystical.",
        },
        history: history.map(h => ({
            role: h.role,
            parts: [{ text: h.text }]
        }))
    });

    try {
        const result = await chat.sendMessage({ message: newMessage });
        return result.text || "I cannot foresee that.";
    } catch (e) {
        console.error(e);
        return "The spirits are disturbed.";
    }
};
