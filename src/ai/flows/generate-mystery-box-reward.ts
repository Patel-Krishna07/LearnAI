'use server';

/**
 * @fileOverview Generates dynamic rewards for the Mystery Box feature.
 * - generateMysteryBoxReward - Generates a reward based on a tier.
 * - GenerateMysteryBoxRewardInput - Input for the generation function.
 * - GenerateMysteryBoxRewardOutput - Output from the generation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const GenerateMysteryBoxRewardInputSchema = z.object({
  tier: z.enum(['Common', 'Legendary']).describe('The tier of the mystery box to generate a reward for.'),
});
export type GenerateMysteryBoxRewardInput = z.infer<typeof GenerateMysteryBoxRewardInputSchema>;

export const GenerateMysteryBoxRewardOutputSchema = z.object({
  reward: z.string().describe('The generated reward text, e.g., a fun fact, a hint, or a title.'),
  message: z.string().describe('A short, fun, and motivating message for the student.'),
});
export type GenerateMysteryBoxRewardOutput = z.infer<typeof GenerateMysteryBoxRewardOutputSchema>;

export async function generateMysteryBoxReward(input: GenerateMysteryBoxRewardInput): Promise<GenerateMysteryBoxRewardOutput> {
  return generateMysteryBoxRewardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMysteryBoxRewardPrompt',
  input: { schema: GenerateMysteryBoxRewardInputSchema },
  output: { schema: GenerateMysteryBoxRewardOutputSchema },
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are a fun and motivating reward generator for an educational app. Your task is to generate a reward and a short, encouraging message for a student who just opened a Mystery Box.

The reward depends on the tier:
- If the tier is "Common", the reward should be a short, interesting "fun fact" OR a "small hint token" that could help with a tough question.
- If the tier is "Legendary", the reward should be a cool-sounding, exclusive title or badge name that a student can show off. For example: "Cosmic Thinker", "Quantum Leaper", "Cerebral Champion", "Master of Logic", "Professor of Possibilities".

The message should always be positive and encouraging.

Tier: {{{tier}}}
`,
});

const generateMysteryBoxRewardFlow = ai.defineFlow(
  {
    name: 'generateMysteryBoxRewardFlow',
    inputSchema: GenerateMysteryBoxRewardInputSchema,
    outputSchema: GenerateMysteryBoxRewardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
