import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Batch } from '../types';
import { Label } from './ui/label';
import { MultiSelect } from './ui/MultiSelect';
import { Button } from './ui/button';
import { useUI } from '../context/UIContext';
import { FilterButtonGroup } from './ui/FilterButtonGroup';

interface TreasuryFiltersProps {
    // onFilterChange: (filters: any) => void;
}

export const TreasuryFilters: React.FC<TreasuryFiltersProps> = () => {
  const { statsBySubject, statsByPlatform, batches } = useAnalytics();
  const { state: uiState, dispatch } = useUI();

  const availableSubjects = statsBySubject.map((s: { name: string }) => ({ value: s.name, label: s.name }));
  const availablePlatforms = statsByPlatform.map((p: { name:string }) => ({ value: p.name, label: p.name }));
  const availableChapters = [...new Set(batches.map((b: Batch) => b.chapter))].map(c => ({ value: c, label: c }));

  // Local state for multiselects - can be moved to UIContext if needed globally
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const difficultyOptions = [
    { id: 'difficulty-easy', label: 'Easy' },
    { id: 'difficulty-medium', label: 'Medium' },
    { id: 'difficulty-hard', label: 'Hard' },
  ];

  const questionTypeOptions = [
      { id: 'qtype-mcq', label: 'MCQ' },
      { id: 'qtype-ar', label: 'Assertion-Reason' },
      { id: 'qtype-case', label: 'Case-based' },
  ];

  const commonTagOptions = [
      { id: 'tag-high-yield', label: 'High Yield' },
      { id: 'tag-pyq', label: 'PYQ' },
      { id: 'tag-bookmarked', label: 'Bookmarked' },
      { id: 'tag-mistaked', label: 'Mistaked' },
  ];

  const handleResetFilters = () => {
    // This should be more robust, clearing all related state.
    // For now, we just clear the tags from the global state.
    const allTagIds = [...difficultyOptions, ...questionTypeOptions, ...commonTagOptions].map(o => o.id);
    const clearedState = {
        ...uiState,
        selectedTagIds: uiState.selectedTagIds.filter(id => !allTagIds.includes(id)),
    };
    dispatch({ type: 'SET_STATE', payload: clearedState });
    setSelectedSubjects([]);
    setSelectedPlatforms([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* MultiSelects remain for now */}
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

        <FilterButtonGroup title="Difficulty" options={difficultyOptions} tagGroup="filters" />
        <FilterButtonGroup title="Question Type" options={questionTypeOptions} tagGroup="filters" />
        <FilterButtonGroup title="Tags" options={commonTagOptions} tagGroup="filters" selectionLimit={5} />

        <Button className="w-full">Apply Filters</Button>
        <Button variant="link" className="w-full" onClick={handleResetFilters}>Reset Filters</Button>
      </CardContent>
    </Card>
  );
};
