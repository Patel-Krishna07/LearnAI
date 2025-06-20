import { config } from 'dotenv';
config();

import '@/ai/flows/flag-incomplete-response.ts';
import '@/ai/flows/generate-practice-exercises.ts';
import '@/ai/flows/ai-study-guide.ts';
import '@/ai/flows/multimodal-query.ts';
import '@/ai/flows/generate-image-tool.ts';
