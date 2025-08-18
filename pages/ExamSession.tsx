import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAnalytics } from '../context/AnalyticsContext';
import type { ExamQuestion, ExamSession } from '../types';
import { ChevronLeft, ChevronRight, Power, LoaderCircle, MoreVertical } from 'lucide-react';
import Timer from '../components/Timer';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { ProgressRing } from '../components/ui/progress-ring';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/card';
import { cn } from '../lib/utils';

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
  const [blinkingOption, setBlinkingOption] = useState<string | null>(null);

  useEffect(() => {
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
  }, [currentIndex]);
  
  const currentQuestion = sessionState?.questions[currentIndex];

  const handleEndExam = () => {
    if (!sessionState) return;
    if (!window.confirm('Are you sure you want to end the exam? This action cannot be undone.')) return;
    
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
    if (!currentQuestion) return;
    setSessionState(prev => prev ? { ...prev, answers: { ...prev.answers, [currentQuestion.id]: option } } : null);
  };

  const handleOptionClick = (option: string) => {
    if (!currentQuestion) return;
    setBlinkingOption(option);
    setTimeout(() => {
      handleSelectAnswer(option);
      setBlinkingOption(null);
    }, 100);
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
    <div className="flex flex-col h-screen bg-light-bg dark:bg-dark-bg font-sans text-gray-900 dark:text-gray-100">
      {/* Zone 1: Top Bar */}
      <header className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-950 h-20">
        <div className="flex items-center gap-4">
            <div className="relative">
                <ProgressRing
                    progress={100 - (((sessionState.config.durationMinutes * 60) - Math.floor((Date.now() - sessionState.startTime)/1000)) / (sessionState.config.durationMinutes * 60)) * 100}
                    size={56}
                    strokeWidth={5}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Timer
                        initialSeconds={(sessionState.config.durationMinutes * 60) - Math.floor((Date.now() - sessionState.startTime)/1000)}
                        onTimeUp={handleEndExam}
                        isPaused={false}
                        className="text-sm font-mono"
                    />
                </div>
            </div>
            <div className="flex-grow w-48 sm:w-64">
                <span className="text-sm font-semibold">{`Question ${currentIndex + 1} of ${sessionState.questions.length}`}</span>
                <Progress value={(currentIndex + 1) / sessionState.questions.length * 100} className="h-2 mt-1" />
            </div>
        </div>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(prev => !prev)}>
            <MoreVertical size={20} />
          </Button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-10 border border-gray-200 dark:border-gray-700">
              <ul className="py-1">
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Dark Mode</button>
                </li>
                <li>
                  <button onClick={handleEndExam} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">
                    End Exam
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden">
        {/* Zone 2: Main Question Panel */}
        <main className="flex-grow p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div key={currentIndex} className="animate-question-change">
              <Card className="flex-grow flex flex-col shadow-lg border-none bg-white dark:bg-gray-950 rounded-xl">
                <CardHeader className="p-6">
                  <p className="font-slab text-lg sm:text-xl font-semibold text-option-unselected-text leading-relaxed">{currentQuestion.question}</p>
              </CardHeader>

              <CardContent className="flex-grow p-6">
                  <div className="space-y-4">
                  {currentQuestion.options.map((option, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        onClick={() => handleOptionClick(option)}
                        className={cn(
                          "w-full h-auto justify-start p-4 text-base whitespace-normal rounded-lg hover:shadow-md transition-all bg-option-unselected-bg text-option-unselected-text hover:bg-option-hover-bg",
                          sessionState.answers[currentQuestion.id] === option && "text-white hover:shadow-xl shadow-lg bg-blue-500",
                          blinkingOption === option && "bg-pink-300"
                        )}
                      >
                          <span className="font-mono text-sm mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                          <span className="text-left flex-1">{option}</span>
                      </Button>
                  ))}
                  </div>
              </CardContent>

              <CardFooter className="flex justify-end items-center border-t p-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                <div className="flex gap-2">
                  <Button onClick={() => changeQuestion(currentIndex - 1)} disabled={currentIndex === 0} variant="outline">
                    <ChevronLeft size={20} /> <span className="hidden sm:inline ml-2">Previous</span>
                  </Button>
                  <Button onClick={() => isLastQuestion ? handleEndExam() : changeQuestion(currentIndex + 1)} variant={isLastQuestion ? 'destructive' : 'default'}>
                    {isLastQuestion ? 'Finish & Submit' : 'Save & Next'} <ChevronRight size={20} className="ml-2" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
            </div>
          </div>
        </main>

        {/* Zone 3: Right Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-800 p-4 flex-col bg-white dark:bg-gray-950 hidden lg:flex">
          <h3 className="font-bold text-foreground mb-4 text-center text-lg">Question Navigator</h3>
          <div className="grid grid-cols-6 gap-2 flex-grow overflow-y-auto content-start p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
            {sessionState.questions.map((q, index) => {
              const isMarked = sessionState.markedForReview.includes(q.id);
              const isAnswered = sessionState.answers[q.id] !== undefined;
              const isCurrent = index === currentIndex;

              let statusClass = 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400';
              if (sessionState.visited.includes(q.id) && !isAnswered) statusClass = 'bg-yellow-400/80 dark:bg-yellow-600/80 hover:bg-yellow-500 text-black'; // Skipped
              if (isAnswered) statusClass = 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 text-white'; // Answered
              if (isMarked) statusClass = 'bg-red-500 dark:bg-red-600 hover:bg-red-600 text-white'; // Marked

              return (
                <button key={q.id} onClick={() => changeQuestion(index)} className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold transition-all duration-200", statusClass, isCurrent && 'ring-4 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-gray-950')}>
                  {index + 1}
                </button>
              );
            })}
          </div>
          <Button onClick={handleEndExam} variant="destructive" className="w-full mt-4">
            <Power size={18} className="mr-2"/> End Exam
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default ExamSession;