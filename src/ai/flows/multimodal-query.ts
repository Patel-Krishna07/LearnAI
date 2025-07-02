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
  model: 'googleai/gemini-1.5-flash-latest',
  prompt: `You are an AI assistant designed to help students with their queries and app navigation via voice.
You can receive queries in text, voice, or image format.

{{#if chatHistory}}
Here is some recent context from your ongoing conversation with the student (timestamps are in ISO 8601 format). "User" is the student, "Assistant" is you:
{{#each chatHistory}}
{{role}} (at {{timestamp}}): {{{content}}}
{{/each}}

Use this history if the student's current query refers to previous parts of the discussion (e.g., "what did you say about X?", "explain that again", "what we discussed yesterday").
{{/if}}

**Navigation Task (primarily for voice input but can apply to text):**
If the user's query appears to be a navigation command (e.g., "go to practice", "open study guide", "show my progress", "take me to the chat page", "home page"), you MUST:
1. Identify the target page. Supported pages and their paths are:
    - "home" or "main page": "/"
    - "chat": "/chat"
    - "practice" or "exercises": "/practice"
    - "study guide": "/study-guide"
    - "progress" or "leaderboard": "/progress"
2. Set the 'navigationTarget' field in your output to the corresponding path (e.g., "/practice").
3. Set your 'response' field to a short confirmation, like "Okay, navigating to the practice page." or "Sure, opening your study guide."
4. The 'visualAid' field should be null or absent for navigation commands.

**Image Generation Task:**
If the user's query is a request to generate a new image (e.g., "draw a cat", "generate an image of a sunset", "create a picture of a futuristic city") AND it is NOT a navigation command, you MUST use the 'generateImageFromTextTool'.
- The 'generateImageFromTextTool' will return an object.
- If this object contains an 'imageDataUri' field with a string value (e.g., "data:image/..."), you MUST:
    1. Place this string value into the 'visualAid' field of your output.
    2. Set your 'response' field to a short confirmation, like "Certainly, here is the image of [subject]:" or "I've generated the image you asked for."
    3. Ensure 'navigationTarget' is null or absent.
- If the tool's output object contains an 'error' field with a message, you MUST:
    1. Set your 'response' field to convey that error message (e.g., "Sorry, I couldn't generate the image: [error message from tool]").
    2. Ensure the 'visualAid' and 'navigationTarget' fields in your output are null or not present.
- Do NOT put the tool's entire output object (or any other complex object) into any field of your response. Only use the specific string values as instructed.

**Other Queries (Q&A, Explanations, etc.):**
For all other types of queries that are NOT navigation or explicit image generation requests:
- Provide a relevant and informative text response in the 'response' field.
- Ensure 'navigationTarget' is null or absent.
- Only generate a supporting visual aid (e.g., a chart or diagram, NOT a newly generated artistic image unless it's part of answering the query) and populate the 'visualAid' output field if the student explicitly asks for "visual aid", "chart", "diagram", "graph", or "picture" in their text query in the context of an explanation. Do NOT use the generateImageFromTextTool for these supporting visuals unless the request is specifically to create a new artistic image.

If the user submits a picture, try to understand what the user wants to know about that picture, and formulate your response accordingly.

Here's the student's current query:
{{#if textQuery}}
Text: {{{textQuery}}}
{{/if}}
{{#if voiceDataUri}}
Voice: {{media url=voiceDataUri}}
{{/if}}
{{#if imageDataUri}}
Image: {{media url=imageDataUri}}
{{/if}}

Response format: Respond in a way that is helpful to students. Ensure your output strictly follows the MultimodalQueryOutputSchema. Prioritize navigation detection. If it's a navigation command, fill 'navigationTarget' and a confirmation 'response'. If it's an image generation request, use the tool and fill 'visualAid' and 'response'. For other queries, fill 'response' and 'visualAid' if appropriate, keeping 'navigationTarget' null.
`,
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
