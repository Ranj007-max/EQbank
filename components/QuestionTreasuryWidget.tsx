
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';


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

const StatTable: React.FC<{ title: string; data: StatItem[] }> = ({ title, data }) => (
  <div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="rounded-md border">
      <div className="grid grid-cols-3 p-2 font-semibold bg-muted/50">
        <div>Name</div>
        <div className="text-right">Attempted</div>
        <div className="text-right">Total</div>
      </div>
      <div className="max-h-60 overflow-y-auto">
        {data.map((item, index) => (

          <div key={index} className="grid grid-cols-3 p-2 border-t hover:bg-muted/50 transition-colors">

            <div className="truncate pr-2">{item.name}</div>
            <div className="text-right">{item.attempted}</div>
            <div className="text-right">{item.total}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const QuestionTreasuryWidget: React.FC<QuestionTreasuryWidgetProps> = ({
  statsByPlatform,
  statsBySubject,
  statsByChapter,
}) => {

  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CardTitle>Question Treasury</CardTitle>
        <Button variant="ghost" size="icon">
          <ChevronDown className={cn("transition-transform duration-300", !isOpen && "-rotate-90")} />
        </Button>
      </CardHeader>
      <div className={cn(
          "transition-all duration-500 ease-in-out overflow-hidden",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-50"
      )}>
        <CardContent className="space-y-6 pt-4">
          <StatTable title="By Platform" data={statsByPlatform} />
          <Separator />
          <StatTable title="By Subject" data={statsBySubject} />
          <Separator />
          <StatTable title="By Chapter" data={statsByChapter} />
        </CardContent>
      </div>

    </Card>
  );
};
