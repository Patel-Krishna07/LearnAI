'use server';

/**
 * @fileOverview A Genkit flow for generating matching pairs for a quiz.
 *
 * - generateMatchingPairs - A function that generates matching pairs on a given topic.
 * - GenerateMatchingPairsInput - The input type for the generateMatchingPairs function.
 * - GenerateMatchingPairsOutput - The return type for the generateMatchingPairs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateMatchingPairsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the matching pairs.'),
  numPairs: z.number().describe('The number of pairs to generate.'),
});
export type GenerateMatchingPairsInput = z.infer<typeof GenerateMatchingPairsInputSchema>;

const PairSchema = z.object({
  term: z.string().describe('A term or a short phrase.'),
  definition: z.string().describe('The corresponding definition or description.'),
});

const GenerateMatchingPairsOutputSchema = z.object({
  pairs: z.array(PairSchema).describe('An array of term-definition pairs.'),
});
export type GenerateMatchingPairsOutput = z.infer<typeof GenerateMatchingPairsOutputSchema>;

export async function generateMatchingPairs(input: GenerateMatchingPairsInput): Promise<GenerateMatchingPairsOutput> {
  return generateMatchingPairsFlow(input);
}

const generateMatchingPairsPrompt = ai.definePrompt({
  name: 'generateMatchingPairsPrompt',
  input: { schema: GenerateMatchingPairsInputSchema },
  output: { schema: GenerateMatchingPairsOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert educator. Your task is to generate {{numPairs}} distinct matching pairs (term and definition) for the given topic: {{{topic}}}.

  The terms should be specific and the definitions should be clear and concise.
  Return the result in the specified JSON format.`,
});

const generateMatchingPairsFlow = ai.defineFlow(
  {
    name: 'generateMatchingPairsFlow',
    inputSchema: GenerateMatchingPairsInputSchema,
    outputSchema: GenerateMatchingPairsOutputSchema,
  },
  async (input) => {
    const { output } = await generateMatchingPairsPrompt(input);
    if (!output || !output.pairs || output.pairs.length === 0) {
      throw new Error('Failed to generate matching pairs. The AI model did not return a valid output.');
    }
    return output;
  }
);
