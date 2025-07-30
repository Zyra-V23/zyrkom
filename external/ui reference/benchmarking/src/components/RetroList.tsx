import React, { useEffect } from 'react';
import { useRetro } from '../contexts/RetroContext';
import { useSound } from '../contexts/SoundContext';

interface RetroListProps<T> {
  items: T[];
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  onSelect?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

const RetroList = <T,>({ 
  items, 
  renderItem, 
  onSelect,
  keyExtractor 
}: RetroListProps<T>) => {
  const { focusedItem, setFocusedItem, handleKeyDown } = useRetro();
  const { playMenuMove, playMenuSelect } = useSound();

  useEffect(() => {
    const handleKeyboardNav = (e: KeyboardEvent) => {
      handleKeyDown(e, items, (item) => {
        if (onSelect) {
          playMenuSelect();
          onSelect(item);
        }
      });
    };

    window.addEventListener('keydown', handleKeyboardNav);
    return () => window.removeEventListener('keydown', handleKeyboardNav);
  }, [items, focusedItem, handleKeyDown, onSelect, playMenuSelect]);

  const handleItemClick = (index: number, item: T) => {
    playMenuSelect();
    setFocusedItem(index);
    if (onSelect) {
      onSelect(item);
    }
  };

  const handleItemHover = (index: number) => {
    if (focusedItem !== index) {
      playMenuMove();
      setFocusedItem(index);
    }
  };

  return (
    <div className="retro-list">
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          className={`list-item ${focusedItem === index ? 'selected' : ''}`}
          onClick={() => handleItemClick(index, item)}
          onMouseEnter={() => handleItemHover(index)}
        >
          {renderItem(item, focusedItem === index)}
        </div>
      ))}
    </div>
  );
};

export default RetroList;