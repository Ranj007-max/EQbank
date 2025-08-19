import { Label } from './ui/label';
import { Button } from './ui/button';
import { MultiSelect } from './ui/MultiSelect';
import { MBBS_SUBJECTS, PLATFORMS, TAGS } from '../data/constants';

export interface TreasuryFilters {
  platforms: string[];
  subjects: string[];
  chapters: string[];
  tags: string[];
  searchTerm: string;
  focusWeakAreas?: boolean; // HLPE
}

interface PremiumFilterPanelProps {
  filters: TreasuryFilters;
  onFiltersChange: (filters: Partial<TreasuryFilters>) => void;
  onReset: () => void;
  availableChapters: { value: string; label: string }[];
}

const PremiumFilterPanel: React.FC<PremiumFilterPanelProps> = ({
  filters,
  onFiltersChange,
  onReset,
  availableChapters,
}) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Filters</h2>
        <Button variant="ghost" onClick={onReset}>Reset</Button>
      </div>

      {/* Platform Filter */}
      <div className="space-y-2">
        <Label htmlFor="platform-filter">Platform</Label>
        <MultiSelect
          options={PLATFORMS.map(p => ({ value: p, label: p }))}
          selected={filters.platforms}
          onChange={(selected) => onFiltersChange({ platforms: selected })}
          className="w-full"
          placeholder="Select Platforms"
          aria-label="Select Platforms"
        />
      </div>

      {/* Subject Filter */}
      <div className="space-y-2">
        <Label htmlFor="subject-filter">Subject</Label>
        <MultiSelect
          options={MBBS_SUBJECTS.map(s => ({ value: s, label: s }))}
          selected={filters.subjects}
          onChange={(selected) => onFiltersChange({ subjects: selected })}
          className="w-full"
          placeholder="Select Subjects"
          aria-label="Select Subjects"
        />
      </div>

      {/* Chapter Filter */}
      <div className="space-y-2">
        <Label htmlFor="chapter-filter">Chapter</Label>
        <MultiSelect
          options={availableChapters}
          selected={filters.chapters}
          onChange={(selected) => onFiltersChange({ chapters: selected })}
          className="w-full"
          placeholder="Select Chapters"
          aria-label="Select Chapters"
          disabled={availableChapters.length === 0}
        />
      </div>

      {/* Tags Filter */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => {
            const isSelected = filters.tags.includes(tag);
            return (
              <Button
                key={tag}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full ${isSelected ? 'font-bold' : ''}`}
                onClick={() => {
                  const newTags = isSelected
                    ? filters.tags.filter(t => t !== tag)
                    : [...filters.tags, tag];
                  onFiltersChange({ tags: newTags });
                }}
              >
                {tag}
              </Button>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default PremiumFilterPanel;
