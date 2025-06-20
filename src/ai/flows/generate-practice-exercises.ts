'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating practice exercises on a given topic.
 *
 * - generatePracticeExercises - A function that generates practice questions and answers on a given topic.
 * - GeneratePracticeExercisesInput - The input type for the generatePracticeExercises function.
 * - GeneratePracticeExercisesOutput - The return type for the generatePracticeExercises function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePracticeExercisesInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate practice exercises.'),
  numQuestions: z.number().default(5).describe('The number of practice questions to generate.'),
});
export type GeneratePracticeExercisesInput = z.infer<
  typeof GeneratePracticeExercisesInputSchema
>;

const GeneratePracticeExercisesOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('An array of practice questions generated for the given topic.'),
  answers: z
    .array(z.string())
    .describe('An array of answers corresponding to the generated questions.'),
});
export type GeneratePracticeExercisesOutput = z.infer<
  typeof GeneratePracticeExercisesOutputSchema
>;

export async function generatePracticeExercises(
  input: GeneratePracticeExercisesInput
): Promise<GeneratePracticeExercisesOutput> {
  return generatePracticeExercisesFlow(input);
}

const generatePracticeExercisesPrompt = ai.definePrompt({
  name: 'generatePracticeExercisesPrompt',
  input: {schema: GeneratePracticeExercisesInputSchema},
  output: {schema: GeneratePracticeExercisesOutputSchema},
  prompt: `You are an expert educator. Your task is to generate {{numQuestions}} practice questions and their corresponding answers for the topic: {{{topic}}}. Return the questions and answers as arrays.`,
});

const generatePracticeExercisesFlow = ai.defineFlow(
  {
    name: 'generatePracticeExercisesFlow',
    inputSchema: GeneratePracticeExercisesInputSchema,
    outputSchema: GeneratePracticeExercisesOutputSchema,
  },
  async input => {
    const {output} = await generatePracticeExercisesPrompt(input);
    return output!;
  }
);
