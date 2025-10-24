// Defining the data structures for the application.
export interface Flashcard {
  question: string;
  answer: string;
}

export interface FileData {
  content: string; // Base64 for images, raw text for others
  mimeType: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  flashcards: Flashcard[];
  createdAt: string;
}

export interface User {
  email: string;
  passwordHash: string; // In a real app, never store plain text passwords
  sets: FlashcardSet[];
}

export type View = 'auth' | 'upload' | 'flashcards' | 'mySets';
export type AuthMode = 'signin' | 'signup' | 'forgot';
export type StudyMode = 'study' | 'test' | 'match';

export interface AppState {
  view: View;
  theme: 'light' | 'dark';
  users: User[];
  currentUser: User | null;
  activeFlashcards: Flashcard[];
  editingSet: FlashcardSet | null; // To know which set we are studying/editing
}
