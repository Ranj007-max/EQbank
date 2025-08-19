import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudy } from '../context/StudyContext';
import { useBatches } from '../context/BatchContext';
import * as dataService from '../services/dataService';
import { CheckCircle, XCircle, BrainCircuit, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import ReviewSessionSummary from '../components/ReviewSessionSummary';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { cn, formatDistanceToNow } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { StudyQuestion } from '../types';
import { MultiSelect } from '../components/ui/MultiSelect';

interface ReviewSettings {
  questionLimit: number;
  subjects: string[];
  tags: string[];
}

const SrsReviewSession: React.FC = () => {
  const navigate = useNavigate();
  const { isSrsReviewActive, srsQuestions, startSrsSession, recordAnswer, endSrsSession } = useStudy();
  const { updateQuestion, updateQuestionNotes } = useBatches();

  // State for the setup screen
  const [allDueQuestions, setAllDueQuestions] = useState<StudyQuestion[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the active session
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>({
    questionLimit: 20,
    subjects: [],
    tags: [],
  });

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      const [dueQuestions, subjectStats, tagStats] = await Promise.all([
        dataService.getDueReviewQuestions(),
        dataService.getStatsByGrouping('subject'),
        dataService.getTagStats(),
      ]);
      setAllDueQuestions(dueQuestions);
      setAvailableSubjects(subjectStats.map(s => s.name));
      setAvailableTags(tagStats.filter(t => t.count > 0).map(t => t.tag));
      setIsLoading(false);
    };
    if (!isSrsReviewActive) {
      loadInitialData();
    }
  }, [isSrsReviewActive]);

  const filteredQuestions = useMemo(() => {
    let questions = allDueQuestions;
    if (reviewSettings.subjects.length > 0) {
      const subjectSet = new Set(reviewSettings.subjects);
      questions = questions.filter(q => subjectSet.has(q.subject));
    }
    if (reviewSettings.tags.length > 0) {
      const tagSet = new Set(reviewSettings.tags);
      questions = questions.filter(q => q.tags && q.tags.some(tag => tagSet.has(tag)));
    }
    return questions.slice(0, reviewSettings.questionLimit);
  }, [allDueQuestions, reviewSettings]);

  const currentQuestion = isSrsReviewActive ? srsQuestions[currentQuestionIndex] : undefined;
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  
  useEffect(() => {
    if (currentQuestion) {
      setCurrentNotes(currentQuestion.notes || '');
    }
  }, [currentQuestion]);

  const handleSelectOption = (option: string) => {
    if (selectedOption || !currentQuestion) return;

    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    const isCorrect = option === currentQuestion.answer;
    recordAnswer(currentQuestion.id, currentQuestion.batchId, isCorrect);

    setIsFlipped(true);
  };

  const handleStartSession = () => {
    startSrsSession(filteredQuestions);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSessionEnded(false);
    setIsFlipped(false);
  };

  const toggleTag = (tag: string) => {
    if (!currentQuestion) return;
    const currentTags = currentQuestion.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateQuestion(currentQuestion.batchId, currentQuestion.id, { tags: newTags });
  };
  
  const goToNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        if (currentQuestionIndex < srsQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionEnded(true);
        }
    }, 300);
  };

  if (!isSrsReviewActive) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto flex flex-col justify-center h-full">
        <Card className="glass-card p-8 sm:p-12 text-center">
            <BrainCircuit size={56} className="mx-auto text-primary mb-6" />
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text mb-4">Spaced Repetition Review</h1>
            {isLoading ? <p>Loading...</p> : allDueQuestions.length > 0 ? (
            <>
                <p className="text-muted-foreground mb-8 text-lg">
                  You have <span className="font-bold text-primary text-xl">{allDueQuestions.length}</span> questions due for review.
                  {(filteredQuestions.length < allDueQuestions.length) && ` Your settings have filtered this down to ${filteredQuestions.length}.`}
                </p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={handleStartSession} size="lg" className="btn-gradient rounded-full" disabled={filteredQuestions.length === 0}>
                        {`Start Review (${filteredQuestions.length})`} <ArrowRight className="ml-2" size={20} />
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="btn-premium-label">Settings</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2"><SlidersHorizontal/> Review Settings</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="question-limit">Max Questions</Label>
                                    <Input id="question-limit" type="number" value={reviewSettings.questionLimit} onChange={e => setReviewSettings(rs => ({...rs, questionLimit: Math.max(1, parseInt(e.target.value) || 1)}))} placeholder="e.g., 20" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Filter by Subject</Label>
                                    <MultiSelect options={availableSubjects.map(s => ({ value: s, label: s }))} selected={reviewSettings.subjects} onChange={subjects => setReviewSettings(rs => ({ ...rs, subjects }))} placeholder="All Subjects" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Filter by Tags</Label>
                                    <MultiSelect options={availableTags.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} selected={reviewSettings.tags} onChange={tags => setReviewSettings(rs => ({ ...rs, tags }))} placeholder="All Tags" />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </>
            ) : (
            <>
                <p className="text-muted-foreground mb-8 text-lg">You have no questions due for review. Great job!</p>
                <Button onClick={() => navigate('/')} variant="outline" className="rounded-full">Back to Dashboard</Button>
            </>
            )}
        </Card>
      </div>
    );
  }

  if (sessionEnded) {
    return <ReviewSessionSummary sessionQuestions={srsQuestions} answers={selectedAnswers} onRestart={handleRestart} onExit={endSrsSession} />;
  }

  if (!currentQuestion) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center">
           <p className="text-muted-foreground mb-8">Loading question...</p>
      </div>
    )
  }

  const progressPercentage = ((currentQuestionIndex + 1) / srsQuestions.length) * 100;
  const questionForTags = srsQuestions[currentQuestionIndex];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        <style>{`
            .flashcard-container { perspective: 1000px; }
            .flashcard {
                position: relative;
                width: 100%;
                min-height: 450px;
                transform-style: preserve-3d;
                transition: transform 0.6s;
            }
            .flashcard.is-flipped { transform: rotateY(180deg); }
            .flashcard-face {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                -webkit-backface-visibility: hidden;
            }
            .flashcard-face-back { transform: rotateY(180deg); }
        `}</style>
       <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">Reviewing Question {currentQuestionIndex + 1} of {srsQuestions.length}</p>
            <p className="text-sm font-medium text-muted-foreground">{currentQuestion.subject}</p>
        </div>
        <Progress value={progressPercentage} className="h-2 [&>*]:bg-gradient-to-r from-secondary to-primary" />
      </div>

      <div className="flashcard-container">
        <div className={cn("flashcard", isFlipped && "is-flipped")}>
            {/* Front of Card */}
            <div className="flashcard-face flashcard-face-front">
                <Card className="w-full h-full flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <p className="font-serif font-bold text-2xl text-foreground leading-relaxed flex-1">{currentQuestion.question}</p>
                            <div className="flex flex-col items-end gap-2 text-right">
                                <Badge variant="outline" className="whitespace-nowrap">SRS Lvl: {currentQuestion.srsLevel}</Badge>
                                {currentQuestion.srsLevel === 0 ? (
                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">New</Badge>
                                ) : (
                                <Badge variant="secondary" className="whitespace-nowrap">Due: {formatDistanceToNow(new Date(currentQuestion.nextReviewDate))}</Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                        <p className="text-muted-foreground">Select an answer to reveal the explanation.</p>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            {/* Tagging and notes buttons are on the back */}
                        </div>
                        <Button variant="outline" onClick={() => setIsFlipped(true)}>Show Answer</Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Back of Card */}
            <div className="flashcard-face flashcard-face-back">
                <Card className="w-full h-full flex flex-col">
                    <CardHeader className="p-6">
                        <p className="font-serif font-bold text-2xl text-foreground leading-relaxed flex-1">{currentQuestion.question}</p>
                    </CardHeader>
                    <CardContent className="flex-grow p-6">
                        <div className="space-y-3">
                        {currentQuestion.options.map((option, i) => {
                            const isSelected = selectedOption === option;
                            const isCorrect = currentQuestion.answer === option;
                            let icon = null;

                            if (selectedOption) {
                                if (isCorrect) {
                                    icon = <CheckCircle className="mr-2" />;
                                } else if (isSelected && !isCorrect) {
                                    icon = <XCircle className="mr-2" />;
                                }
                            }

                            return (
                            <Button
                                key={i}
                                onClick={() => handleSelectOption(option)}
                                disabled={!!selectedOption}
                                variant="neumorphic"
                                isSelected={!!(isSelected || (selectedOption && isCorrect && option === currentQuestion.answer))}
                                isDestructive={!!(isSelected && !isCorrect)}
                                className="w-full justify-start h-auto py-3 whitespace-normal text-base rounded-full"
                            >
                                {icon}
                                <span className="font-mono text-sm mr-4 opacity-70">{String.fromCharCode(65 + i)}.</span>
                                <span className="text-left">{option}</span>
                            </Button>
                            );
                        })}
                        </div>
                        {selectedOption && (
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg border animate-fade-in">
                                <p className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                <CheckCircle className="text-green-500" size={20} />
                                Explanation
                                </p>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                {currentQuestion.explanation}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <Button variant="neumorphic" size="sm" onClick={() => toggleTag('bookmarked')} isSelected={(questionForTags.tags || []).includes('bookmarked')}>Bookmark</Button>
                            <Button variant="neumorphic" size="sm" onClick={() => toggleTag('hard')} isSelected={(questionForTags.tags || []).includes('hard')} isDestructive={(questionForTags.tags || []).includes('hard')}>Mark as Hard</Button>
                            <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="neumorphic" size="sm">Notes</Button>
                                </DialogTrigger>
                                <DialogContent>
                                <DialogHeader><DialogTitle>Notes for this Question</DialogTitle></DialogHeader>
                                <Textarea value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} rows={8} placeholder="Write your notes here..." />
                                <Button onClick={() => { if(currentQuestion) { updateQuestionNotes(currentQuestion.batchId, currentQuestion.id, currentNotes); } setIsNotesModalOpen(false); }}>Save Notes</Button>
                                </DialogContent>
                            </Dialog>
                        </div>
                        {selectedOption && (
                        <Button onClick={goToNext} className="btn-gradient rounded-full">
                            {currentQuestionIndex < srsQuestions.length - 1 ? 'Next Question' : 'Finish Review'} <ArrowRight className="ml-2" size={20} />
                        </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SrsReviewSession;