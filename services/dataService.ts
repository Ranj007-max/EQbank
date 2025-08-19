import localforage from 'localforage';
import { AppData, Batch, ExamSession, MCQ, StudySessionResult, UserGoal, Activity, StudyQuestion, UserMetrics } from '../types';

// --- Configuration for localforage ---
localforage.config({
  name: 'EQBank',
  storeName: 'app_data',
  description: 'Stores user data for the EQ Bank PWA.',
});

// --- Keys for storage ---
const BATCHES_KEY = 'pgqbank-batches';
const STUDY_HISTORY_KEY = 'pgqbank-study-history';
const EXAM_HISTORY_KEY = 'pgqbank-exam-history';
const GOAL_KEY = 'pgqbank-goal';
const USER_METRICS_KEY = 'pgqbank-user-metrics'; // HLPE

// --- Helper Functions ---
const safelyGetItem = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const value = await localforage.getItem<T>(key);
    return value ?? defaultValue;
  } catch (error) {
    console.error(`Error reading from localforage key "${key}":`, error);
    return defaultValue;
  }
};

const safelySetItem = async <T>(key: string, value: T): Promise<boolean> => {
  try {
    await localforage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error writing to localforage key "${key}":`, error);
    return false;
  }
};


// --- Batches API ---
export const getBatches = (): Promise<Batch[]> => {
  return safelyGetItem<Batch[]>(BATCHES_KEY, []);
};

export const saveBatches = (batches: Batch[]): Promise<boolean> => {
    return safelySetItem(BATCHES_KEY, batches);
};

export const addBatch = async (batch: Batch): Promise<boolean> => {
    const batches = await getBatches();
    const normalizedBatch = {
      ...batch,
      questions: batch.questions.map(q => {
        // Sanitize tags: ensure it's an array, lowercase, and unique.
        const sanitizedTags = Array.isArray(q.tags)
          ? [...new Set(q.tags.map(t => t.toLowerCase().trim()))]
          : [];

        return {
          ...q,
          difficulty: q.difficulty || 'Medium',
          questionType: q.questionType || 'MCQ',
          tags: sanitizedTags,
          srsLevel: q.srsLevel || 0,
          lastAttemptCorrect: q.lastAttemptCorrect === undefined ? null : q.lastAttemptCorrect,
          nextReviewDate: q.nextReviewDate || new Date().toISOString(),
        };
      }),
    };
    const newBatches = [...batches, normalizedBatch].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const success = await saveBatches(newBatches);
    if (success) window.dispatchEvent(new CustomEvent('mcqUpdated'));
    return success;
};

export const updateQuestion = async (batchId: string, questionId: string, updates: Partial<MCQ>): Promise<boolean> => {
    const batches = await getBatches();
    const batchIndex = batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return false;

    const questionIndex = batches[batchIndex].questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return false;

    batches[batchIndex].questions[questionIndex] = {
        ...batches[batchIndex].questions[questionIndex],
        ...updates,
    };

    const success = await saveBatches(batches);
    if (success) window.dispatchEvent(new CustomEvent('mcqUpdated', { detail: { batchId, questionId } }));
    return success;
};

export const updateQuestionNotes = async (batchId: string, questionId: string, notes: string): Promise<boolean> => {
    return updateQuestion(batchId, questionId, { notes });
};

export const updateBatch = async (updatedBatch: Batch): Promise<boolean> => {
    const batches = await getBatches();
    const batchIndex = batches.findIndex(b => b.id === updatedBatch.id);
    if (batchIndex === -1) {
        return false; // Batch not found
    }
    batches[batchIndex] = updatedBatch;
    const success = await saveBatches(batches);
    if (success) window.dispatchEvent(new CustomEvent('mcqUpdated'));
    return success;
};

export const recordAnswerAndUpdateSrs = async (batchId: string, questionId: string, isCorrect: boolean): Promise<boolean> => {
    const batches = await getBatches();
    const batchIndex = batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return false;

    const questionIndex = batches[batchIndex].questions.findIndex(q => q.id === questionId);
    if (questionIndex === -1) return false;

    const question = batches[batchIndex].questions[questionIndex];

    const newSrsLevel = isCorrect ? (question.srsLevel || 0) + 1 : 1;
    // SuperMemo 2 algorithm for interval calculation
    const intervalDays = newSrsLevel > 1 ? 2 ** (newSrsLevel - 1) : 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    batches[batchIndex].questions[questionIndex] = {
        ...question,
        lastAttemptCorrect: isCorrect,
        srsLevel: newSrsLevel,
        nextReviewDate: nextReviewDate.toISOString(),
    };

    const success = await saveBatches(batches);
    if (success) window.dispatchEvent(new CustomEvent('mcqUpdated', { detail: { batchId, questionId } }));
    return success;
};


// --- Exam History API ---
export const getExamHistory = (): Promise<ExamSession[]> => {
    return safelyGetItem<ExamSession[]>(EXAM_HISTORY_KEY, []);
};

export const addExamSession = async (session: ExamSession): Promise<boolean> => {
    const history = await getExamHistory();
    const newHistory = [session, ...history].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return safelySetItem(EXAM_HISTORY_KEY, newHistory);
};

export const getExamById = async (id: string): Promise<ExamSession | undefined> => {
    const history = await getExamHistory();
    return history.find(session => session.id === id);
};

// --- Study History API ---
export const getStudyHistory = (): Promise<StudySessionResult[]> => {
    return safelyGetItem<StudySessionResult[]>(STUDY_HISTORY_KEY, []);
};

export const addStudySession = async (session: StudySessionResult): Promise<boolean> => {
    const history = await getStudyHistory();
    const newHistory = [session, ...history].slice(0, 20); // Keep only the last 20 sessions
    return safelySetItem(STUDY_HISTORY_KEY, newHistory);
};


// --- Goal API ---
export const getGoal = (): Promise<UserGoal | null> => {
    return safelyGetItem<UserGoal | null>(GOAL_KEY, { type: 'weeklyQuestions', target: 100 });
};

export const setGoal = (goal: UserGoal | null): Promise<boolean> => {
    return safelySetItem(GOAL_KEY, goal);
};

// --- HLPE Data API ---
export const getUserMetrics = (): Promise<UserMetrics> => {
    return safelyGetItem<UserMetrics>(USER_METRICS_KEY, { userElo: 1000 });
};

export const saveUserMetrics = (metrics: UserMetrics): Promise<boolean> => {
    return safelySetItem(USER_METRICS_KEY, metrics);
};

export const batchUpdateQuestions = async (updatedQuestions: Partial<MCQ>[]): Promise<boolean> => {
    const batches = await getBatches();
    const batchesToUpdate = new Map<string, Batch>();

    for (const qUpdate of updatedQuestions) {
        if (!qUpdate.id || !qUpdate.batchId) continue;

        const batch = batches.find(b => b.id === qUpdate.batchId);
        if (batch) {
            const questionIndex = batch.questions.findIndex(q => q.id === qUpdate.id);
            if (questionIndex !== -1) {
                // Merge the updates into the existing question
                batch.questions[questionIndex] = {
                    ...batch.questions[questionIndex],
                    ...qUpdate,
                };
                batchesToUpdate.set(batch.id, batch);
            }
        }
    }

    if (batchesToUpdate.size === 0) return true;

    // This is not the most efficient way, as it re-saves the entire batches array.
    // For a larger scale app, a more granular update would be better.
    // But for localforage, this is a common pattern.
    const updatedBatches = batches.map(b => batchesToUpdate.has(b.id) ? batchesToUpdate.get(b.id)! : b);
    const success = await saveBatches(updatedBatches);
    if (success) window.dispatchEvent(new CustomEvent('mcqUpdated'));
    return success;
};


// --- Import/Export API ---
export const getAppData = async (): Promise<AppData> => {
    const [batches, studyHistory, examHistory] = await Promise.all([
        getBatches(),
        getStudyHistory(),
        getExamHistory(),
    ]);
    return { batches, studyHistory, examHistory };
};

export const exportData = async () => {
    const data = await getAppData();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `e-qbank-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
};

export const importAppData = async (data: AppData): Promise<boolean> => {
    if (!data || !Array.isArray(data.batches) || !Array.isArray(data.studyHistory) || !Array.isArray(data.examHistory)) {
        console.error('Invalid data format for import.');
        return false;
    }
    try {
        // Use Promise.all to save all data concurrently
        await Promise.all([
            saveBatches(data.batches),
            safelySetItem(STUDY_HISTORY_KEY, data.studyHistory),
            safelySetItem(EXAM_HISTORY_KEY, data.examHistory),
        ]);
        window.dispatchEvent(new CustomEvent('mcqUpdated'));
        return true;
    } catch (e) {
        console.error("Failed to import data:", e);
        return false;
    }
};

// --- Analytics & Querying Logic ---

export const getAllQuestions = async (): Promise<MCQ[]> => {
    const batches = await getBatches();
    return batches.flatMap(b => b.questions);
};

export const getTagStats = async (): Promise<{ tag: string; count: number }[]> => {
    const allQuestions = await getAllQuestions();
    const tagCounts: { [key: string]: number } = {};

    allQuestions.forEach(q => {
        if (Array.isArray(q.tags)) {
            q.tags.forEach(tag => {
                const normalizedTag = tag.toLowerCase();
                tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
            });
        }
    });

    // Add a separate calculation for 'mistaked' as it's a special, implicit tag
    const mistakedCount = allQuestions.filter(q => q.lastAttemptCorrect === false).length;
    if (mistakedCount > 0) {
        tagCounts['mistaked'] = mistakedCount;
    }

    return Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
};

export const getDueReviewQuestions = async (): Promise<StudyQuestion[]> => {
    const batches = await getBatches();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return batches.flatMap(batch =>
      batch.questions
        .filter(q => q.nextReviewDate && new Date(q.nextReviewDate) <= today)
        .map(q => ({...q, batchId: batch.id, subject: batch.subject, chapter: batch.chapter}))
    ).sort((a,b) => {
        // Prioritize by review date first, then by Elo difficulty (hardest first)
        const dateA = new Date(a.nextReviewDate).getTime();
        const dateB = new Date(b.nextReviewDate).getTime();
        if (dateA !== dateB) {
            return dateA - dateB;
        }
        return (b.elo || 1000) - (a.elo || 1000);
    });
};

export const getPerformanceBySubject = async () => {
    const batches = await getBatches();
    const stats: { [key: string]: { correct: number; total: number } } = {};

    batches.forEach(batch => {
      batch.questions.forEach(q => {
        if (q.lastAttemptCorrect !== null) { // Has been attempted
          if (!stats[batch.subject]) {
            stats[batch.subject] = { correct: 0, total: 0 };
          }
          stats[batch.subject].total++;
          if (q.lastAttemptCorrect === true) {
            stats[batch.subject].correct++;
          }
        }
      });
    });

    return Object.entries(stats).map(([subject, data]) => ({
      subject,
      ...data,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    })).sort((a,b) => b.total - a.total);
};

export const getOverallStats = async () => {
    const allQuestions = await getAllQuestions();
    const [studyHistory, examHistory] = await Promise.all([getStudyHistory(), getExamHistory()]);

    const attemptedQuestions = allQuestions.filter(q => q.lastAttemptCorrect !== null);
    const correctAttempts = attemptedQuestions.filter(q => q.lastAttemptCorrect === true).length;
    const totalSessions = studyHistory.length + examHistory.length;
    const accuracy = attemptedQuestions.length > 0 ? Math.round((correctAttempts / attemptedQuestions.length) * 100) : 0;

    return {
      totalQuestions: allQuestions.length,
      attemptedQuestions: attemptedQuestions.length,
      accuracy,
      totalSessions,
    };
};

export const getStatsByGrouping = async (groupBy: 'subject' | 'platform' | 'chapter') => {
    const batches = await getBatches();
    const stats: { [key: string]: { total: number; attempted: number } } = {};

    batches.forEach(batch => {
      let key: string;
      if (groupBy === 'chapter') {
        key = `${batch.subject} - ${batch.chapter}`;
      } else {
        key = batch[groupBy];
      }

      if (!stats[key]) {
        stats[key] = { total: 0, attempted: 0 };
      }
      stats[key].total += batch.questions.length;
      stats[key].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });

    return Object.entries(stats)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total);
};

