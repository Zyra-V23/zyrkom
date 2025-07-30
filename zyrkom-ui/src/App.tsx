import React, { useState, useEffect } from 'react';
import FloatingWindow from './components/FloatingWindow';
import DoomWindow from './components/DoomWindow';
import ZyrkomWindow from './components/ZyrkomWindow';
import { Howl } from 'howler';

// Windows 95 startup sound (optional)
const startupSound = new Howl({
  src: ['/startup.mp3'],
  volume: 0.5,
});

const App: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDoomWindow, setShowDoomWindow] = useState(false);
  const [showZyrkomWindow, setShowZyrkomWindow] = useState(false);
  
  // Icon positions
  const [doomIconPosition, setDoomIconPosition] = useState({ x: 50, y: 50 });
  const [zyrkomIconPosition, setZyrkomIconPosition] = useState({ x: 50, y: 150 });
  const [isDraggingDoom, setIsDraggingDoom] = useState(false);
  const [isDraggingZyrkom, setIsDraggingZyrkom] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle icon dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingDoom) {
        setDoomIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isDraggingZyrkom) {
        setZyrkomIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDoom(false);
      setIsDraggingZyrkom(false);
    };

    if (isDraggingDoom || isDraggingZyrkom) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDoom, isDraggingZyrkom, dragOffset]);

  const handleIconMouseDown = (icon: string, e: React.MouseEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    
    if (icon === 'doom') {
      setIsDraggingDoom(true);
    } else if (icon === 'zyrkom') {
      setIsDraggingZyrkom(true);
    }
    setSelectedIcon(icon);
  };

  const handleIconDoubleClick = (icon: string) => {
    if (icon === 'doom') {
      setShowDoomWindow(true);
    } else if (icon === 'zyrkom') {
      setShowZyrkomWindow(true);
    }
  };

  const handleDesktopClick = () => {
    setSelectedIcon(null);
  };

  return (
    <div className="h-screen overflow-hidden" onClick={handleDesktopClick}>
      {/* Desktop Icons */}
      <div className="relative h-full">
        {/* DOOM Icon */}
        <div
          className={`desktop-icon ${selectedIcon === 'doom' ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: doomIconPosition.x,
            top: doomIconPosition.y,
          }}
          onMouseDown={(e) => handleIconMouseDown('doom', e)}
          onDoubleClick={() => handleIconDoubleClick('doom')}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIcon('doom');
          }}
        >
          <img src="/doom-icon.png" alt="DOOM" />
          <span>DOOM</span>
        </div>

        {/* Zyrkom Icon */}
        <div
          className={`desktop-icon ${selectedIcon === 'zyrkom' ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: zyrkomIconPosition.x,
            top: zyrkomIconPosition.y,
          }}
          onMouseDown={(e) => handleIconMouseDown('zyrkom', e)}
          onDoubleClick={() => handleIconDoubleClick('zyrkom')}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIcon('zyrkom');
          }}
          title="Zyrkom - Zero-Knowledge Musical Physics Framework"
        >
          <img src="/zyrkom-icon.svg" alt="Zyrkom" />
          <span>Zyrkom ZK</span>
        </div>
      </div>

      {/* Windows */}
      {showDoomWindow && (
        <DoomWindow onClose={() => setShowDoomWindow(false)} />
      )}
      
      {showZyrkomWindow && (
        <ZyrkomWindow onClose={() => setShowZyrkomWindow(false)} />
      )}

      {/* Taskbar */}
      <div className="taskbar-95">
        <button className="start-button">
          <img src="/h-Zh7vY5_400x400.jpg" alt="Zyrkom" style={{width: '20px', height: '20px', borderRadius: '50%'}} />
          Start
        </button>
        
        <div className="flex-1 flex gap-1 px-2">
          {showDoomWindow && (
            <button className="button-95 text-xs flex items-center gap-1">
              <img src="/doom-icon.png" alt="" width="16" height="16" />
              DOOM
            </button>
          )}
          {showZyrkomWindow && (
            <button className="button-95 text-xs flex items-center gap-1">
              <img src="/zyrkom-icon.svg" alt="" width="16" height="16" />
              Zyrkom
            </button>
          )}
        </div>

        {/* Clock */}
        <div className="window-95 px-2 py-1 text-xs">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default App;