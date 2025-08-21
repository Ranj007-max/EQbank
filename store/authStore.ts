import { create } from 'zustand';

interface AuthState {
  profile: {
    display_name?: string;
  } | null;
  // Add other auth-related state properties here if needed
}

export const useAuthStore = create<AuthState>(() => ({
  profile: { display_name: 'Guest' },
  // Initialize other state properties here
}));
