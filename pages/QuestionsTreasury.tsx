import { Search, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Input } from '../components/ui/input';
import TreasuryFilterSidebar, { TreasuryFilters } from '../components/TreasuryFilterSidebar';
import TreasuryContent from '../components/TreasuryContent';
import { useBatches } from '../context/BatchContext';
import { Button } from '../components/ui/button';
import { ExamQuestion } from '../types';

const QuestionsTreasury: React.FC = () => {
  const { batches } = useBatches();
  const [filters, setFilters] = useState<TreasuryFilters>({
    platforms: [],
    subjects: [],
    chapters: [],
    tags: [],
    searchTerm: '',
  });

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
    return allQuestions.filter(q => {
      const subjectMatch = filters.subjects.length === 0 || filters.subjects.includes(q.subject);
      if (!subjectMatch) return false;

      const platformMatch = filters.platforms.length === 0 || filters.platforms.includes(q.platform || '');
      if (!platformMatch) return false;

      const chapterMatch = filters.chapters.length === 0 || filters.chapters.includes(q.chapter);
      if (!chapterMatch) return false;

      const tagMatch = filters.tags.length === 0 || filters.tags.every(tag => {
        if (!tag) return true;
        if (tag === 'Bookmark') return q.tags?.bookmarked;
        if (tag === 'Hard') return q.tags?.hard;
        if (tag === 'Revise') return q.tags?.revise;
        return (q.tags ? Object.keys(q.tags).includes(tag) : false);
      });
      if(!tagMatch) return false;

      const searchMatch = filters.searchTerm === '' ||
        q.question.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      if (!searchMatch) return false;

      return true;
    });
  }, [allQuestions, filters]);

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
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            className="pl-10 neumorphic-input"
            value={filters.searchTerm}
            onChange={(e) => handleFiltersChange({ searchTerm: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
          <TreasuryFilterSidebar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onApply={() => {}}
            onReset={handleResetFilters}
            availableChapters={availableChapters}
          />
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <TreasuryContent questions={filteredQuestions} />
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
