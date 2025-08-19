import React, { createContext, useReducer, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

// 1. DEFINE STATE AND ACTION TYPES
interface UIState {
  selectedTagIds: string[];
  activeButtonIds: { [key: string]: string | null }; // e.g., { 'mcq-1': 'option-a', 'mcq-2': 'option-c' }
}

type UIAction =
  | { type: 'TOGGLE_TAG'; payload: string }
  | { type: 'SET_ACTIVE_BUTTON'; payload: { groupId: string; buttonId: string | null } }
  | { type: 'SET_STATE'; payload: UIState };

interface UIContextProps {
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
}

// 2. CREATE THE CONTEXT
const UIContext = createContext<UIContextProps | undefined>(undefined);

// 3. DEFINE THE REDUCER
const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'TOGGLE_TAG':
      const { selectedTagIds } = state;
      const tagId = action.payload;
      const newSelectedTagIds = selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((t) => t !== tagId)
        : [...selectedTagIds, tagId];
      return { ...state, selectedTagIds: newSelectedTagIds };

    case 'SET_ACTIVE_BUTTON':
      const { groupId, buttonId } = action.payload;
      return {
        ...state,
        activeButtonIds: {
          ...state.activeButtonIds,
          [groupId]: buttonId,
        },
      };

    case 'SET_STATE':
        return { ...state, ...action.payload };

    default:
      return state;
  }
};

const initialState: UIState = {
    selectedTagIds: [],
    activeButtonIds: {},
};

// 4. CREATE THE PROVIDER COMPONENT
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persistedState, setPersistedState] = useLocalStorage<UIState>('app-ui-state', initialState);

  // The useReducer hook is now initialized with the state from localStorage.
  const [state, dispatch] = useReducer(uiReducer, persistedState);

  // When the state changes, we persist it to localStorage.
  useEffect(() => {
    // We compare to avoid writing the exact same object back.
    if (JSON.stringify(state) !== JSON.stringify(persistedState)) {
        setPersistedState(state);
    }
  }, [state, setPersistedState, persistedState]);

  // This effect listens for changes in other tabs and updates the current tab's state.
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'app-ui-state' && event.newValue) {
        dispatch({ type: 'SET_STATE', payload: JSON.parse(event.newValue) });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <UIContext.Provider value={{ state, dispatch }}>
      {children}
    </UIContext.Provider>
  );
};

// 5. CREATE A CUSTOM HOOK FOR EASY ACCESS
export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
