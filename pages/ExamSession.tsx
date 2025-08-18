import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../context/ExamContext';
import { useBatches } from '../context/BatchContext';
import type { MCQ } from '../types';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { useSound } from '../hooks/useSound';
import Confetti from '../components/Confetti';
import ConfirmationModal from '../components/ConfirmationModal';
import QuickReviewModal from '../components/QuickReviewModal';
import { useDrag } from '@use-gesture/react';

const ExamSession: React.FC = () => {
  const navigate = useNavigate();
  const {
    isExamActive,
    examSession,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    userAnswers,
    timeRemaining,
    answerQuestion,
    setCurrentQuestionIndex,
    endExam,
  } = useExam();

  const { updateQuestion } = useBatches();
  
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [isEndExamModalOpen, setIsEndExamModalOpen] = useState(false);
  const [isQuickReviewOpen, setIsQuickReviewOpen] = useState(false);
  const [markedForReview] = useState<string[]>([]);
  const playCorrectSound = useSound('/sounds/correct-ding.mp3');

  useEffect(() => {
    if (!isExamActive) {
      navigate('/exams', { replace: true });
    }
  }, [isExamActive, navigate]);

  useEffect(() => {
    setFeedback(null);
  }, [currentQuestionIndex]);

  const bind = useDrag(({ down, movement: [mx], direction: [xDir], cancel }) => {
    if (down && Math.abs(mx) > window.innerWidth / 4) {
      cancel();
      if (xDir > 0) {
        changeQuestion(currentQuestionIndex - 1);
      } else {
        changeQuestion(currentQuestionIndex + 1);
      }
    }
  });

  const changeQuestion = (index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSelectAnswer = (option: string) => {
    if (!currentQuestion) return;
    const isAlreadyAnswered = userAnswers[currentQuestion.id] !== null;
    if (isAlreadyAnswered) return;

    answerQuestion(currentQuestion.id, option);
    if (navigator.vibrate) navigator.vibrate(10);

    if (option === currentQuestion.answer) {
      setFeedback('correct');
      playCorrectSound();
    } else {
      setFeedback('incorrect');
    }
  };

  const toggleTag = (tag: keyof MCQ['tags']) => {
    if (!currentQuestion) return;
    updateQuestion(currentQuestion.batchId, currentQuestion.id, {
      tags: { ...currentQuestion.tags, [tag]: !currentQuestion.tags[tag] },
    });
  };

  if (!isExamActive || !currentQuestion || !examSession) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoaderCircle className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isAnswered = userAnswers[currentQuestion.id] !== null;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {feedback === 'correct' && <Confetti />}

      <header className="h-16 border-b bg-card text-card-foreground flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg text-primary">
            {`Q ${currentQuestionIndex + 1}/${totalQuestions}`}
          </span>
        </div>
        <div className="font-mono text-2xl font-bold text-primary">{`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}</div>
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={() => setIsEndExamModalOpen(true)}>End Exam</Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main {...bind()} className="flex-1 flex items-center justify-center overflow-y-auto p-4 sm:p-6 touch-none">
          <div key={currentQuestion.id} className="animate-question-change w-full max-w-4xl">
            <Card>
              <CardContent className="p-6 md:p-8">
                <p className="text-xl md:text-2xl font-bold leading-relaxed">{currentQuestion.question}</p>
              </CardContent>
              <CardFooter className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {currentQuestion.options.map((option, i) => {
                  const isSelected = userAnswers[currentQuestion.id] === option;
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
                  );
                })}
              </CardFooter>
            </Card>
          </div>
        </main>

        <aside className="w-80 border-l bg-card text-card-foreground p-4 overflow-y-auto shrink-0">
          <h3 className="font-bold text-lg mb-4">Questions Grid</h3>
          <div className="grid grid-cols-5 gap-2">
            {examSession.questions.map((q, index) => (
              <Button
                key={q.questionData.id}
                variant={
                  currentQuestionIndex === index ? 'default' : userAnswers[q.questionData.id] ? 'secondary' : 'outline'
                }
                className={`h-12 w-12 ${markedForReview.includes(q.questionData.id) ? 'ring-2 ring-yellow-500' : ''}`}
                onClick={() => changeQuestion(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </aside>
      </div>

      <footer className="h-16 border-t bg-card text-card-foreground flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => toggleTag('revise')}>Revise</Button>
          <Button variant="ghost" onClick={() => toggleTag('hard')}>Hard</Button>
          <Button variant={currentQuestion.tags.bookmarked ? 'secondary' : 'ghost'} onClick={() => toggleTag('bookmarked')}>Bookmark</Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => changeQuestion(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0}>
            <ChevronLeft size={20} className="mr-2" /> Prev
          </Button>
          <Button onClick={() => changeQuestion(currentQuestionIndex + 1)} disabled={isLastQuestion}>
            Next <ChevronRight size={20} className="ml-2" />
          </Button>
        </div>
        <Button variant="outline" onClick={() => setIsQuickReviewOpen(true)}>Review</Button>
      </footer>

      <ConfirmationModal
        isOpen={isEndExamModalOpen}
        onClose={() => setIsEndExamModalOpen(false)}
        onConfirm={endExam}
        title="End Exam"
        description="Are you sure you want to end the exam? Your session will be saved and scored."
      />

      <QuickReviewModal
        isOpen={isQuickReviewOpen}
        onClose={() => setIsQuickReviewOpen(false)}
        questions={examSession.questions.map(q => q.questionData)}
        answers={userAnswers}
        markedForReview={markedForReview}
        currentIndex={currentQuestionIndex}
        onQuestionSelect={changeQuestion}
      />
    </div>
  );
};

export default ExamSession;