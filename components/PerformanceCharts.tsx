import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  Bar,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TimeData {
  date: string;
  score: number;
}

interface SubjectData {
  subject: string;
  accuracy: number;
}

interface PerformanceChartsProps {
  timeData: TimeData[];
  subjectData: SubjectData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border rounded-md shadow-lg">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-primary">{`${payload[0].name}: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ timeData, subjectData }) => {
  const { theme } = useTheme();
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'; // hsl(215 20.2% 65.1%) : hsl(222.2 47.4% 11.2%)
  const gridColor = 'hsl(var(--border))';
  const primaryColor = 'hsl(var(--primary))';


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BarChart3 size={22} />
            Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeData.length === 0 && subjectData.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
                <p>Complete a few sessions to see your performance analytics.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-80">
                <h4 className="font-semibold text-center text-muted-foreground mb-2">Performance Over Time</h4>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke={axisColor} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisColor} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Line type="monotone" dataKey="score" stroke={primaryColor} strokeWidth={2} dot={{ r: 4, fill: primaryColor }} activeDot={{ r: 6 }} name="Score"/>
                </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="h-80">
                <h4 className="font-semibold text-center text-muted-foreground mb-2">Performance By Subject</h4>
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} stroke={axisColor} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} stroke={axisColor} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar dataKey="accuracy" fill={primaryColor} name="Accuracy"/>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};