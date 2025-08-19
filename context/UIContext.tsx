import React, { createContext, useReducer, useContext, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

// 1. DEFINE STATE AND ACTION TYPES
interface UIState {
  buttonStates: { [id: string]: boolean };
  history: Array<{ [id: string]: boolean }>;
}

type UIAction =
  | { type: 'TOGGLE_BUTTON'; payload: { id: string, selected: boolean } }
  | { type: 'SET_BUTTON_EXCLUSIVE'; payload: { groupId: string, buttonId: string | null } }
  | { type: 'UNDO_ACTION' }
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
    case 'TOGGLE_BUTTON': {
      const newHistory = [...state.history, state.buttonStates].slice(-5); // Limit history
      const newButtonStates = {
          ...state.buttonStates,
          [action.payload.id]: action.payload.selected,
      };
      return { ...state, buttonStates: newButtonStates, history: newHistory };
    }

    case 'SET_BUTTON_EXCLUSIVE': {
      const newHistory = [...state.history, state.buttonStates].slice(-5);
      const { groupId, buttonId } = action.payload;
      const newButtonStates = { ...state.buttonStates };
      Object.keys(newButtonStates).forEach(key => {
        if (key.startsWith(`${groupId}:`)) {
          delete newButtonStates[key];
        }
      });
      if (buttonId) {
        newButtonStates[`${groupId}:${buttonId}`] = true;
      }
      return { ...state, buttonStates: newButtonStates, history: newHistory };
    }

    case 'UNDO_ACTION': {
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, state.history.length - 1);
      return { ...state, buttonStates: previousState, history: newHistory };
    }

    case 'SET_STATE':
        return { ...state, ...action.payload };

    default:
      return state;
  }
};

const initialState: UIState = {
    buttonStates: {},
    history: [],
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
