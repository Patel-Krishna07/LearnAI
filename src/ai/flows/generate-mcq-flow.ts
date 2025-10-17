'use server';

/**
 * @fileOverview A Genkit flow for generating multiple-choice questions.
 *
 * - generateMcqs - A function that generates multiple MCQs on a given topic.
 * - GenerateMcqInput - The input type for the generateMcqs function.
 * - GenerateMcqOutput - The return type for the generateMcqs function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMcqInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the multiple-choice questions.'),
  numQuestions: z.number().describe('The number of questions to generate.'),
});
export type GenerateMcqInput = z.infer<typeof GenerateMcqInputSchema>;

const McqQuestionSchema = z.object({
  question: z.string().describe('The multiple-choice question.'),
  options: z.array(z.string()).min(4).max(4).describe('An array of exactly 4 possible answers.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The index (0-3) of the correct answer in the options array.'),
});
export type McqQuestion = z.infer<typeof McqQuestionSchema>;

const GenerateMcqOutputSchema = z.object({
  questions: z.array(McqQuestionSchema).describe('An array of generated multiple-choice questions.'),
});
export type GenerateMcqOutput = z.infer<typeof GenerateMcqOutputSchema>;

export async function generateMcqs(input: GenerateMcqInput): Promise<GenerateMcqOutput> {
  return generateMcqFlow(input);
}

const generateMcqPrompt = ai.definePrompt({
  name: 'generateMcqPrompt',
  input: { schema: GenerateMcqInputSchema },
  output: { schema: GenerateMcqOutputSchema },
  model: 'googleai/gemini-pro',
  prompt: `You are an expert educator. Your task is to generate {{numQuestions}} distinct, clear multiple-choice questions with exactly 4 options each for the given topic: {{{topic}}}.

  For each question:
  - Ensure the question is relevant to the topic.
  - Provide four distinct options.
  - One option must be correct, and the others should be plausible distractors.
  - Identify the index (0-3) of the correct answer.

  Return the result as a JSON object containing an array of question objects.`,
});

const generateMcqFlow = ai.defineFlow(
  {
    name: 'generateMcqFlow',
    inputSchema: GenerateMcqInputSchema,
    outputSchema: GenerateMcqOutputSchema,
  },
  async (input) => {
    const maxRetries = 3;
    const delayMs = 1000;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const { output } = await generateMcqPrompt(input);
        if (!output || !output.questions || output.questions.length === 0) {
          throw new Error('Failed to generate MCQs. The AI model did not return a valid output.');
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
