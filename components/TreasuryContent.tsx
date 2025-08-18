import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from './ui/button';
import QuestionDrillDownView from './QuestionDrillDownView';
import { useBatches } from '../context/BatchContext';
import { MCQ } from '../types';

const COLORS = ['#00A8FF', '#00FF85', '#FFC700', '#FF5733', '#C70039'];

const TreasuryContent = () => {
  const [activeTab, setActiveTab] = useState('subject');
  const { batches } = useBatches();

  const statsBySubject = useMemo(() => {
    const stats: { [key: string]: { name: string; total: number; attempted: number } } = {};
    batches.forEach(batch => {
      const key = batch.subject;
      if (!stats[key]) stats[key] = { name: key, total: 0, attempted: 0 };
      stats[key].total += batch.questions.length;
      stats[key].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [batches]);

  const statsByPlatform = useMemo(() => {
    const stats: { [key: string]: { name: string; total: number; attempted: number } } = {};
    batches.forEach(batch => {
      const key = batch.platform;
      if (!stats[key]) stats[key] = { name: key, total: 0, attempted: 0 };
      stats[key].total += batch.questions.length;
      stats[key].attempted += batch.questions.filter(q => q.lastAttemptCorrect !== null).length;
    });
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [batches]);

  const getQuestionsBySubject = (subject: string): MCQ[] => {
    return batches.filter(b => b.subject === subject).flatMap(b => b.questions);
  }

  const getQuestionsByPlatform = (platform: string): MCQ[] => {
    return batches.filter(b => b.platform === platform).flatMap(b => b.questions);
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center border-b border-white/10">
            <TabButton title="By Subject" isActive={activeTab === 'subject'} onClick={() => setActiveTab('subject')} />
            <TabButton title="By Platform" isActive={activeTab === 'platform'} onClick={() => setActiveTab('platform')} />
            <TabButton title="By Chapter" isActive={activeTab === 'chapter'} onClick={() => setActiveTab('chapter')} />
            <TabButton title="By Tags" isActive={activeTab === 'tags'} onClick={() => setActiveTab('tags')} />
        </div>
        <div className="animate-fade-in">
            {activeTab === 'subject' && <SubjectVault data={statsBySubject} getQuestions={getQuestionsBySubject} />}
            {activeTab === 'platform' && <PlatformVault data={statsByPlatform} getQuestions={getQuestionsByPlatform} />}
        </div>
    </div>
  );
};

interface TabButtonProps {
    title: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onClick }) => (
    <Button
        variant="ghost"
        onClick={onClick}
        className={`px-6 py-3 font-bold text-lg rounded-none transition-all duration-300 ${isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
    >
        {title}
    </Button>
);

interface VaultProps {
    data: Array<{ name: string; total: number; attempted: number; }>;
    getQuestions: (name: string) => MCQ[];
}

const SubjectVault: React.FC<VaultProps> = ({ data, getQuestions }) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
            <h3 className="text-xl font-bold mb-4">Rankings by Subject</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.2)" />
                    <XAxis type="number" dataKey="total" />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" barSize={20} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Top 5 Subjects</h3>
            <div className="space-y-4">
                {data.slice(0, 5).map((subject, index) => (
                    <QuestionDrillDownView
                        key={subject.name}
                        title={`Questions for ${subject.name}`}
                        questions={getQuestions(subject.name)}
                        trigger={
                            <div className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-muted/50 cursor-pointer">
                                <span className="font-bold text-lg">#{index + 1}: {subject.name}</span>
                                <span className="text-primary font-bold text-xl">{subject.total} MCQs</span>
                            </div>
                        }
                    />
                ))}
            </div>
        </div>
    </div>
);

const PlatformVault: React.FC<VaultProps> = ({ data, getQuestions }) => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-[400px]">
            <h3 className="text-xl font-bold mb-4">Distribution by Platform</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#8884d8">
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Platform Counts</h3>
            <div className="space-y-4">
                {data.map((platform, index) => (
                     <QuestionDrillDownView
                        key={platform.name}
                        title={`Questions for ${platform.name}`}
                        questions={getQuestions(platform.name)}
                        trigger={
                            <div key={platform.name} className="flex items-center justify-between p-4 rounded-lg bg-card hover:bg-muted/50 cursor-pointer">
                                <span className="font-bold text-lg">#{index + 1}: {platform.name}</span>
                                <span className="text-primary font-bold text-xl">{platform.total} MCQs</span>
                            </div>
                        }
                    />
                ))}
            </div>
        </div>
    </div>
);


export default TreasuryContent;
