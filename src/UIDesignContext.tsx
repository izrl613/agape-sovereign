import React, { createContext, useContext, useState, ReactNode } from 'react';

type DesignType = 'agape' | 'architect';

interface UIDesignContextType {
  currentDesign: DesignType;
  toggleDesign: () => void;
}

const UIDesignContext = createContext<UIDesignContextType | undefined>(undefined);

export const UIDesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentDesign, setCurrentDesign] = useState<DesignType>('agape');

  const toggleDesign = () => {
    setCurrentDesign(prev => prev === 'agape' ? 'architect' : 'agape');
  };

  return (
    <UIDesignContext.Provider value={{ currentDesign, toggleDesign }}>
      {children}
    </UIDesignContext.Provider>
  );
};

export const useUIDesign = () => {
  const context = useContext(UIDesignContext);
  if (context === undefined) {
    throw new Error('useUIDesign must be used within a UIDesignProvider');
  }
  return context;
};
