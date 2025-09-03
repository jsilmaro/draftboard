import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  theme: 'dark';
  isDark: true;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  isDark: true,
});

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always apply dark mode to document root
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
    // Remove any light mode classes that might exist
    root.classList.remove('light');
  }, []);

  const value: ThemeContextType = {
    theme: 'dark',
    isDark: true,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
