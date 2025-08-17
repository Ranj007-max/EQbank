import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnalytics } from '../context/AnalyticsContext';
import { PlusCircle, FileText, Clock, Pencil, Zap, Lightbulb, History, BookCopy, ChevronRight, Database, Upload, Download } from 'lucide-react';
import { Batch, AppData } from '../types';
import StudyPanel from '../components/StudyPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from '../components/ui/dialog';
import { Label } from '../components/ui/label';


const BankOverviewWidget: React.FC = () => {
  const { overallStats, statsBySubject, statsByPlatform } = useAnalytics();

  const StatList: React.FC<{ title: string; data: Array<{ name: string; total: number; attempted: number; }> }> = ({ title, data }) => (
    <div>
      <h4 className="font-semibold text-foreground mb-2">{title}</h4>
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
        {data.length > 0 ? data.map(item => (
          <div key={item.name}>
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="text-muted-foreground">{item.attempted} / {item.total}</span>
            </div>
            <Progress value={item.total > 0 ? (item.attempted / item.total) * 100 : 0} />
          </div>
        )) : <p className="text-sm text-muted-foreground">No data yet.</p>}
      </div>
    </div>
  );

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database size={22} /> Bank Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 flex flex-col justify-center items-center bg-muted/50 p-6 rounded-lg">
                    <p className="text-5xl font-bold text-primary">{overallStats.totalQuestions}</p>
                    <p className="text-lg font-medium text-muted-foreground mt-1">Total Questions</p>
                    <p className="text-sm text-slate-500 mt-2">{overallStats.attemptedQuestions} attempted</p>
                </div>
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatList title="By Subject" data={statsBySubject} />
                    <StatList title="By Platform" data={statsByPlatform} />
                </div>
            </div>
        </CardContent>
    </Card>
  );
};

const WidgetCard: React.FC<{title: string; icon: React.ElementType; children: React.ReactNode}> = ({ title, icon: Icon, children }) => (
    <Card>
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Icon size={18} className="text-muted-foreground" />
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
)

const RecentActivityWidget = ({ batches }: { batches: Batch[] }) => (
  <WidgetCard title="Batch Imports" icon={BookCopy}>
    <div className="space-y-3 text-sm">
      {batches.slice(0, 4).map(batch => (
        <div key={batch.id} className="text-muted-foreground">
          <p className="font-medium text-foreground">Added {batch.questions.length} questions</p>
          <p className="text-xs">{batch.name}</p>
        </div>
      ))}
       {batches.length === 0 && <p className="text-xs text-muted-foreground">No batches imported yet.</p>}
    </div>
  </WidgetCard>
);

const LastSessionWidget: React.FC = () => {
    const { lastSession } = useAnalytics();
    return (
        <WidgetCard title="Last Session" icon={History}>
             {lastSession ? (
                <div className="text-sm space-y-2">
                    <p className="font-bold text-2xl text-primary">{lastSession.data.score}% <span className="text-base font-medium text-muted-foreground">({lastSession.data.accuracy})</span></p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Type:</span> <span className="capitalize">{lastSession.type}</span></p>
                    <p className="text-muted-foreground"><span className="font-medium text-foreground">Date:</span> {new Date(lastSession.data.createdAt).toLocaleDateString()}</p>
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted-foreground">No sessions completed yet.</p>
            )}
        </WidgetCard>
    );
};


const TopicsToWatchWidget: React.FC = () => {
  const { topicsToWatch } = useAnalytics();
  return (
    <WidgetCard title="Topics to Watch" icon={Lightbulb}>
      <div className="space-y-2 text-sm">
        {topicsToWatch.length > 0 ? topicsToWatch.map(topic => (
          <p key={topic.subject} className="text-muted-foreground flex justify-between items-center">
            {topic.subject} 
            <span className={`font-bold ${topic.accuracy < 60 ? 'text-red-500' : 'text-amber-500'}`}>{topic.accuracy}%</span>
          </p>
        )) : <p className="text-muted-foreground">Complete more questions to see your topics to watch.</p>}
      </div>
    </WidgetCard>
  );
};

const DataManagementWidget: React.FC = () => {
    const { exportData, importData } = useAnalytics();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('Are you sure you want to import this data? This will overwrite all existing questions and session history.')) {
            if(fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                const jsonData = JSON.parse(text) as AppData;
                importData(jsonData);
            } catch (error) {
                console.error("Import failed:", error);
                alert('Failed to parse the JSON file. Please ensure it is a valid PgQbank backup.');
            } finally {
                 if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Backup your data or import a previous backup file. Importing will overwrite all current data.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={exportData} className="flex-1">
                    <Upload size={20} className="mr-2" />
                    Export App Data
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".json"
                    className="hidden"
                />
                <Button onClick={handleImportClick} variant="secondary" className="flex-1">
                    <Download size={20} className="mr-2" />
                    Import App Data
                </Button>
            </CardContent>
        </Card>
    );
}

const BankDashboard: React.FC = () => {
  const { batches, updateBatch } = useAnalytics();
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleEditClick = (batch: Batch) => {
    setEditingBatch(batch);
    setEditingName(batch.name);
  };

  const handleSaveName = () => {
    if (editingBatch && editingName.trim()) {
      updateBatch({ ...editingBatch, name: editingName.trim() });
    }
    setEditingBatch(null);
  };

  return (
    <>
    <StudyPanel isOpen={isPanelOpen} onOpenChange={setIsPanelOpen} />
    <Dialog open={!!editingBatch} onOpenChange={(isOpen) => !isOpen && setEditingBatch(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Batch Name</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="batch-name" className="text-right">Name</Label>
                    <Input id="batch-name" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleSaveName}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-bold gradient-text">Question Bank</h1>
          <p className="text-muted-foreground mt-1">Manage batches, analyze your progress, and launch study sessions.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/bank/add">
              <PlusCircle size={20} className="mr-2" />
              Add Questions
            </Link>
          </Button>
          <Button onClick={() => setIsPanelOpen(true)}>
            <Zap size={20} className="mr-2" />
            Start New Study Session
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BankOverviewWidget />
          <RecentActivityWidget batches={batches} />
          <LastSessionWidget />
          <TopicsToWatchWidget />
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Imported Batches</CardTitle>
        </CardHeader>
        <CardContent>
            {batches.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
                <p className="text-lg">Your question bank is empty.</p>
                <p className="mt-2">Click 'Add Questions' to import your first batch.</p>
            </div>
            ) : (
            <div className="space-y-4">
                {batches.map(batch => (
                <div
                    key={batch.id}
                    className="group bg-background p-4 rounded-lg border hover:border-primary transition-all flex items-center justify-between"
                >
                    <div className="flex-grow cursor-pointer" onClick={() => navigate(`/bank/batch/${batch.id}`)}>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{batch.name}</h2>
                            <Pencil
                                className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); handleEditClick(batch); }}
                            />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5"><FileText size={14} /> {batch.questions.length} Questions</span>
                            <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(batch.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                ))}
            </div>
            )}
        </CardContent>
      </Card>
      <DataManagementWidget />
    </div>
    </>
  );
};

export default BankDashboard;