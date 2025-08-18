import { Search, Download } from 'lucide-react';
import { Input } from '../components/ui/input';
import TreasuryFilterSidebar from '../components/TreasuryFilterSidebar';
import TreasuryContent from '../components/TreasuryContent';
import { useAnalytics } from '../context/AnalyticsContext';
import { Button } from '../components/ui/button';

const QuestionsTreasury: React.FC = () => {
  const { overallStats, statsBySubject } = useAnalytics();

  const exportToCsv = () => {
    const headers = ['Subject', 'Total MCQs'];
    const rows = statsBySubject.map(s => [s.name, s.total]);
    let csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "question_treasury_stats.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="animate-fade-zoom-in space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter gradient-text">
            Questions Treasury: Bird's-Eye View
          </h1>
          <p className="text-muted-foreground mt-4 text-lg max-w-2xl">
            Analyze your question bank with powerful filters and visualizations.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search aggregates..."
            className="pl-10 neumorphic-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sidebar for Filters */}
        <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-6">
          <TreasuryFilterSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-6">
          <TreasuryContent />
        </main>
      </div>

      <footer className="flex justify-between items-center text-muted-foreground text-sm">
        <span>Total MCQs: {overallStats.totalQuestions} | Unique Subjects: {statsBySubject.length}</span>
        <Button variant="outline" onClick={exportToCsv} className="neumorphic-button">
          <Download className="mr-2 h-4 w-4" />
          Export to CSV
        </Button>
      </footer>
    </div>
  );
};

export default QuestionsTreasury;
