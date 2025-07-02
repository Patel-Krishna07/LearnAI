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

// Schemas for different question types
const McqQuestionSchema = z.object({
  type: z.literal('MCQ'),
  question: z.string().describe('The multiple-choice question.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers.'),
  correctAnswerIndex: z.number().min(0).max(3).describe('The index (0-3) of the correct answer in the options array.'),
});

const TrueFalseQuestionSchema = z.object({
    type: z.literal('TRUE_FALSE'),
    statement: z.string().describe('The true or false statement.'),
    isTrue: z.boolean().describe('Whether the statement is true or false.'),
});

const FillBlankQuestionSchema = z.object({
    type: z.literal('FILL_BLANK'),
    question: z.string().describe('A sentence with "[BLANK]" as a placeholder for the answer.'),
    answer: z.string().describe('The word or short phrase that fills the blank.'),
});

// A union of all possible question types
const QuizQuestionSchema = z.union([
    McqQuestionSchema,
    TrueFalseQuestionSchema,
    FillBlankQuestionSchema,
]);

export type McqQuestion = z.infer<typeof McqQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof TrueFalseQuestionSchema>;
export type FillBlankQuestion = z.infer<typeof FillBlankQuestionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;


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

  The quiz should contain a mix of different question types: Multiple Choice (MCQ), True/False, and Fill-in-the-Blank.
  For each question, set the 'type' field appropriately ('MCQ', 'TRUE_FALSE', or 'FILL_BLANK').

  For MCQ questions, provide a question, 4 options, and the index of the correct answer.
  For True/False questions, provide a statement and whether it is true.
  For Fill-in-the-Blank questions, provide a sentence with "[BLANK]" as a placeholder and the correct answer.

  Return the result as a JSON object containing an array of question objects.`,
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
