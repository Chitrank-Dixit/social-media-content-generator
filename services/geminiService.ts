import { GoogleGenAI, Type } from "@google/genai";
import { PlatformId, SocialPost, Tone, HistoryItem } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the text content and image prompts for all platforms.
 */
export const generateSocialText = async (topic: string, tone: Tone): Promise<SocialPost[]> => {
  const prompt = `
    You are a world-class social media manager. 
    Create content for the topic: "${topic}".
    The tone must be: "${tone}".

    Generate 3 distinct posts:
    1. LinkedIn: Long-form, professional formatting, insight-driven.
    2. Twitter/X: Short, punchy, thread-style or single impactful tweet, max 280 chars equivalent logic (but can be slightly longer if thread).
    3. Instagram: Visual-focused caption, engaging hook, clean spacing, relevant hashtags.

    For each post, also write a highly detailed, creative AI image generation prompt that suits the platform's aesthetic and the post's content.
    
    Return strictly JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            platformId: { type: Type.STRING, enum: [PlatformId.LINKEDIN, PlatformId.TWITTER, PlatformId.INSTAGRAM] },
            content: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ['platformId', 'content', 'imagePrompt']
        }
      }
    }
  });

  const rawPosts = JSON.parse(response.text || '[]');

  // Map raw posts to our internal structure with predefined settings per platform
  return rawPosts.map((post: any) => {
    let aspectRatio: SocialPost['aspectRatio'] = '1:1';
    let platformName = '';

    switch (post.platformId) {
      case PlatformId.LINKEDIN:
        aspectRatio = '4:3'; // Professional, fills feed well
        platformName = 'LinkedIn';
        break;
      case PlatformId.TWITTER:
        aspectRatio = '16:9'; // Standard link card/image preview size
        platformName = 'Twitter / X';
        break;
      case PlatformId.INSTAGRAM:
        aspectRatio = '3:4'; // Vertical feed optimized
        platformName = 'Instagram';
        break;
    }

    return {
      ...post,
      platformName,
      aspectRatio,
    } as SocialPost;
  });
};

/**
 * Generates an image using Imagen 3 via the Google GenAI SDK.
 */
export const generatePlatformImage = async (prompt: string, aspectRatio: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio,
        outputMimeType: 'image/jpeg'
      }
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/jpeg;base64,${imageBytes}`;
    }
    return undefined;
  } catch (error) {
    console.error("Image generation failed:", error);
    return undefined; // Handle gracefully in UI
  }
};

/**
 * Analyzes social media history and provides insights.
 */
export const generateAnalyticsInsights = async (history: HistoryItem[]): Promise<string> => {
  // Filter to last 20 items to avoid context window issues if history grows large, though Flash handles 1M context.
  // It's good practice to be concise.
  const recentHistory = history.slice(0, 50).map(h => ({
    platform: h.platformName,
    tone: h.tone,
    metrics: h.metrics,
    snippet: h.content.substring(0, 30) + "..."
  }));

  const prompt = `
    Analyze this social media performance history for a user:
    ${JSON.stringify(recentHistory, null, 2)}

    Your goal is to act as a data analyst.
    Provide a strategic analysis focusing on:
    1. Performance patterns (which platforms and tones are getting the most engagement).
    2. Anomalies or standout successes.
    3. One clear, actionable recommendation for their next post.

    Format the response as an HTML fragment (without <html> or <body> tags).
    Use <h3> for headings, <p> for paragraphs, <ul class="list-disc pl-5 space-y-1"> for lists, and <strong> for emphasis.
    Keep the tone encouraging and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "<p>Could not generate insights at this time.</p>";
  } catch (error) {
    console.error("Analytics generation failed:", error);
    return "<p>Error generating insights. Please try again later.</p>";
  }
};
