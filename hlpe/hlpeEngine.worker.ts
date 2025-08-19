/// <reference lib="webworker" />

import _ from 'lodash';
import { Batch, ExamSession, MCQ, UserMetrics } from '../types';

// --- HLPE Worker State and Types ---

interface HLPEState {
  userMetrics: UserMetrics;
  batches: Batch[];
  examHistory: ExamSession[];
}

let state: HLPEState | null = null;

export type HLPEWorkerMessage =
  | { type: 'INIT'; payload: { batches: Batch[]; examHistory: ExamSession[]; userMetrics: UserMetrics } }
  | { type: 'ANALYZE'; payload: { event: 'exam_completed', data: ExamSession } | { event: 'mcq_added', data: MCQ } | { event: 'app_load' } };

export interface ErrorCluster {
  name: 'Conceptual' | 'Silly Mistake' | 'Knowledge Gap';
  count: number;
  // Could add example questions here
}

export interface StudyRecommendation {
  subject: string;
  priority: number;
}

export interface KnowledgeGap {
  topic: string; // The underrepresented topic/keyword
  gapScore: number;
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
  ema: number;
}

export interface HLPEAnalysisResult {
  predictedScore?: number;
  errorClusters?: ErrorCluster[];
  studyPlan?: StudyRecommendation[];
  knowledgeGaps?: KnowledgeGap[];
  scoreTrend?: ScoreTrendPoint[];
}

export type HLPEWorkerResult =
  | { type: 'ANALYSIS_COMPLETE'; payload: HLPEAnalysisResult }
  | { type: 'DATA_UPDATED'; payload: { updatedMCQs: Partial<MCQ>[], updatedUserMetrics: Partial<UserMetrics> } };


// --- Main Message Handler ---

self.onmessage = (event: MessageEvent<HLPEWorkerMessage>) => {
  const { type, payload } = event.data;
  console.log(`HLPE Worker received message: ${type}`);

  switch (type) {
    case 'INIT':
      state = { ...payload };
      console.log('HLPE state initialized.');
      // Optionally, run an initial analysis on load
      runFullAnalysis();
      break;

    case 'ANALYZE':
      if (!state) {
        console.warn('HLPE worker received analysis request before state was initialized.');
        return;
      }
      // Update state with new data if necessary
      if (payload.event === 'exam_completed') {
        state.examHistory = [payload.data, ...state.examHistory];
      }
      // Throttled analysis
      _.throttle(runFullAnalysis, 10000)();
      break;
  }
};

// --- Core Analysis Orchestrator ---

const runFullAnalysis = () => {
  if (!state) return;

  console.log('HLPE: Starting full analysis...');

  // 1. Elo Rating Updates
  const eloUpdates = calculateEloForLastExam();

  // 2. SRS Updates
  const srsUpdates = calculateSrsUpdates();

  // Combine updates
  const updatedMCQs = _.merge(eloUpdates.updatedMCQs, srsUpdates.updatedMCQs);
  const updatedUserMetrics = eloUpdates.updatedUserMetrics;

  console.log('HLPE: Analysis complete.');

  // Post data updates back to the main thread
  self.postMessage({
    type: 'DATA_UPDATED',
    payload: { updatedMCQs, updatedUserMetrics }
  });

  // 7. Score Predictions (Linear Regression)
  const predictedScore = predictPerformance();

  // 5. Error Pattern Detection (K-Means)
  const errorClusters = clusterErrors();

  // 8. Study Plan Generation (Greedy)
  const studyPlan = generateStudyPlan();

  // 6. Coverage Gap Analysis (TF-IDF)
  const knowledgeGaps = findKnowledgeGaps();

  // 3. Progress Tracking (EMA)
  const scoreTrend = calculateScoreTrend();

  // Post all analysis insights back to the main thread
  const analysisResult: HLPEAnalysisResult = {
    predictedScore,
    errorClusters,
    studyPlan,
    knowledgeGaps,
    scoreTrend,
  };

  self.postMessage({
    type: 'ANALYSIS_COMPLETE',
    payload: analysisResult,
  });
};

/**
 * K-Means Clustering for Error Analysis
 * Groups incorrect answers into clusters.
 */
