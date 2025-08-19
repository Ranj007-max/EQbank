import React from 'react';
import { useUI } from '../../context/UIContext';
import { Button } from './button';
import { Label } from './label';

interface FilterButtonGroupProps {
  title: string;
  options: { id: string, label: string }[];
  /** A prefix to identify a unique group of tags in the global state */
  tagGroup: string;
  selectionLimit?: number;
}

export const FilterButtonGroup: React.FC<FilterButtonGroupProps> = ({ title, options, tagGroup, selectionLimit }) => {
  const { state, dispatch } = useUI();

  const selectedCount = state.selectedTagIds.filter(id => id.startsWith(`${tagGroup}:`)).length;
  const limitReached = selectionLimit ? selectedCount >= selectionLimit : false;

  const handleToggle = (id: string) => {
    const prefixedId = `${tagGroup}:${id}`;
    if (limitReached && !state.selectedTagIds.includes(prefixedId)) {
      // Optional: show a toast or message that the limit is reached
      return;
    }
    dispatch({ type: 'TOGGLE_TAG', payload: prefixedId });
  };

  const isSelected = (id: string) => {
    return state.selectedTagIds.includes(`${tagGroup}:${id}`);
  };

  return (
    <div className="space-y-2">
      <Label>{title}{selectionLimit && <span className="text-muted-foreground ml-2"> (select up to {selectionLimit})</span>}</Label>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map(option => {
          const selected = isSelected(option.id);
          return (
            <Button
              key={option.id}
              variant="neumorphic"
              size="sm"
              onClick={() => handleToggle(option.id)}
              isSelected={selected}
              disabled={limitReached && !selected}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
};