export const getRecentActivity = async (): Promise<Activity[]> => {
    const [batches, studyHistory, examHistory] = await Promise.all([getBatches(), getStudyHistory(), getExamHistory()]);

    const batchActivities: Activity[] = batches.map(b => ({
      type: 'batch', id: b.id, name: b.name, questionCount: b.questions.length, createdAt: b.createdAt,
    }));
    const studyActivities: Activity[] = studyHistory.map(s => ({
      type: 'study', id: s.id, score: s.score, subjects: s.config.subjects, createdAt: s.createdAt,
    }));
    const examActivities: Activity[] = examHistory.map(e => ({
      type: 'exam', id: e.id, score: e.score, subjects: e.config.subjects, createdAt: e.createdAt,
    }));

    return [...batchActivities, ...studyActivities, ...examActivities]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
};

export const getPerformanceOverTime = async () => {
    const [studyHistory, examHistory] = await Promise.all([getStudyHistory(), getExamHistory()]);
    const sessionHistory = [...studyHistory, ...examHistory]
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (sessionHistory.length === 0) return [];

    return sessionHistory.map(session => ({
        date: new Date(session.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
        score: session.score,
    }));
};

export const getWeeklyGoalProgress = async () => {
    const goal = await getGoal();
    if (!goal || goal.type !== 'weeklyQuestions') {
        return { count: 0, percentage: 0 };
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [studyHistory, examHistory] = await Promise.all([getStudyHistory(), getExamHistory()]);

    const questionsInLastWeek = [...studyHistory, ...examHistory]
        .filter(session => new Date(session.createdAt) > sevenDaysAgo)
        .reduce((total, session) => {
            if ('config' in session && 'questionCount' in session.config) {
                return total + session.config.questionCount;
            }
            if ('totalQuestions' in session) {
                return total + session.totalQuestions;
            }
            return total;
        }, 0);

    return {
        count: questionsInLastWeek,
        percentage: goal.target > 0 ? Math.min(100, Math.round((questionsInLastWeek / goal.target) * 100)) : 0,
    };
};

export const getStatsBySubject = () => getStatsByGrouping('subject');
export const getStatsByPlatform = () => getStatsByGrouping('platform');

export const updateTagCounts = async () => {
    const batches = await getBatches();
    const counts: { [key: string]: number } = {};

    batches.forEach(batch => {
        const normalizedSubject = batch.subject.toLowerCase();
        counts[normalizedSubject] = (counts[normalizedSubject] || 0) + batch.questions.length;

        batch.questions.forEach(q => {
            if (q.tags && Array.isArray(q.tags)) {
                q.tags.forEach(tag => {
                    const normalizedTag = tag.toLowerCase();
                    counts[normalizedTag] = (counts[normalizedTag] || 0) + 1;
                });
            }
        });
    });
    return counts;
};
