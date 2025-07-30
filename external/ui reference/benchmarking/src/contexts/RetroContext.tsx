import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RetroContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  focusedItem: number;
  setFocusedItem: (index: number) => void;
  keyboardNavigation: boolean;
  setKeyboardNavigation: (value: boolean) => void;
  handleKeyDown: (event: KeyboardEvent, items: any[], onSelect: (item: any) => void) => void;
}

const RetroContext = createContext<RetroContextType | undefined>(undefined);

export const useRetro = () => {
  const context = useContext(RetroContext);
  if (context === undefined) {
    throw new Error('useRetro must be used within a RetroProvider');
  }
  return context;
};

interface RetroProviderProps {
  children: ReactNode;
}

export const RetroProvider: React.FC<RetroProviderProps> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState('GAME');
  const [focusedItem, setFocusedItem] = useState(0);
  const [keyboardNavigation, setKeyboardNavigation] = useState(true);

  const handleKeyDown = (event: KeyboardEvent, items: any[], onSelect: (item: any) => void) => {
    if (!keyboardNavigation) return;

    switch (event.key) {
      case 'ArrowUp':
        setFocusedItem(prev => (prev > 0 ? prev - 1 : items.length - 1));
        event.preventDefault();
        break;
      case 'ArrowDown':
        setFocusedItem(prev => (prev < items.length - 1 ? prev + 1 : 0));
        event.preventDefault();
        break;
      case 'Enter':
        if (items[focusedItem]) {
          onSelect(items[focusedItem]);
        }
        event.preventDefault();
        break;
      default:
        // Handle menu navigation with first letter of menu items
        const key = event.key.toLowerCase();
        const index = items.findIndex(item => 
          item.name?.toLowerCase().startsWith(key) || 
          item.title?.toLowerCase().startsWith(key)
        );
        if (index !== -1) {
          setFocusedItem(index);
        }
        break;
    }
  };

  // Reset focused item when menu changes
  useEffect(() => {
    setFocusedItem(0);
  }, [activeMenu]);

  return (
    <RetroContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        focusedItem,
        setFocusedItem,
        keyboardNavigation,
        setKeyboardNavigation,
        handleKeyDown,
      }}
    >
      {children}
    </RetroContext.Provider>
  );
};