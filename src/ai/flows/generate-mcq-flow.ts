'use server';

/**
 * @fileOverview A Genkit flow for generating a single multiple-choice question.
 *
 * - generateMcq - A function that generates a single MCQ on a given topic.
 * - GenerateMcqInput - The input type for the generateMcq function.
 * - GenerateMcqOutput - The return type for the generateMcq function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMcqInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the multiple-choice question.'),
});
export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;

const GenerateMcqOutputSchema = z.object({
  question: z.string().describe('The multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The index (0-3) of the correct answer in the options array.'),
});
export type GenerateMcqOutput = z.infer<typeof GenerateMcqOutputSchema>;

export async function generateMcq(input: GenerateMcqInput): Promise<GenerateMcqOutput> {
  return generateMcqFlow(input);
}

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: { schema: GenerateMcqInputSchema },
  output: { schema: GenerateMcqOutputSchema },
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an expert educator. Your task is to generate a single, clear multiple-choice question with exactly 4 options for the given topic: {{{topic}}}.

  Ensure the question is relevant to the topic.
  Provide four distinct options.
  One option must be correct, and the others should be plausible distractors.
  Identify the index (0-3) of the correct answer.

  Return the result in the specified JSON format.`,
});

const generateMcqFlow = ai.defineFlow(
  {
    name: 'generateMcqFlow',
    inputSchema: GenerateMcqInputSchema,
    outputSchema: GenerateMcqOutputSchema,
  },
  async (input) => {
    const { output } = await generateMcqPrompt(input);
    if (!output) {
      throw new Error('Failed to generate MCQ. The AI model did not return a valid output.');
    }
    return output;
  }
);
