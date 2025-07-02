'use server';

/**
 * @fileOverview A Genkit flow for generating a single true/false statement.
 *
 * - generateTrueFalse - A function that generates a single true/false statement on a given topic.
 * - GenerateTrueFalseInput - The input type for the generateTrueFalse function.
 * - GenerateTrueFalseOutput - The return type for the generateTrueFalse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateTrueFalseInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the true/false statement.'),
});
export type GenerateTrueFalseInput = z.infer<typeof GenerateTrueFalseInputSchema>;

export const GenerateTrueFalseOutputSchema = z.object({
  statement: z.string().describe('The true or false statement.'),
  isTrue: z.boolean().describe('Whether the statement is true or false.'),
});
export type GenerateTrueFalseOutput = z.infer<typeof GenerateTrueFalseOutputSchema>;

export async function generateTrueFalse(input: GenerateTrueFalseInput): Promise<GenerateTrueFalseOutput> {
  return generateTrueFalseFlow(input);
}

const generateTrueFalsePrompt = ai.definePrompt({
  name: 'generateTrueFalsePrompt',
  input: { schema: GenerateTrueFalseInputSchema },
  output: { schema: GenerateTrueFalseOutputSchema },
  prompt: `You are an expert educator. Your task is to generate a single, clear true or false statement for the given topic: {{{topic}}}.

  The statement should be a definitive fact that is either true or false. Avoid ambiguity.
  Return the result in the specified JSON format.`,
});

const generateTrueFalseFlow = ai.defineFlow(
  {
    name: 'generateTrueFalseFlow',
    inputSchema: GenerateTrueFalseInputSchema,
    outputSchema: GenerateTrueFalseOutputSchema,
  },
  async (input) => {
    const { output } = await generateTrueFalsePrompt(input);
    if (!output) {
      throw new Error('Failed to generate statement. The AI model did not return a valid output.');
    }
    return output;
  }
);