const clusterErrors = (): ErrorCluster[] | undefined => {
    const currentState = state;
    if (!currentState) return undefined;

    // 1. Vectorize incorrect answers
    const incorrectAnswers = currentState.examHistory
        .flatMap(exam => exam.questions.filter(q => !q.isCorrect))
        .map(attempt => {
            const examConfig = currentState.examHistory.find(e => e.id === attempt.questionData.batchId)?.config;
            const maxTime = examConfig ? (examConfig.durationMinutes * 60) / examConfig.questionCount : 60;
            const timeTaken = currentState.examHistory.find(e => e.id === attempt.questionData.batchId)?.timeTaken || 30;
            const normalizedTime = timeTaken / maxTime;
            let difficultyScore = 0;
            if (attempt.questionData.tags.hard) difficultyScore += 0.3;
            if (attempt.questionData.tags.caseBased) difficultyScore += 0.2;
            if (attempt.questionData.questionType !== 'MCQ') difficultyScore += 0.1;

            return {
                vector: [normalizedTime, difficultyScore],
                questionId: attempt.questionData.id,
            };
        });

    if (incorrectAnswers.length < 3) return undefined;

    // 2. K-Means implementation
    const k = 3;
    let centroids = _.sampleSize(incorrectAnswers, k).map(a => a.vector);
    let assignments = new Array(incorrectAnswers.length).fill(0);
    let changed = true;

    for (let iter = 0; iter < 20 && changed; iter++) {
        changed = false;
        // Assign points to centroids
        incorrectAnswers.forEach((answer, i) => {
            let minDistance = Infinity;
            let bestCluster = 0;
            centroids.forEach((centroid, j) => {
                const distance = Math.sqrt(
                    Math.pow(answer.vector[0] - centroid[0], 2) +
                    Math.pow(answer.vector[1] - centroid[1], 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCluster = j;
                }
            });
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                changed = true;
            }
        });

        // Recalculate centroids
        const newCentroids = Array.from({ length: k }, () => [0, 0]);
        const counts = new Array(k).fill(0);
        incorrectAnswers.forEach((answer, i) => {
            const cluster = assignments[i];
            newCentroids[cluster][0] += answer.vector[0];
            newCentroids[cluster][1] += answer.vector[1];
            counts[cluster]++;
        });

        counts.forEach((count, i) => {
            if (count > 0) {
                newCentroids[i][0] /= count;
                newCentroids[i][1] /= count;
            } else {
                // Re-initialize centroid if it has no points
                newCentroids[i] = _.sample(incorrectAnswers)!.vector;
            }
        });
        centroids = newCentroids;
    }

    // 3. Interpret and name clusters
    const clusterMeans = centroids.map((centroid, i) => ({
        index: i,
        time: centroid[0], // high time -> conceptual, low time -> silly
        difficulty: centroid[1], // high difficulty -> knowledge gap
    })).sort((a, b) => a.time - b.time);

    const sillyMistakeCluster = clusterMeans[0];
    const conceptualCluster = clusterMeans[2];
    const knowledgeGapCluster = clusterMeans[1];

    const results: ErrorCluster[] = [
        { name: 'Silly Mistake', count: 0 },
        { name: 'Conceptual', count: 0 },
        { name: 'Knowledge Gap', count: 0 },
    ];

    assignments.forEach(clusterIndex => {
        if (clusterIndex === sillyMistakeCluster.index) results[0].count++;
        else if (clusterIndex === conceptualCluster.index) results[1].count++;
        else if (clusterIndex === knowledgeGapCluster.index) results[2].count++;
    });

    return results;
};

/**
 * Greedy Algorithm for Study Plan Generation
 * Prioritizes topics based on error rate, syllabus weight, and practice time.
 */
const generateStudyPlan = (): StudyRecommendation[] | undefined => {
    const currentState = state;
    if (!currentState) return undefined;

    // Static syllabus weights (as mentioned in the prompt)
    const syllabusWeights: { [subject: string]: number } = {
        'Medicine': 0.15, 'Surgery': 0.15, 'Obstetrics & Gynecology': 0.10, 'Pediatrics': 0.10, 'Pathology': 0.05,
        'Pharmacology': 0.05, 'Microbiology': 0.05, 'Forensic Medicine': 0.05, 'Ophthalmology': 0.05, 'ENT': 0.05,
        'Preventive & Social Medicine': 0.05,
    };

    const subjectStats: { [subject: string]: { errors: number, total: number, practice: number } } = {};

    for (const batch of currentState.batches) {
        if (!subjectStats[batch.subject]) {
            subjectStats[batch.subject] = { errors: 0, total: 0, practice: 0 };
        }
        for (const q of batch.questions) {
            if (q.lastAttemptCorrect !== null) {
                subjectStats[batch.subject].total++;
                subjectStats[batch.subject].practice++; // practiceTime proxy
                if (q.lastAttemptCorrect === false) {
                    subjectStats[batch.subject].errors++;
                }
            }
        }
    }

    const recommendations: StudyRecommendation[] = Object.entries(subjectStats)
        .map(([subject, stats]) => {
            const errorRate = stats.total > 0 ? stats.errors / stats.total : 0;
            const weight = syllabusWeights[subject] || 0.05; // Default weight for unlisted subjects
            const maxPractice = _.max(Object.values(subjectStats).map(s => s.practice)) || 1;
            const practiceTime = stats.practice / maxPractice;
            const priority = (errorRate * weight) - practiceTime;
            return { subject, priority };
        })
        .filter(rec => rec.priority > -1)
        .sort((a, b) => b.priority - a.priority);

    return recommendations.slice(0, 5);
};

