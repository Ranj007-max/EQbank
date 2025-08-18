import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bookmark, Flame, AlertTriangle, RefreshCw, Tag as TagIcon, Star, CaseSensitive, History } from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Link } from 'react-router-dom';
import { Tag } from '../types';

const tagConfig: { [key in Tag]: { icon: React.ElementType; label: string } } = {
  bookmarked: { icon: Bookmark, label: 'Bookmarked' },
  hard: { icon: Flame, label: 'Hard' },
  revise: { icon: RefreshCw, label: 'Revise' },
  mistaked: { icon: AlertTriangle, label: 'Mistaked' },
  highYield: { icon: Star, label: 'High-Yield' },
  caseBased: { icon: CaseSensitive, label: 'Case-Based' },
  pyq: { icon: History, label: 'PYQ' },
};

export const TagStatsWidget = () => {
  const { tagStats } = useAnalytics();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <TagIcon size={24} className="mr-3 text-primary" />
          Tagged Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(tagStats).map(([tag, count]) => {
            const config = tagConfig[tag as Tag];
            if (!config) return null;
            const Icon = config.icon;

            return (
              <Link to={`/bank/tagged/${tag}`} key={tag} className="block p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary">
                <div
                  className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full"
                  style={{
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    boxShadow: '0 0 15px 5px rgba(255, 215, 0, 0.3), inset 0 0 5px 1px rgba(255, 215, 0, 0.5)',
                    border: '1px solid rgba(255, 215, 0, 0.6)'
                  }}
                >
                  <Icon className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
