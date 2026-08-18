import { create } from 'zustand';

// Determine initial theme from localStorage or system preference
function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('finpilot-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Apply theme to DOM
function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finpilot-theme', theme);
  }
}

// Apply immediately on load (before React hydrates)
const initialTheme = getInitialTheme();
applyTheme(initialTheme);

export const useUIStore = create((set) => ({
  isChatOpen: false,
  toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  // Theme state
  theme: initialTheme,
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    return { theme: next };
  }),
  setTheme: (theme) => {
    applyTheme(theme);
    return set({ theme });
  },
}));
