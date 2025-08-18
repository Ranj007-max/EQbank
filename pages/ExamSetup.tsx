import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { ExamQuestion } from '../types';
import { ExamHistoryTable } from '../components/ExamHistoryTable';
import CreateExamPanel from '../components/CreateExamPanel';
import useLocalStorage from '../hooks/useLocalStorage';
import { debounce } from '../lib/utils';

export interface ExamConfig {
  examType: string;
  subjects: string[];
  chapters: string[];
  difficulty: number;
  numQuestions: number;
  tags: string[];
  name?: string;
}

const ExamSetup: React.FC = () => {
  const navigate = useNavigate();
  const { batches } = useAnalytics();
  const [presets, setPresets] = useLocalStorage<ExamConfig[]>('examPresets', []);

  const [config, setConfig] = useState<ExamConfig>({
    examType: 'full-mock',
    subjects: [],
    chapters: [],
    difficulty: 50,
    numQuestions: 50,
    tags: [],
  });

  const allQuestions = useMemo((): ExamQuestion[] => 
    batches.flatMap(batch => 
      batch.questions.map(q => ({ ...q, batchId: batch.id, subject: batch.subject, platform: batch.platform }))
    ), [batches]);

  const availableSubjects = useMemo(() => [...new Set(batches.map(b => b.subject))], [batches]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const subjectMatch = config.subjects.length === 0 || config.subjects.includes(q.subject);
      if (!subjectMatch) return false;

      const tagMatch = config.tags.length === 0 || config.tags.some(tag => {
        if (tag === 'Image-Based') return q.questionType === 'Image-based';
        if (tag === 'Unattempted') return q.lastAttemptCorrect === null;
        if (tag === 'Hard') return q.tags?.hard;
        // High-Yield is not a direct property, so we can't filter by it here
        return false;
      });
      if(!tagMatch) return false;

      return true;
    });
  }, [allQuestions, config]);

  const startExam = () => {
    const sessionQuestions = filteredQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, config.numQuestions);
      
    if (sessionQuestions.length > 0) {
      navigate('/exam/session', { state: { questions: sessionQuestions, config } });
    } else {
      alert("No questions match your criteria.");
    }
  };

  const handleConfigChange = (newConfig: Partial<ExamConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const debouncedSetConfig = useCallback(debounce(handleConfigChange, 300), []);

  const savePreset = () => {
    const name = prompt("Enter a name for this preset:");
    if (name) {
      setPresets([...presets, { ...config, name }]);
      alert(`Preset "${name}" saved!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in py-8">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-bold gradient-text">Create New Exam</h1>
            <p className="text-muted-foreground mt-2">Customize your exam by selecting from the options below.</p>
        </div>

        <CreateExamPanel
          config={config}
          onConfigChange={debouncedSetConfig}
          availableSubjects={availableSubjects.map(s => ({ value: s, label: s }))}
          startExam={startExam}
          availableQuestions={filteredQuestions.length}
          savePreset={savePreset}
          filteredQuestions={filteredQuestions}
        />

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-8 gradient-text">Recent Exams</h2>
            <ExamHistoryTable />
        </div>
    </div>
  );
};

export default ExamSetup;