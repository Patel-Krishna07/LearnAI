'use server';

/**
 * @fileOverview A Genkit flow for generating a fill-in-the-blank question.
 *
 * - generateFillBlank - A function that generates a fill-in-the-blank question on a given topic.
 * - GenerateFillBlankInput - The input type for the generateFillBlank function.
 * - GenerateFillBlankOutput - The return type for the generateFillBlank function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFillBlankInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the question.'),
});
export type GenerateFillBlankInput = z.infer<typeof GenerateFillBlankInputSchema>;

const GenerateFillBlankOutputSchema = z.object({
  question: z.string().describe('A sentence with "[BLANK]" as a placeholder for the answer.'),
  answer: z.string().describe('The word or short phrase that fills the blank.'),
});
export type GenerateFillBlankOutput = z.infer<typeof GenerateFillBlankOutputSchema>;

export async function generateFillBlank(input: GenerateFillBlankInput): Promise<GenerateFillBlankOutput> {
  return generateFillBlankFlow(input);
}

const generateFillBlankPrompt = ai.definePrompt({
  name: 'generateFillBlankPrompt',
  input: { schema: GenerateFillBlankInputSchema },
  output: { schema: GenerateFillBlankOutputSchema },
  model: 'googleai/gemini-pro',
  prompt: `You are an expert educator. Your task is to generate a single fill-in-the-blank question for the given topic: {{{topic}}}.

  Create a sentence that has a clear, single-word or short-phrase answer.
  Use the exact placeholder "[BLANK]" to represent where the user should fill in their answer.
  Return the result in the specified JSON format.`,
});

const generateFillBlankFlow = ai.defineFlow(
  {
    name: 'generateFillBlankFlow',
    inputSchema: GenerateFillBlankInputSchema,
    outputSchema: GenerateFillBlankOutputSchema,
  },
  async (input) => {
    const { output } = await generateFillBlankPrompt(input);
    if (!output) {
      throw new Error('Failed to generate question. The AI model did not return a valid output.');
    }
    return output;
  }
);