/**
 * TF-IDF for Knowledge Gap Analysis
 */
const findKnowledgeGaps = (): KnowledgeGap[] | undefined => {
    const currentState = state;
    if (!currentState) return undefined;

    const allQuestions = currentState.batches.flatMap(b => b.questions);
    if (allQuestions.length === 0) return undefined;

    const tokenize = (text: string) => text.toLowerCase().split(/\W+/).filter(Boolean);
    const corpus = allQuestions.map(q => tokenize(`${q.question} ${q.explanation}`));
    const attemptedQuestionIds = new Set(allQuestions.filter(q => q.lastAttemptCorrect !== null).map(q => q.id));

    const docCount = corpus.length;
    const idf: { [term: string]: number } = {};
    const termDocCounts: { [term: string]: number } = {};

    corpus.forEach(doc => {
        const uniqueTerms = new Set(doc);
        uniqueTerms.forEach(term => { termDocCounts[term] = (termDocCounts[term] || 0) + 1; });
    });

    for (const term in termDocCounts) { idf[term] = Math.log(docCount / termDocCounts[term]); }

    const tfidfVectors = corpus.map(doc => {
        const vector: { [term:string]: number } = {};
        const termCounts = _.countBy(doc);
        const docLength = doc.length;
        for (const term in termCounts) {
            const tf = termCounts[term] / docLength;
            vector[term] = tf * idf[term];
        }
        return vector;
    });

    const userAvgVector: { [term: string]: number } = {};
    const corpusAvgVector: { [term: string]: number } = {};
    const userDocCount = attemptedQuestionIds.size;

    tfidfVectors.forEach((vector, i) => {
        const questionId = allQuestions[i].id;
        for (const term in vector) {
            corpusAvgVector[term] = (corpusAvgVector[term] || 0) + vector[term];
            if (attemptedQuestionIds.has(questionId)) {
                userAvgVector[term] = (userAvgVector[term] || 0) + vector[term];
            }
        }
    });

    for (const term in corpusAvgVector) {
        corpusAvgVector[term] /= docCount;
        if (userAvgVector[term] && userDocCount > 0) {
            userAvgVector[term] /= userDocCount;
        }
    }

    const gaps: KnowledgeGap[] = [];
    for (const term in corpusAvgVector) {
        const corpusScore = corpusAvgVector[term];
        const userScore = userAvgVector[term] || 0;
        if (corpusScore > 0.01 && userScore < corpusScore * 0.1) {
            gaps.push({ topic: term, gapScore: corpusScore - userScore });
        }
    }

    return _.orderBy(gaps, ['gapScore'], ['desc']).slice(0, 5);
};

/**
 * Calculates the Exponential Moving Average (EMA) for score trends.
 */
const calculateScoreTrend = (): ScoreTrendPoint[] | undefined => {
    const currentState = state;
    if (!currentState || currentState.examHistory.length < 2) return undefined;

    const sortedHistory = _.orderBy(currentState.examHistory, ['createdAt'], ['asc']);
    const alpha = 0.2;
    let ema = sortedHistory[0].score;

    const trend: ScoreTrendPoint[] = [{ date: new Date(sortedHistory[0].createdAt).toLocaleDateString(), score: sortedHistory[0].score, ema: ema }];

    for (let i = 1; i < sortedHistory.length; i++) {
        const currentScore = sortedHistory[i].score;
        ema = alpha * currentScore + (1 - alpha) * ema;
        trend.push({ date: new Date(sortedHistory[i].createdAt).toLocaleDateString(), score: currentScore, ema: Math.round(ema * 100) / 100 });
    }

    return trend;
};

/**
 * Elo Rating System
 */
