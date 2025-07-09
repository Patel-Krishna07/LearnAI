
/**
 * @fileOverview Defines a Genkit tool for generating images from text prompts.
 *
 * - generateImageFromTextTool - A Genkit tool that generates an image based on a text description.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateImageToolInputSchema = z.object({
  prompt: z.string().describe('The text description of the image to generate.'),
});

export const GenerateImageToolOutputSchema = z.object({
  imageDataUri: z.string().optional().describe('The generated image as a data URI. Format: data:image/png;base64,<encoded_data>.'),
  error: z.string().optional().describe('An error message if image generation failed.'),
});

export const generateImageFromTextTool = ai.defineTool(
  {
    name: 'generateImageFromTextTool',
    description: 'Generates an image from a given text prompt. Use this tool when the user explicitly asks to create, draw, or generate an image.',
    inputSchema: GenerateImageToolInputSchema,
    outputSchema: GenerateImageToolOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    const delayMs = 2000;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const {media, text} = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation', // Specific model for image generation
          prompt: input.prompt,
          config: {
            responseModalities: ['TEXT', 'IMAGE'], // Must provide both
          },
        });

        if (media && media.url) {
          return { imageDataUri: media.url };
        } else {
          return { error: text || 'Image generation did not return an image or a specific error message.' };
        }
      } catch (e: any) {
        lastError = e;
        if (attempt < maxRetries && (e.message?.includes('503') || e.message?.includes('overloaded'))) {
          console.log(`Image generation attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Non-retryable error or last attempt failed
          console.error("Error in generateImageFromTextTool:", e);
          return { error: e.message || 'Failed to generate image due to an unexpected error.' };
        }
      }
    }
    // This part is for fallback in case loop exits unexpectedly
    return { error: lastError?.message || 'Failed to generate image after multiple retries.' };
  }
);
