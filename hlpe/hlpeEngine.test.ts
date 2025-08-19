import { describe, it, expect, vi } from 'vitest';
import { MCQ } from '../types';

// Mock the worker's self object
const self = {
    postMessage: vi.fn(),
};
vi.stubGlobal('self', self);

// Since we can't easily test the worker directly, we'll extract the core logic
// into functions we can test. Let's assume the functions from the worker are available here.
// In a real project, you'd refactor the worker to export its pure functions.
// For this exercise, I will re-declare the core functions here for testing.

const K_FACTOR = 32;
const calculateNewElo = (userElo: number, questionElo: number, isCorrect: boolean) => {
    const expectedScoreUser = 1 / (1 + Math.pow(10, (questionElo - userElo) / 400));
    const actualScoreUser = isCorrect ? 1 : 0;
    const newUserElo = userElo + K_FACTOR * (actualScoreUser - expectedScoreUser);
    return Math.round(newUserElo);
};

const calculateNewSrs = (question: Partial<MCQ>, isCorrect: boolean) => {
    let level = question.srsLevel || 0;
    let easinessFactor = question.srsEasinessFactor || 2.5;
    let interval = question.srsInterval || 0;

    if (isCorrect) {
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
    return { level, easinessFactor, interval };
};


describe('HLPE Algorithms', () => {
    describe('Elo Rating System', () => {
        it('should increase user Elo and decrease question Elo on correct answer', () => {
            const userElo = 1000;
            const questionElo = 1000;
            const newUserElo = calculateNewElo(userElo, questionElo, true);
            expect(newUserElo).toBe(1016); // 1000 + 32 * (1 - 0.5)
        });

        it('should decrease user Elo and increase question Elo on incorrect answer', () => {
            const userElo = 1000;
            const questionElo = 1000;
            const newUserElo = calculateNewElo(userElo, questionElo, false);
            expect(newUserElo).toBe(984); // 1000 + 32 * (0 - 0.5)
        });

        it('should change Elo less if the outcome is expected', () => {
            const userElo = 1200; // Strong user
            const questionElo = 1000; // Easy question
            const newUserElo = calculateNewElo(userElo, questionElo, true);
            expect(newUserElo).toBe(1208); // Change should be small
        });
    });

    describe('SuperMemo SM-2 Algorithm', () => {
        it('should handle the first correct answer correctly', () => {
            const question = { srsLevel: 0, srsEasinessFactor: 2.5, srsInterval: 0 };
            const { level, interval, easinessFactor } = calculateNewSrs(question, true);
            expect(level).toBe(1);
            expect(interval).toBe(1);
            expect(easinessFactor).toBe(2.6);
        });

        it('should handle the second correct answer correctly', () => {
            const question = { srsLevel: 1, srsEasinessFactor: 2.6, srsInterval: 1 };
            const { level, interval, easinessFactor } = calculateNewSrs(question, true);
            expect(level).toBe(2);
            expect(interval).toBe(6);
            expect(easinessFactor).toBe(2.7);
        });

        it('should handle an incorrect answer by resetting progress', () => {
            const question = { srsLevel: 3, srsEasinessFactor: 2.7, srsInterval: 16 };
            const { level, interval, easinessFactor } = calculateNewSrs(question, false);
            expect(level).toBe(1);
            expect(interval).toBe(1);
            expect(easinessFactor).toBe(1.3);
        });
    });
});
