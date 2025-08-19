export interface MCQ {
  batchId: string;
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  tags: {
    bookmarked: boolean;
    hard: boolean;
    revise: boolean;
    mistaked: boolean;
    highYield: boolean;
    caseBased: boolean;
    pyq: boolean; // Past Year Question
  };
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Assertion-Reason' | 'Case' | 'Image-based';
  imageURL?: string;
  notes?: string;
  lastAttemptCorrect: boolean | null; // null: unattempted, true: correct, false: incorrect
  srsLevel: number;
  nextReviewDate: string; // ISO string
}

export interface ParsedMCQ {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Batch {
  id: string;
  name: string;
  subject: string;
  chapter: string;
  platform: string;
  createdAt: string; // ISO string
  questions: MCQ[];
}

export interface StudySessionResult {
  id:string;
  createdAt: string; // ISO string
  score: number; // percentage
  accuracy: string; // "17/20"
  config: {
    subjects: string[];
    chapters: string[];
    platforms: string[];
    statuses: string[];
    questionCount: number;
  };
}

// For passing questions to the study session component
export interface StudyQuestion extends MCQ {
  batchId: string;
  subject: string;
  chapter: string;
}

// For passing questions to the exam session component
export interface ExamQuestion extends MCQ {
  batchId: string;
  subject: string;
  chapter: string;
  platform: string;
}

export interface ExamSession {
  id: string;
  createdAt:string;
  timeTaken: number; // in seconds
  config: {
    questionCount: number;
    durationMinutes: number;
    subjects: string[];
    platforms: string[];
    statuses: string[];
  };
  questions: Array<{
    questionData: ExamQuestion; // Full question data for review
    userAnswer: string | null;
    isCorrect: boolean;
  }>;
  score: number;
  accuracy: string;
  correctAnswers: number;
  totalQuestions: number;
}

export type Activity =
  | { type: 'batch'; id: string; name: string; questionCount: number; createdAt: string; }
  | { type: 'study'; id: string; score: number; subjects: string[]; createdAt: string; }
  | { type: 'exam'; id: string; score: number; subjects: string[]; createdAt: string; };

export interface AppData {
  batches: Batch[];
  studyHistory: StudySessionResult[];
  examHistory: ExamSession[];
}

export interface UserGoal {
  type: 'weeklyQuestions';
  target: number;
}

export type Tag = 'bookmarked' | 'hard' | 'revise' | 'mistaked' | 'highYield' | 'caseBased' | 'pyq';