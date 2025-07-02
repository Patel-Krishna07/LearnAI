'use server';

/**
 * @fileOverview A Genkit flow for generating a timed question.
 *
 * - generateTimedQuestion - A function that generates a question for a timed challenge.
 * - GenerateTimedQuestionInput - The input type for the generateTimedQuestion function.
 * - GenerateTimedQuestionOutput - The return type for the generateTimedQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTimedQuestionInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the question.'),
});
export type GenerateTimedQuestionInput = z.infer<typeof GenerateTimedQuestionInputSchema>;

const GenerateTimedQuestionOutputSchema = z.object({
  question: z.string().describe('A straightforward question with a concise answer.'),
  answer: z.string().describe('The correct answer to the question.'),
});
export type GenerateTimedQuestionOutput = z.infer<typeof GenerateTimedQuestionOutputSchema>;

export async function generateTimedQuestion(input: GenerateTimedQuestionInput): Promise<GenerateTimedQuestionOutput> {
  return generateTimedQuestionFlow(input);
}

const generateTimedQuestionPrompt = ai.definePrompt({
  name: 'generateTimedQuestionPrompt',
  input: { schema: GenerateTimedQuestionInputSchema },
  output: { schema: GenerateTimedQuestionOutputSchema },
  model: 'googleai/gemini-pro',
  prompt: `You are an expert educator. Your task is to generate a single, straightforward question suitable for a timed challenge on the topic: {{{topic}}}.

  The question should be answerable quickly with a word or number. Avoid long or complex answers.
  Return the result in the specified JSON format.`,
});

const generateTimedQuestionFlow = ai.defineFlow(
  {
    name: 'generateTimedQuestionFlow',
    inputSchema: GenerateTimedQuestionInputSchema,
    outputSchema: GenerateTimedQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await generateTimedQuestionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate question. The AI model did not return a valid output.');
    }
    return output;
  }
);
