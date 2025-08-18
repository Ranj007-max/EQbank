import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Bookmark, Flame, CheckCircle, XCircle, BrainCircuit, Notebook, Flag, Settings, SlidersHorizontal, ArrowRight } from 'lucide-react';
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
import { Tag, StudyQuestion } from '../types';
import { MultiSelect } from '../components/ui/MultiSelect';

interface ReviewSettings {
  questionLimit: number;
  subjects: string[];
  tags: Tag[];
}

const SrsReviewSession: React.FC = () => {
  const navigate = useNavigate();
  const { dueReviewQuestions, getBatchById, updateBatch, recordAnswer, statsBySubject, tagStats, updateQuestionNotes } = useAnalytics();
  
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessionQuestions, setSessionQuestions] = useState<StudyQuestion[]>([]);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [currentNotes, setCurrentNotes] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);

  const [reviewSettings, setReviewSettings] = useState<ReviewSettings>({
    questionLimit: 20,
    subjects: [],
    tags: [],
  });

  const availableSubjects = useMemo(() => statsBySubject.map(s => s.name), [statsBySubject]);

  const availableTags = useMemo((): Tag[] => {
    return (Object.keys(tagStats) as Tag[]).filter(tag => tagStats[tag] > 0);
  }, [tagStats]);

  const questions = useMemo(() => {
    let filteredQuestions = dueReviewQuestions || [];
    if (reviewSettings.subjects.length > 0) {
      const subjectSet = new Set(reviewSettings.subjects);
      filteredQuestions = filteredQuestions.filter(q => {
        const batch = getBatchById(q.batchId);
        return batch && subjectSet.has(batch.subject);
      });
    }
    if (reviewSettings.tags.length > 0) {
      filteredQuestions = filteredQuestions.filter(q => {
        return reviewSettings.tags.every(tag => q.tags[tag]);
      });
    }
    return filteredQuestions.slice(0, reviewSettings.questionLimit);
  }, [dueReviewQuestions, reviewSettings, getBatchById]);

  const currentQuestion = sessionStarted ? sessionQuestions[currentQuestionIndex] : questions[currentQuestionIndex];
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  
  useEffect(() => {
    if (currentQuestion) {
      setCurrentNotes(currentQuestion.notes || '');
    }
  }, [currentQuestion]);

  const handleSelectOption = (option: string) => {
    if (selectedOption) return; 

    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
    
    const isCorrect = option === currentQuestion.answer;
    recordAnswer(currentQuestion.batchId, currentQuestion.id, isCorrect);

    setIsFlipped(true);
  };

  const handleStartSession = () => {
    setSessionQuestions(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSessionEnded(false);
    setSessionStarted(true);
    setIsFlipped(false);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setSessionEnded(false);
    setSessionStarted(true);
    setIsFlipped(false);
  };

  const toggleTag = (tag: 'bookmarked' | 'hard') => {
    if(!currentQuestion) return;
    const batch = getBatchById(currentQuestion.batchId);
    if (batch) {
      const updatedQuestions = batch.questions.map(q => 
        q.id === currentQuestion.id ? { ...q, tags: { ...q.tags, [tag]: !q.tags[tag] } } : q
      );
      updateBatch({ ...batch, questions: updatedQuestions });
    }
  };
  
  const goToNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
        if (currentQuestionIndex < sessionQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setSessionEnded(true);
        }
    }, 300); // Wait for flip back animation
  };

  if (!sessionStarted) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto flex flex-col justify-center h-full">
        <Card className="glass-card p-8 sm:p-12 text-center">
            <BrainCircuit size={56} className="mx-auto text-primary mb-6" />
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text mb-4">Spaced Repetition Review</h1>
            {dueReviewQuestions.length > 0 ? (
            <>
                <p className="text-muted-foreground mb-8 text-lg">
                  You have <span className="font-bold text-primary text-xl">{dueReviewQuestions.length}</span> questions due for review.
                  { (questions.length < dueReviewQuestions.length) && ` Your settings have filtered this down to ${questions.length}.` }
                </p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={handleStartSession} size="lg" className="btn-gradient rounded-full" disabled={questions.length === 0}>
                        {`Start Review (${questions.length})`} <ArrowRight className="ml-2" size={20} />
                    </Button>
                    <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" variant="outline" className="rounded-full gap-2"><Settings size={20}/></Button>
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
                                    <MultiSelect options={availableTags.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} selected={reviewSettings.tags} onChange={tags => setReviewSettings(rs => ({ ...rs, tags: tags as Tag[] }))} placeholder="All Tags" />
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
    return <ReviewSessionSummary sessionQuestions={sessionQuestions} answers={selectedAnswers} onRestart={handleRestart} onExit={() => navigate('/')} />;
  }

  if (!currentQuestion) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto text-center">
           <p className="text-muted-foreground mb-8">Loading question...</p>
      </div>
    )
  }

  const batchForTags = getBatchById(currentQuestion.batchId);
  const questionForTags = batchForTags?.questions.find(q => q.id === currentQuestion.id);
  const progressPercentage = ((currentQuestionIndex + 1) / sessionQuestions.length) * 100;

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
            <p className="text-sm font-medium text-muted-foreground">Reviewing Question {currentQuestionIndex + 1} of {sessionQuestions.length}</p>
            <p className="text-sm font-medium text-muted-foreground">{getBatchById(currentQuestion.batchId)?.subject}</p>
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
                            let variant: "outline" | "success" | "destructive" = "outline";
                            let icon = null;
                            if(selectedOption) {
                                if (isCorrect) {
                                    variant = "success";
                                    icon = <CheckCircle className="mr-2" />;
                                }
                                else if (isSelected && !isCorrect) {
                                    variant = "destructive";
                                    icon = <XCircle className="mr-2" />;
                                }
                            }

                            return (
                            <Button key={i} onClick={() => handleSelectOption(option)} disabled={!!selectedOption} variant={variant} className="w-full justify-start h-auto py-3 whitespace-normal text-base rounded-full">
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
                        <div className="flex items-center gap-1">
                        {questionForTags && <>
                            <Button variant="ghost" size="icon" onClick={() => toggleTag('bookmarked')} title="Bookmark"><Bookmark className={`transition-colors ${questionForTags.tags.bookmarked ? 'text-yellow-400 fill-yellow-400/50' : 'text-muted-foreground hover:text-yellow-400'}`}/></Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleTag('hard')} title="Mark as Hard"><Flame className={`transition-colors ${questionForTags.tags.hard ? 'text-red-500 fill-red-500/50' : 'text-muted-foreground hover:text-red-500'}`}/></Button>
                        </>}
                        <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
                            <DialogTrigger asChild><Button variant="ghost" size="icon" title="Notes"><Notebook className="text-muted-foreground hover:text-primary" /></Button></DialogTrigger>
                            <DialogContent>
                            <DialogHeader><DialogTitle>Notes for this Question</DialogTitle></DialogHeader>
                            <Textarea value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} rows={8} placeholder="Write your notes here..." />
                            <Button onClick={() => { if(currentQuestion) { updateQuestionNotes(currentQuestion.batchId, currentQuestion.id, currentNotes); } setIsNotesModalOpen(false); }}>Save Notes</Button>
                            </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="icon" title="Report Issue (coming soon)" disabled><Flag className="text-muted-foreground" /></Button>
                        </div>
                        {selectedOption && (
                        <Button onClick={goToNext} className="btn-gradient rounded-full">
                            {currentQuestionIndex < sessionQuestions.length - 1 ? 'Next Question' : 'Finish Review'} <ArrowRight className="ml-2" size={20} />
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