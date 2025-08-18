import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { PlusCircle, Zap, Download, Upload, Search, Book } from 'lucide-react';
import StudyPanel from '../components/StudyPanel';
import { QuestionTreasuryWidget } from '../components/QuestionTreasuryWidget';
import { Button } from '../components/ui/button';
import { AppData } from '../types';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { TagStatsWidget } from '../components/TagStatsWidget';

const BankDashboard: React.FC = () => {
  const { 
    batches,
    exportData,
    importData
  } = useAnalytics();
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('date-desc');

  // Placeholder for filters state
  // const [activeFilters, setActiveFilters] = useState({});

  const filteredQuestions = useMemo(() => {
    const allQuestionsWithBatchInfo = batches.flatMap(b => b.questions.map(q => ({
        ...q,
        batchCreatedAt: b.createdAt,
    })));

    let filtered = allQuestionsWithBatchInfo.filter(q =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // TODO: Add logic for activeFilters here

    const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

    filtered.sort((a, b) => {
        switch (sortOrder) {
            case 'date-asc':
                return new Date(a.batchCreatedAt).getTime() - new Date(b.batchCreatedAt).getTime();
            case 'difficulty-asc':
                return difficultyMap[a.difficulty] - difficultyMap[b.difficulty];
            case 'difficulty-desc':
                return difficultyMap[b.difficulty] - difficultyMap[a.difficulty];
            case 'accuracy-asc':
                return (a.lastAttemptCorrect === true ? 1 : 0) - (b.lastAttemptCorrect === true ? 1 : 0);
            case 'accuracy-desc':
                return (b.lastAttemptCorrect === true ? 1 : 0) - (a.lastAttemptCorrect === true ? 1 : 0);
            case 'date-desc':
            default:
                return new Date(b.batchCreatedAt).getTime() - new Date(a.batchCreatedAt).getTime();
        }
    });

    return filtered;
  }, [batches, searchQuery, sortOrder]);


  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const jsonData = JSON.parse(text) as AppData;
            importData(jsonData);
          }
        } catch (error) {
          console.error("Failed to parse JSON file:", error);
          alert("Error: Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <StudyPanel isOpen={isPanelOpen} onOpenChange={setIsPanelOpen} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />
      
      <div className="animate-fade-in space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter gradient-text">
              Question Treasury
            </h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-2xl">
              Your structured library for all questions. Filter, sort, and review with precision.
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 mt-2">
            <div className="flex flex-wrap items-center gap-4">
                <Button variant="outline" className="glass-card" onClick={handleImportClick}>
                  <Upload size={18} className="mr-2" />
                  Import
                </Button>
                <Button variant="outline" className="glass-card" onClick={exportData}>
                  <Download size={18} className="mr-2" />
                  Export
                </Button>
                <Button variant="outline" asChild className="glass-card">
                  <Link to="/bank/add">
                    <PlusCircle size={18} className="mr-2" />
                    Add Questions
                  </Link>
                </Button>
                <Button onClick={() => setIsPanelOpen(true)} className="btn-gradient rounded-full">
                  <Zap size={18} className="mr-2" />
                  Start Study Session
                </Button>
            </div>
            <Button
                asChild
                className="w-[200px] rounded-[24px] text-lg font-bold neumorphic-button mt-4"
                style={{ fontFamily: '"SF Pro Display", sans-serif' }}
                onClick={() => {
                    if (navigator.vibrate) {
                        navigator.vibrate([10]);
                    }
                }}
            >
                <Link to="/bank/treasury">
                    <Book size={24} className="mr-2" />
                    Enter Treasury
                </Link>
            </Button>
          </div>
        </div>
      
        <div className="space-y-8">
          <TagStatsWidget />

          {/* Main Content Area */}
          <main className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date Added (Newest)</SelectItem>
                        <SelectItem value="date-asc">Date Added (Oldest)</SelectItem>
                        <SelectItem value="difficulty-desc">Difficulty (Hardest)</SelectItem>
                        <SelectItem value="difficulty-asc">Difficulty (Easiest)</SelectItem>
                        <SelectItem value="accuracy-asc">Accuracy (Lowest)</SelectItem>
                        <SelectItem value="accuracy-desc">Accuracy (Highest)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <QuestionTreasuryWidget
                questions={filteredQuestions}
              />
          </main>
        </div>
      </div>
    </>
  );
};

export default BankDashboard;