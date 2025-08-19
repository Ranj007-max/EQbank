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

  const selectedCount = Object.keys(state.buttonStates).filter(id => id.startsWith(`${tagGroup}:`) && state.buttonStates[id]).length;
  const limitReached = selectionLimit ? selectedCount >= selectionLimit : false;

  const handleToggle = (id: string, selected: boolean) => {
    const prefixedId = `${tagGroup}:${id}`;
    if (limitReached && selected) {
      // Don't allow selecting more than the limit
      return;
    }
    dispatch({ type: 'TOGGLE_BUTTON', payload: { id: prefixedId, selected } });
  };

  return (
    <div className="space-y-2">
      <Label>{title}{selectionLimit && <span className="text-muted-foreground ml-2"> (select up to {selectionLimit})</span>}</Label>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map(option => {
          const prefixedId = `${tagGroup}:${option.id}`;
          const selected = !!state.buttonStates[prefixedId];
          return (
            <Button
              key={prefixedId}
              id={prefixedId}
              variant="neumorphic"
              size="sm"
              onToggle={() => handleToggle(option.id, !selected)}
              selected={selected}
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
