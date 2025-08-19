import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Zap } from 'lucide-react';
import { Batch, MCQ, StudyQuestion } from '../types';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';

interface StudyPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUESTION_STATUSES = {
  bookmarked: 'Bookmarked',
  hard: 'Hard',
  revise: 'Revise',
  mistakes: 'Mistakes Only',
  unattempted: 'Unattempted',
};

const StudyPanel: React.FC<StudyPanelProps> = ({ isOpen, onOpenChange }) => {
  const navigate = useNavigate();
  const { batches } = useAnalytics();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(20);
  
  const allQuestions = useMemo((): StudyQuestion[] => 
    batches.flatMap((batch: Batch) =>
      batch.questions.map((q: MCQ) => ({...q, batchId: batch.id, subject: batch.subject}))
    ), [batches]);

  const availableSubjects = useMemo(() => [...new Set(batches.map((b: Batch) => b.subject))], [batches]);
  const availablePlatforms = useMemo(() => [...new Set(batches.map((b: Batch) => b.platform))], [batches]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q: StudyQuestion) => {
      const batch = batches.find((b: Batch) => b.id === q.batchId);
      if (!batch) return false;

      const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(batch.subject);
      const platformMatch = selectedPlatforms.length === 0 || selectedPlatforms.includes(batch.platform);
      
      if (!subjectMatch || !platformMatch) return false;

      if (selectedStatuses.length === 0) return true;

      return selectedStatuses.some(status => {
        if (status === 'bookmarked') return q.tags.bookmarked;
        if (status === 'hard') return q.tags.hard;
        if (status === 'revise') return q.tags.revise;
        if (status === 'mistakes') return q.lastAttemptCorrect === false;
        if (status === 'unattempted') return q.lastAttemptCorrect === null;
        return false;
      });
    });
  }, [allQuestions, batches, selectedSubjects, selectedPlatforms, selectedStatuses]);
  
  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };
  
  const startSession = () => {
    const sessionQuestions = filteredQuestions
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, numQuestions);
      
    if (sessionQuestions.length > 0) {
      navigate('/study', { state: { questions: sessionQuestions, config: {
        subjects: selectedSubjects.length > 0 ? selectedSubjects : ['All'],
        chapters: ['All'],
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['All'],
        statuses: selectedStatuses.length > 0 ? selectedStatuses.map(s => QUESTION_STATUSES[s as keyof typeof QUESTION_STATUSES]) : ['Any'],
        questionCount: sessionQuestions.length,
      }}});
      onOpenChange(false);
    } else {
      alert("No questions match your criteria. Please broaden your selection.");
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>New Study Session</SheetTitle>
            <SheetDescription>
              Configure your session and start practicing.
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-grow p-6 overflow-y-auto space-y-6 -mx-6 px-6">
            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map(subject => (
                  <Button key={subject} variant={selectedSubjects.includes(subject) ? 'default' : 'outline'} size="sm" onClick={() => handleToggle(setSelectedSubjects, subject)}>
                    {subject}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {availablePlatforms.map(platform => (
                  <Button key={platform} variant={selectedPlatforms.includes(platform) ? 'default' : 'outline'} size="sm" onClick={() => handleToggle(setSelectedPlatforms, platform)}>
                    {platform}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Question Status</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(QUESTION_STATUSES).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 p-2 rounded-md border bg-background has-[:checked]:bg-accent has-[:checked]:border-primary/50">
                        <Checkbox id={key} checked={selectedStatuses.includes(key)} onCheckedChange={() => handleToggle(setSelectedStatuses, key)} />
                        <Label htmlFor={key} className="text-sm font-medium leading-none cursor-pointer">{value}</Label>
                    </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="num-questions">Number of Questions ({Math.min(numQuestions, filteredQuestions.length)} / {filteredQuestions.length})</Label>
              <input 
                id="num-questions"
                type="range"
                min="10"
                max={Math.max(10, filteredQuestions.length)}
                step="5"
                value={numQuestions}
                onChange={e => setNumQuestions(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
          
          <SheetFooter>
            <Button 
              onClick={startSession}
              disabled={filteredQuestions.length === 0}
              size="lg"
              className="w-full"
              >
              <Zap size={20} className="mr-2" />
              Start Session ({Math.min(numQuestions, filteredQuestions.length)} Qs)
            </Button>
          </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default StudyPanel;