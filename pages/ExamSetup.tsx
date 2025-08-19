import { useState, useMemo, useCallback } from 'react';
import { useBatches } from '../context/BatchContext';
import { useExam } from '../context/ExamContext';
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
  platform: string;
  name?: string;
}

const ExamSetup: React.FC = () => {
  const { batches } = useBatches();
  const { startExam: startExamFromContext } = useExam();
  const [presets, setPresets] = useLocalStorage<ExamConfig[]>('examPresets', []);

  const [config, setConfig] = useState<ExamConfig>({
    examType: 'full-mock',
    subjects: [],
    chapters: [],
    difficulty: 50,
    numQuestions: 50,
    tags: [],
    platform: '',
  });

  const allQuestions = useMemo((): ExamQuestion[] => 
    batches.flatMap(batch => 
      batch.questions.map(q => ({ ...q, batchId: batch.id, subject: batch.subject, chapter: batch.chapter, platform: batch.platform }))
    ), [batches]);

  const availableChapters = useMemo(() => {
    if (config.subjects.length === 0) {
      return [];
    }
    const chapters = batches
      .filter(b => config.subjects.includes(b.subject))
      .map(b => b.chapter);
    return [...new Set(chapters)];
  }, [batches, config.subjects]);

  const filteredQuestions = useMemo(() => {
    return allQuestions.filter(q => {
      const subjectMatch = config.subjects.length === 0 || config.subjects.includes(q.subject);
      if (!subjectMatch) return false;

      const platformMatch = !config.platform ||
        (config.platform === 'unattended' && !q.platform) ||
        q.platform === config.platform;
      if (!platformMatch) return false;

      const chapterMatch = config.chapters.length === 0 || config.chapters.includes(q.chapter);
      if (!chapterMatch) return false;

      const tagMatch = config.tags.length === 0 || config.tags.some(tag => {
        if (tag === 'Bookmark') return q.tags?.bookmarked;
        if (tag === 'Hard') return q.tags?.hard;
        if (tag === 'Revise') return q.tags?.revise;
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
      startExamFromContext(
        {
          questionCount: config.numQuestions,
          durationMinutes: config.numQuestions, // Defaulting to 1 min per question
          subjects: config.subjects,
          platforms: [config.platform],
          statuses: [],
        },
        sessionQuestions
      );
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
          availableChapters={availableChapters.map(c => ({ value: c, label: c }))}
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