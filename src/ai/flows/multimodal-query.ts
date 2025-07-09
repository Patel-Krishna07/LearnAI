// This is an AI-powered chatbot designed for students to answer their queries through text, voice, and images.
'use server';

/**
 * @fileOverview A multimodal AI assistant for answering student queries, with contextual memory and navigation capabilities.
 *
 * - multimodalQuery - A function that handles the multimodal query process.
 * - MultimodalQueryInput - The input type for the multimodalQuery function.
 * - MultimodalQueryOutput - The return type for the multimodalQuery function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateImageFromTextTool } from '@/ai/flows/generate-image-tool';

const ChatHistoryMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().describe('ISO 8601 timestamp of the message'),
});

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
  chatHistory: z
    .array(ChatHistoryMessageSchema)
    .optional()
    .describe('Recent messages from the conversation history to provide context. "User" is the student, "Assistant" is you (the AI).'),
});
export type MultimodalQueryInput = z.infer<typeof MultimodalQueryInputSchema>;

const MultimodalQueryOutputSchema = z.object({
  response: z.string().describe('The AI-generated response to the student query.'),
  visualAid: z
    .string()
    .optional()
    .nullable() 
    .describe('A data URI containing a visual aid, such as a chart, diagram, or a generated image. This should only be populated if explicitly requested by the user for a visual or if an image was generated.'),
  navigationTarget: z
    .string()
    .optional()
    .nullable()
    .describe('If the user\'s voice command is for navigation, this field will contain the path to navigate to (e.g., "/practice", "/study-guide", "/progress", "/"). Otherwise, it should be null or absent.'),
});
export type MultimodalQueryOutput = z.infer<typeof MultimodalQueryOutputSchema>;

export async function multimodalQuery(input: MultimodalQueryInput): Promise<MultimodalQueryOutput> {
  return multimodalQueryFlow(input);
}

const multimodalQueryPrompt = ai.definePrompt({
  name: 'multimodalQueryPrompt',
  input: {schema: MultimodalQueryInputSchema},
  output: {schema: MultimodalQueryOutputSchema},
  tools: [generateImageFromTextTool],
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an AI assistant designed to help students. You have several capabilities. Prioritize them in this order: Navigation, Web Search, Image Generation, then general Q&A.

**1. Navigation Task:**
If the user's query is a navigation command (e.g., "go to practice", "open study guide", "home page"), you MUST:
- Set the 'navigationTarget' field to the correct path: "/", "/chat", "/practice", "/quiz", "/study-guide", or "/progress".
- Set your 'response' field to a short confirmation, like "Okay, navigating to the practice page."
- Leave 'visualAid' null.

**2. Web Search Task:**
If the user asks for real-time information (e.g., "what's the weather in London?", "latest news", "who won the game last night?"), you MUST:
- Use your built-in search capabilities to get the most current information.
- Provide the answer in the 'response' field.
- Leave 'navigationTarget' and 'visualAid' null.

**3. Image Generation Task:**
If the user explicitly asks to "create", "draw", or "generate an image", you MUST use the 'generateImageFromTextTool'.
- If the tool returns 'imageDataUri', put it in the 'visualAid' field.
- Set your 'response' to a confirmation like "Here is the image you requested."
- If the tool returns an 'error', report it in the 'response' field.
- Leave 'navigationTarget' null.

**4. General Q&A / Other Queries:**
For all other queries:
- Provide a relevant and helpful text response in the 'response' field.
- Only create a 'visualAid' (like a chart or diagram) if the user explicitly asks for one. Do not use the image generation tool for this unless the request is to create a new artistic image.
- Leave 'navigationTarget' null.

**Context from Chat History:**
{{#if chatHistory}}
Use this history for context if the student's query refers to it:
{{#each chatHistory}}
{{role}} (at {{timestamp}}): {{{content}}}
{{/each}}
{{/if}}

**Student's Current Query:**
{{#if textQuery}}Text: {{{textQuery}}}{{/if}}
{{#if voiceDataUri}}Voice: {{media url=voiceDataUri}}{{/if}}
{{#if imageDataUri}}Image: {{media url=imageDataUri}}{{/if}}

Please provide a response that strictly follows the MultimodalQueryOutputSchema.
`,
});

const multimodalQueryFlow = ai.defineFlow(
  {
    name: 'multimodalQueryFlow',
    inputSchema: MultimodalQueryInputSchema,
    outputSchema: MultimodalQueryOutputSchema,
  },
  async input => {
    const maxRetries = 3;
    const delayMs = 1000;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const {output} = await multimodalQueryPrompt(input);
        return output!;
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