const calculateEloForLastExam = (): { updatedMCQs: Partial<MCQ>[], updatedUserMetrics: Partial<UserMetrics> } => {
    const currentState = state;
    if (!currentState || currentState.examHistory.length === 0) return { updatedMCQs: [], updatedUserMetrics: {} };

    const lastExam = currentState.examHistory[0];
    let currentUserElo = currentState.userMetrics.userElo || 1000;
    const K_FACTOR = 32;
    const updatedMCQs: Partial<MCQ>[] = [];

    for (const attempt of lastExam.questions) {
        const question = currentState.batches.flatMap(b => b.questions).find(q => q.id === attempt.questionData.id);
        if (!question) continue;

        const questionElo = question.elo || 1000;
        const expectedScoreUser = 1 / (1 + Math.pow(10, (questionElo - currentUserElo) / 400));
        const expectedScoreQuestion = 1 / (1 + Math.pow(10, (currentUserElo - questionElo) / 400));
        const actualScoreUser = attempt.isCorrect ? 1 : 0;
        const actualScoreQuestion = attempt.isCorrect ? 0 : 1;
        const newUserElo = currentUserElo + K_FACTOR * (actualScoreUser - expectedScoreUser);
        const newQuestionElo = questionElo + K_FACTOR * (actualScoreQuestion - expectedScoreQuestion);
        currentUserElo = newUserElo;
        updatedMCQs.push({ id: question.id, batchId: question.batchId, elo: Math.round(newQuestionElo) });
    }

    const updatedUserMetrics = { userElo: Math.round(currentUserElo) };

    if (state) { // Keep original state object for mutation
        const currentState = state;
        currentState.userMetrics.userElo = updatedUserMetrics.userElo;
        updatedMCQs.forEach(q_update => {
          const question_to_update = currentState.batches.flatMap(b => b.questions).find(q => q.id === q_update.id);
          if (question_to_update) question_to_update.elo = q_update.elo;
        });
    }

    return { updatedMCQs, updatedUserMetrics };
};

/**
 * SuperMemo SM-2 Algorithm
 */
const calculateSrsUpdates = (): { updatedMCQs: Partial<MCQ>[] } => {
    const currentState = state;
    if (!currentState || currentState.examHistory.length === 0) return { updatedMCQs: [] };

    const lastExam = currentState.examHistory[0];
    const updatedMCQs: Partial<MCQ>[] = [];

    for (const attempt of lastExam.questions) {
        const question = currentState.batches.flatMap(b => b.questions).find(q => q.id === attempt.questionData.id);
        if (!question) continue;

        let level = question.srsLevel || 0;
        let easinessFactor = question.srsEasinessFactor || 2.5;
        let interval = question.srsInterval || 0;

        if (attempt.isCorrect) {
            level++;
            if (level === 1) interval = 1;
            else if (level === 2) interval = 6;
            else interval = Math.round(interval * easinessFactor);
            easinessFactor += 0.1;
        } else {
            level = 1;
            interval = 1;
            easinessFactor = 1.3;
        }

        if (easinessFactor < 1.3) easinessFactor = 1.3;

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        const update: Partial<MCQ> = {
            id: question.id, batchId: question.batchId, srsLevel: level, srsEasinessFactor: easinessFactor,
            srsInterval: interval, nextReviewDate: nextReviewDate.toISOString(), lastAttemptCorrect: attempt.isCorrect,
        };
        updatedMCQs.push(update);

        if (state) {
            const q_to_update = state.batches.flatMap(b => b.questions).find(q => q.id === update.id);
            if (q_to_update) Object.assign(q_to_update, update);
        }
    }
    return { updatedMCQs };
}

/**
 * Linear Regression for Score Prediction
 */
const predictPerformance = (): number | undefined => {
    const currentState = state;
    if (!currentState || currentState.examHistory.length === 0) return undefined;

    const history = currentState.examHistory;
    const totalQuestionsAttempted = _.sumBy(history, 'totalQuestions');
    if (totalQuestionsAttempted === 0) return undefined;

    const totalCorrect = _.sumBy(history, 'correctAnswers');
    const overallAccuracy = totalCorrect / totalQuestionsAttempted;
    const totalTimeTaken = _.sumBy(history, 'timeTaken');
    const avgTimePerQuestion = totalTimeTaken / totalQuestionsAttempted;
    const maxTimePerQuestion = (history[0].config.durationMinutes * 60) / history[0].config.questionCount;
    const normalizedTime = maxTimePerQuestion > 0 ? (1 - avgTimePerQuestion / maxTimePerQuestion) : 0;

    const a = 0.6, b = 0.3, c = 0.1;
    const allQuestions = currentState.batches.flatMap(b => b.questions);
    const attemptedQuestions = allQuestions.filter(q => q.lastAttemptCorrect !== null);
    const coverage = allQuestions.length > 0 ? attemptedQuestions.length / allQuestions.length : 0;
    const predictedScore = (a * overallAccuracy) + (b * coverage) + (c * normalizedTime);

    return Math.max(0, Math.min(100, predictedScore * 100));
};

console.log('HLPE Worker loaded.');
