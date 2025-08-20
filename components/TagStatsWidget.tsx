import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Bookmark, AlertTriangle, Tag as TagIcon, Star, History, Image, Heart, RefreshCw } from 'lucide-react';
import { getTagStats } from '../services/dataService';
import { eventBus, APP_EVENTS } from '../lib/events';
import { cn } from '../lib/utils';

interface TagStat {
  tag: string;
  count: number;
}

const tagConfig: { [key: string]: { icon: React.ElementType; label: string } } = {
  bookmarked: { icon: Bookmark, label: 'Bookmarked' },
  mistaked: { icon: AlertTriangle, label: 'Mistaked' },
  'high-yield': { icon: Star, label: 'High-Yield' },
  pyq: { icon: History, label: 'PYQ' },
  'image-based': { icon: Image, label: 'Image Based' },
  hard: { icon: Heart, label: 'Hard' },
  revise: { icon: RefreshCw, label: 'Revise' },
  default: { icon: TagIcon, label: 'Tag' },
};

const getTagConfig = (tag: string) => {
    const normalizedTag = tag.toLowerCase();
    return tagConfig[normalizedTag] || { ...tagConfig.default, label: tag.charAt(0).toUpperCase() + tag.slice(1) };
};

interface TagStatsWidgetProps {
  onTagSelect: (tag: string | null) => void;
  activeTag: string | null;
}

export const TagStatsWidget: React.FC<TagStatsWidgetProps> = ({ onTagSelect, activeTag }) => {
  const [stats, setStats] = useState<TagStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    let tagStats = await getTagStats();
    // Ensure all important tags are present, even if count is 0
    const importantTags = ['bookmarked', 'hard', 'revise', 'mistaked'];
    importantTags.forEach(it => {
      if (!tagStats.find(st => st.tag === it)) {
        tagStats.push({ tag: it, count: 0 });
      }
    });
    setStats(tagStats);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    const unsubscribe = eventBus.subscribe(APP_EVENTS.MCQ_UPDATED, fetchStats);
    return () => unsubscribe();
  }, [fetchStats]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <TagIcon size={24} className="mr-3 text-primary" />
          Tagged Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="text-center p-8">Loading stats...</div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {stats.map(({ tag, count }) => {
                const config = getTagConfig(tag);
                const Icon = config.icon;
                const isActive = activeTag === tag;

                return (
                <div
                  key={tag}
                  onClick={() => onTagSelect(isActive ? null : tag)}
                  className={cn(
                    "block p-4 bg-muted/30 rounded-lg transition-all hover:bg-muted/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer",
                    isActive && "bg-primary/20 ring-2 ring-primary"
                  )}
                >
                    <div className={cn(
                      "flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border border-primary/20",
                      isActive && "bg-primary/20"
                    )}>
                      <Icon className={cn("h-8 w-8 text-primary", tag === 'bookmarked' && 'text-yellow-400', tag === 'hard' && 'text-red-500')} />
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                </div>
                );
            })}
            </div>
        )}
      </CardContent>
    </Card>
  );
};
