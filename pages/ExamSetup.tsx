import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { Zap } from 'lucide-react';
import { ExamQuestion } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import { ExamHistoryTable } from '../components/ExamHistoryTable';

const QUESTION_STATUSES = {
  unattempted: 'Unattempted',
  mistakes: 'Mistakes Only',
  bookmarked: 'Bookmarked',
  hard: 'Hard',
  revise: 'Revise',
};

const ExamSetup: React.FC = () => {
  const navigate = useNavigate();
  const { batches } = useAnalytics();
  
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['unattempted']);
  const [numQuestions, setNumQuestions] = useState(25);
  
  const allQuestions = useMemo((): ExamQuestion[] => 
    batches.flatMap(batch => 
      batch.questions.map(q => ({
        ...q, 
        batchId: batch.id, 
        subject: batch.subject, 
        platform: batch.platform
      }))
    ), [batches]);

  const availableSubjects = useMemo(() => [...new Set(batches.map(b => b.subject))], [batches]);
  const availablePlatforms = useMemo(() => [...new Set(batches.map(b => b.platform))], [batches]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const subjectMatch = selectedSubjects.length === 0 || selectedSubjects.includes(q.subject);
      const platformMatch = selectedPlatforms.length === 0 || selectedPlatforms.includes(q.platform);
      
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
  }, [allQuestions, selectedSubjects, selectedPlatforms, selectedStatuses]);
  
  const handleToggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]);
  };
  
  const startExam = () => {
    const sessionQuestions = filteredQuestions
      .sort(() => 0.5 - Math.random()) // Shuffle
      .slice(0, numQuestions);
      
    if (sessionQuestions.length > 0) {
      const config = {
        subjects: selectedSubjects.length > 0 ? selectedSubjects : ['All'],
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['All'],
        statuses: selectedStatuses.length > 0 ? selectedStatuses.map(s => QUESTION_STATUSES[s as keyof typeof QUESTION_STATUSES]) : ['Any'],
        questionCount: sessionQuestions.length,
      };
      navigate('/exam/session', { state: { questions: sessionQuestions, config } });
    } else {
      alert("No questions match your criteria. Please broaden your selection.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold gradient-text">Create New Exam</h1>
            <p className="text-muted-foreground mt-2">Customize your exam by selecting from the options below.</p>
        </div>

        <Card>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Subjects</h3>
                    <div className="flex flex-wrap gap-2">
                        {availableSubjects.map(subject => (
                        <Button key={subject} variant={selectedSubjects.includes(subject) ? 'default' : 'outline'} onClick={() => handleToggle(setSelectedSubjects, subject)}>{subject}</Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Platforms</h3>
                    <div className="flex flex-wrap gap-2">
                        {availablePlatforms.map(platform => (
                        <Button key={platform} variant={selectedPlatforms.includes(platform) ? 'default' : 'outline'} onClick={() => handleToggle(setSelectedPlatforms, platform)}>{platform}</Button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Question Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(QUESTION_STATUSES).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2 p-3 rounded-lg border bg-background has-[:checked]:bg-accent has-[:checked]:border-primary/50">
                            <Checkbox id={key} checked={selectedStatuses.includes(key)} onCheckedChange={() => handleToggle(setSelectedStatuses, key)} />
                            <Label htmlFor={key} className="font-medium cursor-pointer">{value}</Label>
                        </div>
                        ))}
                    </div>
                </div>
                
                <div className="space-y-3">
                    <Label htmlFor="num-questions" className="text-lg font-semibold text-foreground">Number of Questions: <span className="font-bold text-primary">{Math.min(numQuestions, filteredQuestions.length)}</span> / {filteredQuestions.length} available</Label>
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
            </CardContent>
            <CardFooter>
                 <Button 
                    onClick={startExam}
                    disabled={filteredQuestions.length === 0}
                    size="lg"
                    className="w-full text-lg font-bold"
                >
                    <Zap size={22} className="mr-3" />
                    Start Exam ({Math.min(numQuestions, filteredQuestions.length)} Questions)
                </Button>
            </CardFooter>
        </Card>

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Recent Exams</h2>
            <ExamHistoryTable />
        </div>
    </div>
  );
};

export default ExamSetup;