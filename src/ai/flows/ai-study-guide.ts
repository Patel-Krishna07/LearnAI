'use server';

/**
 * @fileOverview An AI agent to create study guides from user questions and AI summaries.
 *
 * - createStudyGuideEntry - A function that handles the creation of a study guide entry.
 * - CreateStudyGuideEntryInput - The input type for the createStudyGuideEntry function.
 * - CreateStudyGuideEntryOutput - The return type for the createStudyGuideEntry function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateStudyGuideEntryInputSchema = z.object({
  question: z
    .string()
    .describe('The student question to be added to the study guide.'),
  aiSummary: z
    .string()
    .describe('The AI summary of the question to be added to the study guide.'),
});
export type CreateStudyGuideEntryInput = z.infer<
  typeof CreateStudyGuideEntryInputSchema
>;

const CreateStudyGuideEntryOutputSchema = z.object({
  studyGuideEntry: z
    .string()
    .describe('A string combining the question and AI summary for the study guide.'),
});
export type CreateStudyGuideEntryOutput = z.infer<
  typeof CreateStudyGuideEntryOutputSchema
>;

export async function createStudyGuideEntry(
  input: CreateStudyGuideEntryInput
): Promise<CreateStudyGuideEntryOutput> {
  return createStudyGuideEntryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createStudyGuideEntryPrompt',
  input: {schema: CreateStudyGuideEntryInputSchema},
  output: {schema: CreateStudyGuideEntryOutputSchema},
  model: 'googleai/gemini-pro',
  prompt: `Create a study guide entry combining the question and its AI summary.\n\nQuestion: {{{question}}}\nAI Summary: {{{aiSummary}}}\n\nStudy Guide Entry:`,
});

const createStudyGuideEntryFlow = ai.defineFlow(
  {
    name: 'createStudyGuideEntryFlow',
    inputSchema: CreateStudyGuideEntryInputSchema,
    outputSchema: CreateStudyGuideEntryOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    const delayMs = 1000;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const {output} = await prompt(input);
        return {
          studyGuideEntry: output?.studyGuideEntry ?? 'Error: No study guide entry generated.',
        };
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
