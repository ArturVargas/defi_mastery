
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface QuizCategory {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  secretWord: string;
}

export type QuizStatus = 'idle' | 'in-progress' | 'completed';

export interface QuizState {
  currentCategoryId: string | null;
  status: QuizStatus;
  userAnswers: Record<string, number>;
  score: number;
}
