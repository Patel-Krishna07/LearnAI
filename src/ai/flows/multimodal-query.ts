// This is an AI-powered chatbot designed for students to answer their queries through text, voice, and images.
'use server';

/**
 * @fileOverview A multimodal AI assistant for answering student queries.
 *
 * - multimodalQuery - A function that handles the multimodal query process.
 * - MultimodalQueryInput - The input type for the multimodalQuery function.
 * - MultimodalQueryOutput - The return type for the multimodalQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MultimodalQueryInputSchema = z.object({
  textQuery: z.string().optional().describe('The text-based query from the student.'),
  voiceDataUri: z
    .string()
    .optional()
    .describe(
      "The voice query from the student, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "The image query from the student, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type MultimodalQueryInput = z.infer<typeof MultimodalQueryInputSchema>;

const MultimodalQueryOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the student query.'),
  visualAid: z
    .string()
    .optional()
    .describe('A data URI containing a visual aid, such as a chart or diagram.'),
});
export type MultimodalQueryOutput = z.infer<typeof MultimodalQueryOutputSchema>;

export async function multimodalQuery(input: MultimodalQueryInput): Promise<MultimodalQueryOutput> {
  return multimodalQueryFlow(input);
}

const multimodalQueryPrompt = ai.definePrompt({
  name: 'multimodalQueryPrompt',
  input: {schema: MultimodalQueryInputSchema},
  output: {schema: MultimodalQueryOutputSchema},
  prompt: `You are an AI assistant designed to help students with their queries.

You can receive queries in text, voice, or image format.

Based on the input, provide a relevant and informative response. If the user asks for a chart, diagram, or other visual aid, then generate one. If the user submits a picture, try to understand what the user wants to know about that picture, and formulate your response accordingly.

Here's the student's query:

{{#if textQuery}}
Text: {{{textQuery}}}
{{/if}}

{{#if voiceDataUri}}
Voice: {{media url=voiceDataUri}}
{{/if}}

{{#if imageDataUri}}
Image: {{media url=imageDataUri}}
{{/if}}

Response format: Respond in a way that is helpful to students. Generate a visual aid if appropriate, and include it in the visualAid output field.`,
});

const multimodalQueryFlow = ai.defineFlow(
  {
    name: 'multimodalQueryFlow',
    inputSchema: MultimodalQueryInputSchema,
    outputSchema: MultimodalQueryOutputSchema,
  },
  async input => {
    const {output} = await multimodalQueryPrompt(input);
    return output!;
  }
);
