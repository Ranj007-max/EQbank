import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { ArrowLeft, Bookmark, Flame, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { MCQ } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';

const BatchReview: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { getBatchById, updateBatch } = useAnalytics();
  
  const [shownAnswers, setShownAnswers] = useState<Record<string, boolean>>({});

  const batch = useMemo(() => batchId ? getBatchById(batchId) : undefined, [batchId, getBatchById]);
  
  if (!batch) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground">Batch not found</h2>
        <Button onClick={() => navigate('/bank')} className="mt-4">Return to Bank</Button>
      </div>
    );
  }

  const toggleAnswer = (mcqId: string) => {
    setShownAnswers(prev => ({ ...prev, [mcqId]: !prev[mcqId] }));
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
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/bank')} className="flex items-center gap-2 text-sm pl-0 mb-4">
            <ArrowLeft size={16} />
            Back to Bank
        </Button>
        <h1 className="text-5xl font-bold gradient-text">{batch.name}</h1>
        <p className="text-muted-foreground mt-1">{batch.questions.length} questions from {batch.platform}</p>
      </div>
      
      <div className="space-y-6">
        {batch.questions.map((mcq, index) => (
          <Card key={mcq.id}>
            <CardHeader>
                <p className="font-semibold text-foreground">{index + 1}. {mcq.question}</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 mb-4">
                {mcq.options.map((option, i) => (
                    <div key={i} className={`p-3 border rounded-md transition-colors ${
                        shownAnswers[mcq.id] && option === mcq.answer 
                        ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300 font-semibold' 
                        : 'bg-muted/50'
                    }`}>
                    {String.fromCharCode(65 + i)}. {option}
                    </div>
                ))}
                </div>

                 {shownAnswers[mcq.id] && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border animate-fade-in">
                        <p className="font-semibold text-foreground">Explanation:</p>
                        <p className="mt-1 text-muted-foreground">{mcq.explanation}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <Button variant="link" onClick={() => toggleAnswer(mcq.id)} className="p-0 h-auto">
                    {shownAnswers[mcq.id] ? <EyeOff size={16} className="mr-2"/> : <Eye size={16} className="mr-2"/>}
                    {shownAnswers[mcq.id] ? 'Hide Answer' : 'Show Answer'}
                </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'bookmarked')}>
                    <Bookmark className={`transition-colors ${mcq.tags.bookmarked ? 'text-yellow-500 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-500'}`}/>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'hard')}>
                    <Flame className={`transition-colors ${mcq.tags.hard ? 'text-red-500 fill-red-400' : 'text-muted-foreground hover:text-red-500'}`}/>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleTag(mcq.id, 'revise')}>
                    <RefreshCw className={`transition-colors ${mcq.tags.revise ? 'text-blue-500 fill-blue-400' : 'text-muted-foreground hover:text-blue-500'}`}/>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BatchReview;