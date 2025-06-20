
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null; // For profile picture
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string; // data URI for image query/response
  audio?: string; // data URI for audio query
  visualAid?: string; // data URI for AI generated visual aid
  timestamp: Date;
}

export interface StudyGuideEntry {
  id: string;
  question: string; // User's original question text
  content: string;   // The AI-generated study guide entry (combined)
  createdAt: Date;
}

export interface PracticeExercise {
  id: string;
  question: string;
  answer: string;
}

