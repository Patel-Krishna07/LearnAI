'use server';

/**
 * @fileOverview A Genkit flow for generating multiple true/false statements.
 *
 * - generateTrueFalses - A function that generates multiple true/false statements on a given topic.
 * - GenerateTrueFalseInput - The input type for the generateTrueFalses function.
 * - GenerateTrueFalseOutput - The return type for the generateTrueFalses function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTrueFalseInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the true/false statements.'),
  numQuestions: z.number().describe('The number of statements to generate.'),
});
export type GenerateTrueFalseInput = z.infer<typeof GenerateTrueFalseInputSchema>;

const TrueFalseQuestionSchema = z.object({
  statement: z.string().describe('The true or false statement.'),
  isTrue: z.boolean().describe('Whether the statement is true or false.'),
});
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;

const GenerateTrueFalseOutputSchema = z.object({
    questions: z.array(TrueFalseQuestionSchema).describe('An array of generated true/false statements.')
});
export type GenerateTrueFalseOutput = z.infer<typeof GenerateTrueFalseOutputSchema>;

export async function generateTrueFalses(input: GenerateTrueFalseInput): Promise<GenerateTrueFalseOutput> {
  return generateTrueFalseFlow(input);
}

const generateTrueFalsePrompt = ai.definePrompt({
  name: 'generateTrueFalsePrompt',
  input: { schema: GenerateTrueFalseInputSchema },
  output: { schema: GenerateTrueFalseOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert educator. Your task is to generate {{numQuestions}} distinct, clear true or false statements for the given topic: {{{topic}}}.

  Each statement should be a definitive fact that is either true or false. Avoid ambiguity.
  Return the result as a JSON object containing an array of statement objects.`,
});

const generateTrueFalseFlow = ai.defineFlow(
  {
    name: 'generateTrueFalseFlow',
    inputSchema: GenerateTrueFalseInputSchema,
    outputSchema: GenerateTrueFalseOutputSchema,
  },
  async (input) => {
    const { output } = await generateTrueFalsePrompt(input);
    if (!output || !output.questions || output.questions.length === 0) {
      throw new Error('Failed to generate statements. The AI model did not return a valid output.');
    }
    return output;
  }
);
