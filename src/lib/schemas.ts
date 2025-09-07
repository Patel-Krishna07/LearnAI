import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'], // path of error
});
export type RegisterFormData = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
});
export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export const FlagResponseSchema = z.object({
  reason: z.string().min(10, { message: 'Please provide a reason with at least 10 characters.'}),
});
export type FlagResponseFormData = z.infer<typeof FlagResponseSchema>;

export const PracticeTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(1).max(10).default(5),
});
export type PracticeTopicFormData = z.infer<typeof PracticeTopicSchema>;

export const QuizTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }),
  numQuestions: z.coerce.number().min(3, "Must generate at least 3 questions.").max(10, "Cannot generate more than 10 questions.").default(3),
});
export type QuizTopicFormData = z.infer<typeof QuizTopicSchema>;

export const MatchingTopicSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }),
  numPairs: z.coerce.number().min(3, 'Must have at least 3 pairs.').max(6, 'Cannot have more than 6 pairs.').default(4),
});
export type MatchingTopicFormData = z.infer<typeof MatchingTopicSchema>;

export const GenerateMysteryBoxRewardInputSchema = z.object({
  tier: z.enum(['Common', 'Legendary']).describe('The tier of the mystery box to generate a reward for.'),
});
export type GenerateMysteryBoxRewardInput = z.infer<typeof GenerateMysteryBoxRewardInputSchema>;

export const GenerateMysteryBoxRewardOutputSchema = z.object({
  reward: z.string().describe('The generated reward text, e.g., a fun fact, a hint, or a title.'),
  message: z.string().describe('A short, fun, and motivating message for the student.'),
});
export type GenerateMysteryBoxRewardOutput = z.infer<typeof GenerateMysteryBoxRewardOutputSchema>;
