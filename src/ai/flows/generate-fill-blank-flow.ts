'use server';

/**
 * @fileOverview A Genkit flow for generating fill-in-the-blank questions.
 *
 * - generateFillBlanks - A function that generates multiple fill-in-the-blank questions on a given topic.
 * - GenerateFillBlankInput - The input type for the generateFillBlanks function.
 * - GenerateFillBlankOutput - The return type for the generateFillBlanks function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFillBlankInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the questions.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
});
export type GenerateFillBlankInput = z.infer<typeof GenerateFillBlankInputSchema>;

const FillBlankQuestionSchema = z.object({
  question: z.string().describe('A sentence with "[BLANK]" as a placeholder for the answer.'),
  answer: z.string().describe('The word or short phrase that fills the blank.'),
});
export type FillBlankQuestion = z.infer<typeof FillBlankQuestionSchema>;

const GenerateFillBlankOutputSchema = z.object({
  questions: z.array(FillBlankQuestionSchema).describe('An array of generated fill-in-the-blank questions.'),
});
export type GenerateFillBlankOutput = z.infer<typeof GenerateFillBlankOutputSchema>;

export async function generateFillBlanks(input: GenerateFillBlankInput): Promise<GenerateFillBlankOutput> {
  return generateFillBlankFlow(input);
}

const generateFillBlankPrompt = ai.definePrompt({
  name: 'generateFillBlankPrompt',
  input: { schema: GenerateFillBlankInputSchema },
  output: { schema: GenerateFillBlankOutputSchema },
  model: 'googleai/gemini-pro',
  prompt: `You are an expert educator. Your task is to generate {{numQuestions}} distinct fill-in-the-blank questions for the given topic: {{{topic}}}.

  For each question, create a sentence that has a clear, single-word or short-phrase answer.
  Use the exact placeholder "[BLANK]" to represent where the user should fill in their answer.
  Return the result as a JSON object containing an array of question objects.`,
});

const generateFillBlankFlow = ai.defineFlow(
  {
    name: 'generateFillBlankFlow',
    inputSchema: GenerateFillBlankInputSchema,
    outputSchema: GenerateFillBlankOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    const delayMs = 1000;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { output } = await generateFillBlankPrompt(input);
        if (!output || !output.questions || output.questions.length === 0) {
          throw new Error('Failed to generate questions. The AI model did not return a valid output.');
        }
        return output;
      } catch (e: any) {
        lastError = e;
        if (attempt < maxRetries && (e.message?.includes('503') || e.message?.includes('overloaded'))) {
          console.log(`Attempt ${attempt} failed due to service overload. Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // This is the last attempt or a non-retryable error
          throw e;
        }
      }
    }
    // Fallback throw, should not be reached due to logic inside catch
    throw lastError;
  }
);
