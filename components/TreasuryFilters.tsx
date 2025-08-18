import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Batch } from '../types';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { MultiSelect } from './ui/MultiSelect';
import { Button } from './ui/button';

// This will be expanded to pass filter state up to the parent
interface TreasuryFiltersProps {
    // onFilterChange: (filters: any) => void;
}

export const TreasuryFilters: React.FC<TreasuryFiltersProps> = () => {
  const { statsBySubject, statsByPlatform, batches } = useAnalytics();

  const availableSubjects = statsBySubject.map((s: { name: string }) => ({ value: s.name, label: s.name }));
  const availablePlatforms = statsByPlatform.map((p: { name:string }) => ({ value: p.name, label: p.name }));
  // This is a simplified version. A better implementation would have chapters dependent on the selected subject.
  const availableChapters = [...new Set(batches.map((b: Batch) => b.chapter))].map(c => ({ value: c, label: c }));

  // Placeholder state for filters
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Subject</Label>
          <MultiSelect
            options={availableSubjects}
            selected={selectedSubjects}
            onChange={setSelectedSubjects}
            placeholder="Select subjects..."
          />
        </div>
        <div className="space-y-2">
          <Label>Chapter</Label>
          <MultiSelect
            options={availableChapters}
            selected={[]} // Placeholder
            onChange={() => {}} // Placeholder
            placeholder="Select chapters..."
          />
        </div>
        <div className="space-y-2">
          <Label>Platform</Label>
           <MultiSelect
            options={availablePlatforms}
            selected={selectedPlatforms}
            onChange={setSelectedPlatforms}
            placeholder="Select platforms..."
          />
        </div>
        <div className="space-y-2">
            <Label>Difficulty</Label>
            <div className="flex flex-col space-y-2 pt-1">
                <div className="flex items-center space-x-2"><Checkbox id="diff-easy" /><Label htmlFor="diff-easy" className="font-normal">Easy</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="diff-medium" /><Label htmlFor="diff-medium" className="font-normal">Medium</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="diff-hard" /><Label htmlFor="diff-hard" className="font-normal">Hard</Label></div>
            </div>
        </div>
        <div className="space-y-2">
            <Label>Question Type</Label>
            <div className="flex flex-col space-y-2 pt-1">
                <div className="flex items-center space-x-2"><Checkbox id="type-mcq" /><Label htmlFor="type-mcq" className="font-normal">MCQ</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="type-ar" /><Label htmlFor="type-ar" className="font-normal">Assertion-Reason</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="type-case" /><Label htmlFor="type-case" className="font-normal">Case-based</Label></div>
            </div>
        </div>
        <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-col space-y-2 pt-1">
                <div className="flex items-center space-x-2"><Checkbox id="tag-hy" /><Label htmlFor="tag-hy" className="font-normal">High Yield</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="tag-pyq" /><Label htmlFor="tag-pyq" className="font-normal">Past Year Question</Label></div>
                <div className="flex items-center space-x-2"><Checkbox id="tag-cb" /><Label htmlFor="tag-cb" className="font-normal">Case Based</Label></div>
            </div>
        </div>
        <Button className="w-full">Apply Filters</Button>
        <Button variant="link" className="w-full">Reset Filters</Button>
      </CardContent>
    </Card>
  );
};
