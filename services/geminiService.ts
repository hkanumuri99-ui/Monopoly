import { GoogleGenAI } from "@google/genai";
import { GameState, BoardSpace } from "../types";
import { BOARD_SPACES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiCommentary = async (
  gameState: GameState,
  lastAction: string,
  targetSpaceId?: number
): Promise<string> => {
  if (!process.env.API_KEY) return "AI commentary unavailable (Missing API Key).";

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const spaceName = targetSpaceId !== undefined ? BOARD_SPACES[targetSpaceId].name : "unknown";
  
  const prompt = `
    You are a witty, slightly sarcastic Monopoly sports commentator.
    
    Current situation:
    - Player: ${currentPlayer.name} (playing as ${currentPlayer.token})
    - Money: $${currentPlayer.money}
    - Action: ${lastAction}
    - Location: ${spaceName}
    
    Provide a ONE sentence commentary on this move. Be funny. If they bought something, judge the investment. If they paid rent, mock them gently.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 60,
        temperature: 0.9,
      }
    });
    return response.text || "Interesting move...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};
