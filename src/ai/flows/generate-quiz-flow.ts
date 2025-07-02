'use server';

/**
 * @fileOverview A Genkit flow for generating a mixed-type quiz on a given topic.
 *
 * - generateQuiz - A function that generates a quiz with various question types.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// A single, unified schema for all question types.
// This is simpler for the AI model to process than a complex union type.
const QuizQuestionSchema = z.object({
  type: z.string().describe("The type of question. Must be one of: 'MCQ', 'TRUE_FALSE', or 'FILL_BLANK'."),
  
  // Fields for all types are included, but most are optional.
  // The prompt will instruct the AI to only fill the relevant fields for the chosen type.
  question: z.string().optional().describe('The question text. Used for MCQ and Fill-in-the-Blank types.'),
  options: z.array(z.string()).optional().describe('An array of 4 possible answers. Used only for MCQ type.'),
  correctAnswerIndex: z.number().optional().describe('The index (0-3) of the correct answer in the options array. Used only for MCQ type.'),

  statement: z.string().optional().describe('The statement to be evaluated. Used only for TRUE_FALSE type.'),
  isTrue: z.boolean().optional().describe('Whether the statement is true or false. Used only for TRUE_FALSE type.'),

  answer: z.string().optional().describe('The word or short phrase that fills the blank. Used only for FILL_BLANK type.'),
});


// Export types for the frontend components.
// These are based on the unified schema but add back the required fields for type safety in the components.
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type McqQuestion = QuizQuestion & { type: 'MCQ'; question: string; options: string[]; correctAnswerIndex: number; };
export type TrueFalseQuestion = QuizQuestion & { type: 'TRUE_FALSE'; statement: string; isTrue: boolean; };
export type FillBlankQuestion = QuizQuestion & { type: 'FILL_BLANK'; question: string; answer: string; };


const GenerateQuizInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate the quiz.'),
  numQuestions: z.number().min(3).max(10).default(5).describe('The total number of questions to generate.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of quiz questions of mixed types.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  model: 'googleai/gemini-1.0-pro',
  prompt: `You are an expert educator. Your task is to generate a quiz with {{numQuestions}} questions on the given topic: {{{topic}}}.

  The quiz must contain a mix of different question types: Multiple Choice (MCQ), True/False, and Fill-in-the-Blank.
  For each question object in the 'questions' array, you must follow these rules VERY carefully:

  1.  Set the 'type' field to one of the following exact strings: 'MCQ', 'TRUE_FALSE', or 'FILL_BLANK'.
  2.  Based on the 'type' you choose, you MUST ONLY fill the fields relevant to that type. Leave all other optional fields empty.

  - If type is 'MCQ':
    - Fill 'question' with the question text.
    - Fill 'options' with an array of exactly 4 strings.
    - Fill 'correctAnswerIndex' with the number (0-3) of the correct option.
    - DO NOT fill 'statement', 'isTrue', or 'answer'.

  - If type is 'TRUE_FALSE':
    - Fill 'statement' with the true/false statement.
    - Fill 'isTrue' with either true or false.
    - DO NOT fill 'question', 'options', 'correctAnswerIndex', or 'answer'.

  - If type is 'FILL_BLANK':
    - Fill 'question' with a sentence containing the exact placeholder "[BLANK]".
    - Fill 'answer' with the word or phrase that correctly fills the blank.
    - DO NOT fill 'options', 'correctAnswerIndex', 'statement', or 'isTrue'.

  Return the result as a JSON object containing an array of question objects that strictly follows this schema and these rules.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizPrompt(input);
    if (!output || !output.questions || output.questions.length === 0) {
      throw new Error('Failed to generate quiz. The AI model did not return a valid output.');
    }
    return output;
  }
);
