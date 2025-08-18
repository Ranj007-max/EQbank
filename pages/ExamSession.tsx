import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import type { ExamQuestion, ExamSession, MCQ } from '../types';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
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
  const { addExamSession, recordMultipleAnswers, getBatchById, updateBatch } = useAnalytics();
  
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isEndExamModalOpen, setIsEndExamModalOpen] = useState(false);
  const [isQuickReviewOpen, setIsQuickReviewOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playCorrectSound = useSound('/sounds/correct-ding.mp3');

  const bind = useDrag(({
    down,
    movement: [mx],
    direction: [xDir],
    cancel,
  }) => {
    if (down && Math.abs(mx) > window.innerWidth / 4) {
      cancel();
      if (xDir > 0) {
        changeQuestion(currentIndex - 1);
      } else {
        changeQuestion(currentIndex + 1);
      }
    }
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (sessionState && !isPaused) {
      const totalTime = sessionState.config.questionCount * 60;
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
      }
    }
    resumeSession();
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

  const toggleTag = (mcqId: string, batchId: string, tag: keyof MCQ['tags']) => {
    const batch = getBatchById(batchId);
    if (batch) {
      const updatedQuestions = batch.questions.map(q => {
        if (q.id === mcqId) {
          return { ...q, tags: { ...q.tags, [tag]: !q.tags?.[tag] } };
        }
        return q;
      });
      updateBatch({ ...batch, questions: updatedQuestions });
    }
  };

  const currentQuestionFromBatch = getBatchById(currentQuestion.batchId)?.questions.find(q => q.id === currentQuestion.id);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {feedback === 'correct' && <Confetti />}

      {/* Top Bar */}
      <header className="h-16 border-b bg-card text-card-foreground flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-primary">
            {`Q ${currentIndex + 1}/${sessionState.questions.length}`}
          </span>
        </div>
        <div className="flex-1 mx-8">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{
                width: `${(timeRemaining / (sessionState.config.questionCount * 60)) * 100}%`,
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
      <div className="flex flex-1 overflow-hidden">
        <main {...bind()} className="flex-1 flex items-center justify-center overflow-y-auto p-4 sm:p-6 touch-none">
          <div key={currentIndex} className="animate-question-change w-full max-w-4xl">
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">
                  {currentQuestion.question}
                </p>
              </CardContent>
              <CardFooter className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = sessionState.answers[currentQuestion.id] === option;
                  return (
                    <Button
                      key={i}
                      variant={isSelected ? 'default' : 'outline'}
                      className="h-16 text-left p-4 text-lg justify-start"
                      onClick={() => handleSelectAnswer(option)}
                      disabled={isAnswered}
                    >
                      <span className="font-mono mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                      {option}
                    </Button>
                  )
                })}
              </CardFooter>
            </Card>
          </div>
        </main>
        {/* Right Panel */}
        <aside className="w-80 border-l bg-card text-card-foreground p-4 overflow-y-auto">
          <h3 className="font-bold text-lg mb-4">Questions Grid</h3>
          <div className="grid grid-cols-5 gap-2">
            {sessionState.questions.map((q, index) => (
              <Button
                key={q.id}
                variant={
                  currentIndex === index
                    ? 'default'
                    : sessionState.answers[q.id]
                    ? 'secondary'
                    : 'outline'
                }
                className={`h-12 w-12 ${sessionState.markedForReview.includes(q.id) ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => changeQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </aside>
      </div>

      {/* Bottom Bar */}
      <footer className="h-16 border-t bg-card text-card-foreground flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost">Report</Button>
          <Button variant="ghost" onClick={() => toggleTag(currentQuestion.id, currentQuestion.batchId, 'revise')}>Revise</Button>
          <Button variant="ghost" onClick={() => toggleTag(currentQuestion.id, currentQuestion.batchId, 'hard')}>Hard</Button>
          <Button
            variant={currentQuestionFromBatch?.tags?.bookmarked ? 'default' : 'ghost'}
            onClick={() => toggleTag(currentQuestion.id, currentQuestion.batchId, 'bookmarked')}
          >
            Bookmark
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => changeQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
            <ChevronLeft size={20} className="mr-2" />
            Prev
          </Button>
          <Button onClick={() => changeQuestion(currentIndex + 1)} disabled={isLastQuestion}>
            Next
            <ChevronRight size={20} className="ml-2" />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setIsQuickReviewOpen(true)}>Review</Button>
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