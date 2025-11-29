import { GoogleGenAI } from "@google/genai";

// Initialize the client
// API Key is assumed to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Edits an image using Gemini 2.5 Flash Image based on a text prompt.
 * 
 * @param base64Image The source image in base64 format (data:image/png;base64,...)
 * @param prompt The instruction for editing (e.g., "Add a retro filter")
 * @returns The edited image as a base64 string
 */
export const editImageWithGemini = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Extract base64 data and mimeType
    const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 image format");
    }
    const mimeType = matches[1];
    const data = matches[2];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: data,
            },
          },
        ],
      },
    });

    // Iterate through parts to find the image output
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          // Construct the new base64 string. 
          // Note: The API usually returns the same mime type or png/jpeg. 
          // We'll assume the mime type provided in response or default to png if not present.
          const returnedMime = part.inlineData.mimeType || 'image/png';
          return `data:${returnedMime};base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in response");

  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};