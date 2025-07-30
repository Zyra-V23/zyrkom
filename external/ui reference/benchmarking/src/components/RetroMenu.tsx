import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRetro } from '../contexts/RetroContext';
import { useSound } from '../contexts/SoundContext';

interface MenuItem {
  label: string;
  key: string;
  path?: string;
}

interface RetroMenuProps {
  items: MenuItem[];
  onMenuClick?: (item: MenuItem) => void;
}

const RetroMenu: React.FC<RetroMenuProps> = ({ items, onMenuClick }) => {
  const { activeMenu, setActiveMenu } = useRetro();
  const { playMenuMove, playMenuSelect } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const menuKeys = items.map(item => item.key);
      const currentIndex = menuKeys.indexOf(activeMenu);
      
      switch (e.key) {
        case 'ArrowLeft':
          if (currentIndex > 0) {
            playMenuMove();
            setActiveMenu(menuKeys[currentIndex - 1]);
          }
          break;
        case 'ArrowRight':
          if (currentIndex < menuKeys.length - 1) {
            playMenuMove();
            setActiveMenu(menuKeys[currentIndex + 1]);
          }
          break;
        default:
          // Try to match first letter of menu item
          const key = e.key.toUpperCase();
          const matchingItem = items.find(item => item.label.startsWith(key));
          if (matchingItem) {
            playMenuMove();
            setActiveMenu(matchingItem.key);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu, items, setActiveMenu, playMenuMove]);

  const handleMenuClick = (item: MenuItem) => {
    playMenuSelect();
    setActiveMenu(item.key);
    
    // Si se proporciona onMenuClick, usarlo en lugar de navegación automática
    if (onMenuClick) {
      onMenuClick(item);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="retro-menu">
      {items.map((item) => (
        <div
          key={item.key}
          className={`retro-menu-item ${activeMenu === item.key ? (item.key === 'BENCH' ? 'bench-active' : 'active') : ''}`}
          onClick={() => handleMenuClick(item)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default RetroMenu;