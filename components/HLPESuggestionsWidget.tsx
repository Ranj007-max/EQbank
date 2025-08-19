import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { StudyRecommendation } from '../hlpe/hlpeEngine.worker';
import { Lightbulb, Book } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

interface HLPESuggestionsWidgetProps {
    studyPlan?: StudyRecommendation[];
}

export const HLPESuggestionsWidget: React.FC<HLPESuggestionsWidgetProps> = ({ studyPlan }) => {
    if (!studyPlan || studyPlan.length === 0) {
        return null; // Don't render if there are no suggestions
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="text-primary" />
                    <span>HLPE Suggestions</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Based on your performance, our engine suggests focusing on these areas:
                </p>
                <ul className="space-y-2">
                    {studyPlan.map((rec) => (
                        <li key={rec.subject} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <span className="font-semibold">{rec.subject}</span>
                            <Button size="sm" variant="ghost" asChild>
                                <Link to={`/bank/treasury?subject=${rec.subject}`}>
                                    <Book className="mr-2 h-4 w-4" />
                                    Study
                                </Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};
