import { Chip } from './ui/chip';
import { Label } from './ui/label';

interface BankFilterPanelProps {
  onFilterChange: (filterType: string, value: string | null) => void;
  activeFilters: Record<string, any>;
}

const statusFilters = ['Answered', 'Unanswered', 'Correct', 'Incorrect'];
const difficultyFilters = ['Easy', 'Medium', 'Hard'];

const BankFilterPanel: React.FC<BankFilterPanelProps> = ({ onFilterChange, activeFilters }) => {
  const handleFilterClick = (filterType: string, value: string) => {
    onFilterChange(filterType, activeFilters[filterType] === value ? null : value);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Label className="font-bold text-lg">Status:</Label>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(status => (
            <Chip
              key={status}
              isSelected={activeFilters.status === status}
              onClick={() => handleFilterClick('status', status)}
            >
              {status}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Label className="font-bold text-lg">Difficulty:</Label>
        <div className="flex flex-wrap gap-2">
          {difficultyFilters.map(difficulty => (
            <Chip
              key={difficulty}
              isSelected={activeFilters.difficulty === difficulty}
              onClick={() => handleFilterClick('difficulty', difficulty)}
            >
              {difficulty}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankFilterPanel;
