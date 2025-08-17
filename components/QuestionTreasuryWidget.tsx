import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';

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
          <div key={index} className="grid grid-cols-3 p-2 border-t">
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question Treasury</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StatTable title="By Platform" data={statsByPlatform} />
        <Separator />
        <StatTable title="By Subject" data={statsBySubject} />
        <Separator />
        <StatTable title="By Chapter" data={statsByChapter} />
      </CardContent>
    </Card>
  );
};
