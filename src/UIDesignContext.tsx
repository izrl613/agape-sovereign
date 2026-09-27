import React, { createContext, useContext, useState, ReactNode } from 'react';

type DesignType = 'agape' | 'architect';

interface UIDesignContextType {
  currentDesign: DesignType;
  toggleDesign: () => void;
}

const UIDesignContext = createContext<UIDesignContextType | undefined>(undefined);

export const UIDesignProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // The standard Agape experience is the default. The standalone Architect
  // enclave is reachable only through the explicit /architect route.
  const [currentDesign, setCurrentDesign] = useState<DesignType>('agape');

  const toggleDesign = () => {
    setCurrentDesign('agape');
    window.location.assign('/dashboard');
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
