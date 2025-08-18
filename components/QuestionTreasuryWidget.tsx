
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { Progress } from './ui/progress';

interface StatItem {
  name: string;
  total: number;
  attempted: number;
}

interface QuestionTreasuryWidgetProps {
  statsByPlatform: StatItem[];
  statsBySubject: StatItem[];
  statsByChapter: StatItem[];
}

const StatTable: React.FC<{ title: string; data: StatItem[] }> = ({ title, data }) => {
  if (!data || data.length === 0) {
    return (
      <div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground">No data available.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = item.total > 0 ? (item.attempted / item.total) * 100 : 0;
          return (
            <div key={index} className="transition-all duration-300 ease-in-out p-3 rounded-lg hover:bg-white/10">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium truncate pr-4">{item.name}</span>
                <span className="text-sm text-muted-foreground">{item.attempted} / {item.total}</span>
              </div>
              <Progress value={percentage} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const QuestionTreasuryWidget: React.FC<QuestionTreasuryWidgetProps> = ({
  statsByPlatform,
  statsBySubject,
  statsByChapter,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className={cn("glass-card", "glow-border")}>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle className="flex items-center text-2xl">
          <Database size={24} className="mr-3 text-primary" />
          Question Treasury
        </CardTitle>
        <Button variant="ghost" className="btn-premium-label text-sm">
            {isOpen ? 'Collapse' : 'Expand'}
        </Button>
      </CardHeader>
      <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <CardContent className="grid md:grid-cols-3 gap-8 pt-4">
          <StatTable title="By Platform" data={statsByPlatform} />
          <StatTable title="By Subject" data={statsBySubject} />
          <StatTable title="By Chapter" data={statsByChapter} />
        </CardContent>
      </div>
    </Card>
  );
};
