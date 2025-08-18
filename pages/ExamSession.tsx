import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import type { ExamQuestion, ExamSession } from '../types';
import { ChevronLeft, ChevronRight, Power, LoaderCircle } from 'lucide-react';
import Timer from '../components/Timer';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ProgressRing } from '../components/ui/progress-ring';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { cn } from '../lib/utils';
import { useSound } from '../hooks/useSound';
import Confetti from '../components/Confetti';
import ConfirmationModal from '../components/ConfirmationModal';
import QuickReviewModal from '../components/QuickReviewModal';
import { useDrag } from '@use-gesture/react';
import localforage from 'localforage';

interface SessionState {
  questions: ExamQuestion[];
  config: ExamSession['config'];
  answers: Record<string, string>;
  markedForReview: string[];
  visited: string[];
  startTime: number;
}

const ExamSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addExamSession, recordMultipleAnswers } = useAnalytics();
  
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isEndExamModalOpen, setIsEndExamModalOpen] = useState(false);
  const [isQuickReviewOpen, setIsQuickReviewOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playCorrectSound = useSound('/sounds/correct-ding.mp3');

  const bind = useDrag(({-
    down,
    movement: [mx],
    direction: [xDir],
    distance,
    cancel,
  }) => {
    if (down && distance > window.innerWidth / 4) {
      cancel();
      if (xDir > 0) {
        changeQuestion(currentIndex - 1);
      } else {
        changeQuestion(currentIndex + 1);
      }
    }
  });

  useEffect(() => {
    if (sessionState && !isPaused) {
      const totalTime = sessionState.config.numQuestions * 60;
      const elapsed = (Date.now() - sessionState.startTime) / 1000;
      setTimeRemaining(totalTime - elapsed);

      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleEndExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [sessionState?.startTime]);

  useEffect(() => {
    const resumeSession = async () => {
      const pausedSession = await localforage.getItem('pausedExamSession');
      const pausedIndex = await localforage.getItem('pausedExamIndex');

      if (pausedSession && pausedIndex !== null) {
        setSessionState(pausedSession as SessionState);
        setCurrentIndex(pausedIndex as number);
        await localforage.removeItem('pausedExamSession');
        await localforage.removeItem('pausedExamIndex');
      } else {
        const savedSession = sessionStorage.getItem('examSession');
        const savedIndex = sessionStorage.getItem('examSessionIndex');

        if (location.state?.questions) {
          const initialState: SessionState = {
        questions: location.state.questions,
        config: location.state.config,
        answers: {},
        markedForReview: [],
        visited: [location.state.questions[0]?.id],
        startTime: Date.now(),
      };
      setSessionState(initialState);
      setCurrentIndex(0);
    } else if (savedSession) {
      try {
        setSessionState(JSON.parse(savedSession));
        if (savedIndex) setCurrentIndex(Number(savedIndex));
      } catch (e) {
        console.error("Failed to parse saved exam session:", e);
        sessionStorage.clear();
        navigate('/exams');
      }
    } else {
      navigate('/exams');
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (sessionState) {
      sessionStorage.setItem('examSession', JSON.stringify(sessionState));
    }
  }, [sessionState]);

  useEffect(() => {
    sessionStorage.setItem('examSessionIndex', String(currentIndex));
    setFeedback(null);
    setIsAnswered(false);
  }, [currentIndex]);
  
  const currentQuestion = sessionState?.questions[currentIndex];

  const confirmEndExam = () => {
    if (!sessionState) return;
    
    const { questions, config, answers, startTime } = sessionState;
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    const correctAnswers = questions.filter(q => answers[q.id] === q.answer);
    
    const answeredQuestions = questions
      .filter(q => answers[q.id] !== undefined)
      .map(q => ({ batchId: q.batchId, questionId: q.id, isCorrect: answers[q.id] === q.answer }));
    
    if (answeredQuestions.length > 0) recordMultipleAnswers(answeredQuestions);
    
    const session: ExamSession = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      timeTaken,
      config,
      questions: questions.map(q => ({ questionData: q, userAnswer: answers[q.id] || null, isCorrect: answers[q.id] === q.answer })),
      score: Math.round((correctAnswers.length / questions.length) * 100),
      accuracy: `${correctAnswers.length}/${questions.length}`,
      correctAnswers: correctAnswers.length,
      totalQuestions: questions.length,
    };

    addExamSession(session);
    sessionStorage.removeItem('examSession');
    sessionStorage.removeItem('examSessionIndex');
    navigate(`/exam/results/${session.id}`);
  };

  const handleEndExam = () => {
    setIsEndExamModalOpen(true);
  };

  const changeQuestion = (index: number) => {
    if (sessionState && index >= 0 && index < sessionState.questions.length) {
      setCurrentIndex(index);
      const newQuestionId = sessionState.questions[index].id;
      if (!sessionState.visited.includes(newQuestionId)) {
        setSessionState(prev => prev ? { ...prev, visited: [...prev.visited, newQuestionId] } : null);
      }
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion || isAnswered) return;
    setSessionState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQuestion.id]: option } } : null);
    setIsAnswered(true);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    if (option === currentQuestion.answer) {
      setFeedback('correct');
      playCorrectSound();
    } else {
      setFeedback('incorrect');
    }
  };

  const handlePause = async () => {
    setIsPaused(true);
    await localforage.setItem('pausedExamSession', sessionState);
    await localforage.setItem('pausedExamIndex', currentIndex);
    navigate('/exams');
  };
  
  if (!sessionState || !currentQuestion) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isLastQuestion = currentIndex === sessionState.questions.length - 1;

  return (
    <div className="flex flex-col h-screen text-white" style={{ background: '#0A0A0A', fontFamily: 'SF Pro Display, sans-serif' }}>
      {feedback === 'correct' && <Confetti />}

      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 h-16 bg-black bg-opacity-30 backdrop-blur-sm z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg" style={{color: '#00A8FF'}}>
            {`Q ${currentIndex + 1}/${sessionState.questions.length}`}
          </span>
        </div>
        <div className="flex-1 mx-8">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className="h-2.5 rounded-full"
              style={{
                width: `${(timeRemaining / (sessionState.config.numQuestions * 60)) * 100}%`,
                backgroundColor: '#00A8FF',
                transition: 'width 0.5s linear'
              }}
            ></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePause}>Pause</Button>
          <Button variant="destructive" onClick={handleEndExam}>End Exam</Button>
        </div>
      </header>

      {/* Main Content */}
      <main {...bind()} className="flex-1 flex items-center justify-center overflow-y-auto p-4 sm:p-6 pt-20 pb-20 touch-none">
        <div key={currentIndex} className="animate-question-change w-full max-w-lg md:max-w-2xl lg:max-w-4xl">
          <div
            className="glass-card"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="p-6 md:p-8">
              <p className="text-xl md:text-2xl font-bold leading-relaxed" style={{fontFamily: 'SF Pro Display, sans-serif'}}>
                {currentQuestion.question}
              </p>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = sessionState.answers[currentQuestion.id] === option;
                return (
                  <button
                    key={i}
                    className={cn(
                      "neumorphic-button h-16 text-left p-4 text-lg transition-all duration-200",
                      isSelected && "bg-blue-500 text-white shadow-none"
                    )}
                    style={{
                      backgroundColor: isSelected ? '#00A8FF' : '#2A2A2A'
                    }}
                    onClick={() => handleSelectAnswer(option)}
                    disabled={isAnswered}
                  >
                    <span className="font-mono mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Bar */}
      {/* Bottom Bar */}
      <footer className="absolute bottom-0 left-0 right-0 h-16 bg-black bg-opacity-30 backdrop-blur-sm z-10 flex items-center justify-between px-6">
        <Button
          variant="outline"
          onClick={() => {
            const isMarked = sessionState.markedForReview.includes(currentQuestion.id);
            const newMarked = isMarked
              ? sessionState.markedForReview.filter(id => id !== currentQuestion.id)
              : [...sessionState.markedForReview, currentQuestion.id];
            setSessionState(prev => prev ? { ...prev, markedForReview: newMarked } : null);
          }}
          style={{ color: sessionState.markedForReview.includes(currentQuestion.id) ? '#00A8FF' : 'white' }}
        >
          Flag Question
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => changeQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
            <ChevronLeft size={20} />
            Prev
          </Button>
          <Button onClick={() => changeQuestion(currentIndex + 1)} disabled={isLastQuestion}>
            Next
            <ChevronRight size={20} />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setIsQuickReviewOpen(true)}>Quick Review</Button>
      </footer>

      <ConfirmationModal
        isOpen={isEndExamModalOpen}
        onClose={() => setIsEndExamModalOpen(false)}
        onConfirm={confirmEndExam}
        title="End Exam"
        description="Are you sure you want to end the exam? This action cannot be undone."
      />

      <QuickReviewModal
        isOpen={isQuickReviewOpen}
        onClose={() => setIsQuickReviewOpen(false)}
        questions={sessionState.questions}
        answers={sessionState.answers}
        markedForReview={sessionState.markedForReview}
        currentIndex={currentIndex}
        onQuestionSelect={changeQuestion}
      />
    </div>
  );
};

export default ExamSession;