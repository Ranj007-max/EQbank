import { Search, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'; // HLPE
import PremiumFilterPanel from '../components/PremiumFilterPanel';
import { TreasuryFilters } from '../components/PremiumFilterPanel';
import TreasuryContent from '../components/TreasuryContent';
import { useBatches } from '../context/BatchContext';
import { useHLPE } from '../context/HLPEContext'; // HLPE
import { Button } from '../components/ui/button';
import { ExamQuestion } from '../types';

const QuestionsTreasury: React.FC = () => {
  const { batches } = useBatches();
  const { analysisResult } = useHLPE(); // HLPE
  const [filters, setFilters] = useState<TreasuryFilters>({
    platforms: [],
    subjects: [],
    chapters: [],
    tags: [],
    searchTerm: '',
    focusWeakAreas: false, // HLPE
  });
  const [sortOrder, setSortOrder] = useState('elo-desc'); // HLPE

  const allQuestions = useMemo((): ExamQuestion[] =>
    batches.flatMap(batch =>
      batch.questions.map(q => ({ ...q, batchId: batch.id, subject: batch.subject, chapter: batch.chapter, platform: batch.platform }))
    ), [batches]);

  const availableChapters = useMemo(() => {
    if (filters.subjects.length === 0) {
      return [];
    }
    const chapters = batches
      .filter(b => filters.subjects.includes(b.subject))
      .map(b => b.chapter);
    return [...new Set(chapters)].map(c => ({ value: c, label: c }));
  }, [batches, filters.subjects]);

  const filteredQuestions = useMemo(() => {
    const weakSubjects = analysisResult?.studyPlan?.map(s => s.subject) || [];

    return allQuestions.filter(q => {
      const subjectMatch = filters.subjects.length === 0 || filters.subjects.includes(q.subject);
      if (!subjectMatch) return false;

      // HLPE: Smart filter logic
      if (filters.focusWeakAreas && weakSubjects.length > 0) {
        if (!weakSubjects.includes(q.subject)) {
          return false;
        }
      }

      const platformMatch = filters.platforms.length === 0 || filters.platforms.includes(q.platform || '');
      if (!platformMatch) return false;

      const chapterMatch = filters.chapters.length === 0 || filters.chapters.includes(q.chapter);
      if (!chapterMatch) return false;

      const tagMatch = filters.tags.length === 0 || filters.tags.some(tag => {
        if (!tag) return true;
        const questionTags = q.tags || [];
        if (tag === 'Bookmark') return questionTags.includes('bookmarked');
        if (tag === 'Hard') return questionTags.includes('hard');
        if (tag === 'Revise') return questionTags.includes('revise');
        return questionTags.includes(tag);
      });
      if(!tagMatch) return false;

      const searchMatch = filters.searchTerm === '' ||
        q.question.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      if (!searchMatch) return false;

      return true;
    });
  }, [allQuestions, filters, analysisResult]);

  const sortedQuestions = useMemo(() => {
    return [...filteredQuestions].sort((a, b) => {
      switch (sortOrder) {
        case 'elo-desc':
          return (b.elo || 1000) - (a.elo || 1000);
        case 'elo-asc':
          return (a.elo || 1000) - (b.elo || 1000);
        case 'date-desc':
          // Assuming batchId can be used for date sorting, might need to be improved
          return b.batchId.localeCompare(a.batchId);
        case 'date-asc':
          return a.batchId.localeCompare(b.batchId);
        default:
          return 0;
      }
    });
  }, [filteredQuestions, sortOrder]);

  const handleFiltersChange = (newFilters: Partial<TreasuryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      platforms: [],
      subjects: [],
      chapters: [],
      tags: [],
      searchTerm: '',
    });
  };

  const totalQuestions = useMemo(() => allQuestions.length, [allQuestions]);
  const uniqueSubjects = useMemo(() => new Set(allQuestions.map(q => q.subject)).size, [allQuestions]);

  const exportToCsv = () => {
    const headers = ['ID', 'Question', 'Subject', 'Chapter', 'Platform'];
    const rows = filteredQuestions.map(q => [q.id, `"${q.question}"`, q.subject, q.chapter, q.platform]);
    let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "filtered_questions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="animate-fade-zoom-in space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter gradient-text">
            Questions Treasury
          </h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl">
            Analyze your question bank with powerful filters and visualizations.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              className="pl-10 neumorphic-input"
              value={filters.searchTerm}
              onChange={(e) => handleFiltersChange({ searchTerm: e.target.value })}
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-[220px] neumorphic-button">
                  <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="elo-desc">Sort by Elo (Hardest)</SelectItem>
                  <SelectItem value="elo-asc">Sort by Elo (Easiest)</SelectItem>
                  <SelectItem value="date-desc">Date Added (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date Added (Oldest)</SelectItem>
              </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
          <PremiumFilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
            availableChapters={availableChapters}
          />
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <TreasuryContent questions={sortedQuestions} />
        </main>
      </div>

      <footer className="flex justify-between items-center text-muted-foreground text-sm">
        <span>Total MCQs: {totalQuestions} | Unique Subjects: {uniqueSubjects}</span>
        <Button variant="outline" onClick={exportToCsv} className="neumorphic-button">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </footer>
    </div>
  );
};

export default QuestionsTreasury;
