import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { ArrowLeft, Bookmark, Flame, RefreshCw, EyeOff } from 'lucide-react';
import { MCQ } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { cn } from '../lib/utils';

const BatchReview: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { getBatchById, updateBatch } = useAnalytics();
  
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const batch = useMemo(() => batchId ? getBatchById(batchId) : undefined, [batchId, getBatchById]);
  
  if (!batch) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground">Batch not found</h2>
        <Button onClick={() => navigate('/bank')} className="mt-4">Return to Bank</Button>
      </div>
    );
  }

  const toggleCardFlip = (mcqId: string) => {
    setFlippedCards(prev => ({ ...prev, [mcqId]: !prev[mcqId] }));
  };

  const toggleTag = (mcqId: string, tag: keyof MCQ['tags']) => {
    const updatedQuestions = batch.questions.map(q => {
      if (q.id === mcqId) {
        return { ...q, tags: { ...q.tags, [tag]: !q.tags[tag] } };
      }
      return q;
    });
    updateBatch({ ...batch, questions: updatedQuestions });
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
        <style>{`
            .flashcard-container { perspective: 1000px; }
            .flashcard {
                position: relative;
                width: 100%;
                min-height: 400px;
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
                display: flex;
                flex-direction: column;
            }
            .flashcard-face-back { transform: rotateY(180deg); }
        `}</style>
      <div className="mb-8">
        <Button variant="ghost" asChild className="flex items-center gap-2 text-sm pl-0 mb-4">
            <Link to="/review">
                <ArrowLeft size={16} />
                Back to Review Hub
            </Link>
        </Button>
        <h1 className="text-5xl font-bold gradient-text">{batch.name}</h1>
        <p className="text-muted-foreground mt-1">{batch.questions.length} questions from {batch.platform}</p>
      </div>
      
      <div className="space-y-8">
        {batch.questions.map((mcq, index) => (
          <div key={mcq.id} className="flashcard-container">
            <div className={cn("flashcard", flippedCards[mcq.id] && "is-flipped")}>
                {/* Front of Card */}
                <div className="flashcard-face flashcard-face-front">
                    <Card className="w-full h-full flex flex-col">
                        <CardHeader>
                            <p className="font-serif font-bold text-xl text-foreground">{index + 1}. {mcq.question}</p>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-center justify-center">
                            <p className="text-muted-foreground">Click "Show Answer" to flip.</p>
                        </CardContent>
                        <CardFooter className="flex justify-end">
                            <Button variant="outline" onClick={() => toggleCardFlip(mcq.id)}>Show Answer</Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Back of Card */}
                <div className="flashcard-face flashcard-face-back">
                    <Card className="w-full h-full flex flex-col">
                        <CardHeader>
                            <p className="font-serif font-bold text-xl text-foreground">{index + 1}. {mcq.question}</p>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="space-y-2 mb-4">
                                {mcq.options.map((option, i) => (
                                    <div key={i} className={cn("p-3 border rounded-md text-sm",
                                        option === mcq.answer
                                        ? 'bg-green-500/10 border-green-500/30 text-green-800 dark:text-green-300 font-semibold'
                                        : 'bg-muted/50'
                                    )}>
                                    {String.fromCharCode(65 + i)}. {option}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                                <p className="font-semibold text-foreground">Explanation:</p>
                                <p className="mt-1 text-muted-foreground text-sm">{mcq.explanation}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <Button variant="link" onClick={() => toggleCardFlip(mcq.id)} className="p-0 h-auto">
                                <EyeOff size={16} className="mr-2"/> Hide Answer
                            </Button>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'bookmarked')}><Bookmark className={`transition-colors ${mcq.tags.bookmarked ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-500'}`}/></Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'hard')}><Flame className={`transition-colors ${mcq.tags.hard ? 'text-red-500 fill-red-400' : 'text-muted-foreground hover:text-red-500'}`}/></Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'revise')}><RefreshCw className={`transition-colors ${mcq.tags.revise ? 'text-blue-500 fill-blue-400' : 'text-muted-foreground hover:text-blue-500'}`}/></Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BatchReview;