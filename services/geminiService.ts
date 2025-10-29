
import { GoogleGenAI, Type } from "@google/genai";
import type { BackgroundOption, AudioOption, StyleOption, GenerationType } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const createSystemInstruction = (background: BackgroundOption, promptCount: number, audio: AudioOption, style: StyleOption, generationType: GenerationType): string => {
  let styleInstruction = '';
  switch (style) {
    case '3d_render':
      styleInstruction = "The visual style must be a high-quality 3D render. Emphasize realistic lighting, shadows, textures, and depth.";
      break;
    case 'flat_design':
      styleInstruction = "The visual style must be 2D flat design. Use simple shapes, a limited and modern color palette, and clean lines without gradients or shadows.";
      break;
    case 'cartoon':
      styleInstruction = "The visual style must be a vibrant and expressive cartoon. Emphasize exaggerated movements, bold outlines, and a playful feel.";
      break;
    case 'pixel_art':
      styleInstruction = "The visual style must be pixel art. Use a limited color palette and a low-resolution, blocky aesthetic reminiscent of classic video games.";
      break;
    case 'watercolor':
      styleInstruction = "The visual style must be a beautiful watercolor. Emphasize soft edges, blended colors, and a textured, hand-painted look.";
      break;
    case 'isometric':
        styleInstruction = "The visual style must be isometric. Use a 2.5D perspective with a clean, technical look. All objects should be drawn on an isometric grid.";
        break;
    case 'cinematic':
        styleInstruction = "The visual style must be cinematic. Emphasize dramatic lighting, epic camera angles (e.g., wide shots, close-ups), shallow depth of field, and a high-quality, film-like aesthetic.";
        break;
    case 'realistic':
        styleInstruction = "The visual style must be photorealistic. Strive for maximum realism, with accurate physics, lifelike materials and textures, and natural lighting.";
        break;
    case 'surrealism':
        styleInstruction = "The visual style must be surrealism. Create a dream-like, bizarre, and illogical scene. Emphasize unexpected juxtapositions and a strange, otherworldly atmosphere.";
        break;
    default:
      styleInstruction = "The AI will decide the most appropriate visual style based on the user's description.";
      break;
  }

  if (generationType === 'video') {
    const backgroundInstruction = background === 'greenscreen'
      ? "The animation MUST have a solid green screen background (#00FF00) for easy chroma keying. Do not describe any other background elements."
      : "Describe a detailed and fitting background environment that complements the main subject.";

    const audioInstruction = audio === 'with_audio'
      ? "The prompt should also include a description of appropriate sound effects or a suitable music track (e.g., 'with sound of gentle waves', 'upbeat corporate music')."
      : "CRITICAL INSTRUCTION: The animation must be completely silent. Under no circumstances should you include any keywords, phrases, or descriptions related to audio, sound effects, foley, or music. The final prompt must focus only on the visual aspects.";
    
    return `
      You are an expert prompt creator for AI animation generators, specializing in content for microstock websites like Shutterstock and Adobe Stock.
      Your task is to take a user's simple description and expand it into ${promptCount} detailed, keyword-rich, and varied prompts.
      Each prompt must be a single, comma-separated list of descriptive phrases.
      Focus on visual details, lighting, composition, camera angles, and technical specifications.
      Each generated animation should always be a perfect, seamless loop.
      Include keywords that are highly relevant for microstock searches.
      
      ${styleInstruction}

      ${backgroundInstruction}

      ${audioInstruction}

      Your final output MUST be a valid JSON array of strings, where each string is a complete prompt. For example: ["prompt 1", "prompt 2"].
      Do not add any other text or explanations outside of the JSON array.
    `;
  } else { // 'image'
    const backgroundInstruction = background === 'greenscreen'
      ? "The image MUST have a solid green screen background (#00FF00) for easy chroma keying. Do not describe any other background elements."
      : "Describe a detailed and fitting background environment that complements the main subject.";
    
    return `
      You are an expert prompt creator for AI image generators, specializing in content for microstock websites like Shutterstock and Adobe Stock.
      Your task is to take a user's simple description and expand it into ${promptCount} detailed, keyword-rich, and varied prompts for a static image.
      Each prompt must be a single, comma-separated list of descriptive phrases.
      Focus on visual details, lighting, composition, subject matter, and technical specifications.
      Include keywords that are highly relevant for microstock searches (e.g., photorealistic, 8k, hyperdetailed, isolated on white background, cinematic lighting).
      
      ${styleInstruction}

      ${backgroundInstruction}

      CRITICAL INSTRUCTION: Do not include any keywords related to animation, movement, video, or sound. The prompts are for still images only.

      Your final output MUST be a valid JSON array of strings, where each string is a complete prompt. For example: ["prompt 1", "prompt 2"].
      Do not add any other text or explanations outside of the JSON array.
    `;
  }
};

export const generateAnimationPrompts = async (
  userInput: string,
  background: BackgroundOption,
  promptCount: number,
  audio: AudioOption,
  style: StyleOption,
  generationType: GenerationType
): Promise<string[]> => {
  try {
    const systemInstruction = createSystemInstruction(background, promptCount, audio, style, generationType);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate ${promptCount} ${generationType} prompt(s) for: "${userInput}"`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.9,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: `A single, detailed, keyword-rich ${generationType} prompt.`
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Received an empty response from the AI.");
    }
    
    try {
      const prompts = JSON.parse(text);
      if (!Array.isArray(prompts) || prompts.some(p => typeof p !== 'string')) {
        throw new Error("AI returned data in an unexpected format.");
      }
      return prompts;
    } catch (parseError) {
      console.error("Failed to parse JSON response:", text);
      throw new Error("The AI returned an invalid response. Please try again.");
    }

  } catch (error) {
    console.error("Error generating prompt with Gemini:", error);
    if (error instanceof Error && error.message.includes('API key')) {
        throw new Error("API key is invalid or missing. Please check your configuration.");
    }
    throw new Error(`Failed to generate ${generationType} prompt. The AI service may be temporarily unavailable.`);
  }
};
