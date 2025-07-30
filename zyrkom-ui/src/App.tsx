import React, { useState, useEffect } from 'react';
import FloatingWindow from './components/FloatingWindow';
import DoomWindow from './components/DoomWindow';
import ZyrkomWindow from './components/ZyrkomWindow';
import MusicalDnaWindow from './components/MusicalDnaWindow';
import ZKStudioWindow from './components/ZKStudioWindow';
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
  const [showMusicalDnaWindow, setShowMusicalDnaWindow] = useState(false);
  const [showZKStudioWindow, setShowZKStudioWindow] = useState(false);
  
  // Icon positions
  const [doomIconPosition, setDoomIconPosition] = useState({ x: 50, y: 50 });
  const [zyrkomIconPosition, setZyrkomIconPosition] = useState({ x: 50, y: 150 });
  const [musicalDnaIconPosition, setMusicalDnaIconPosition] = useState({ x: 50, y: 250 });
  const [zkStudioIconPosition, setZkStudioIconPosition] = useState({ x: 50, y: 350 });
  const [isDraggingDoom, setIsDraggingDoom] = useState(false);
  const [isDraggingZyrkom, setIsDraggingZyrkom] = useState(false);
  const [isDraggingMusicalDna, setIsDraggingMusicalDna] = useState(false);
  const [isDraggingZKStudio, setIsDraggingZKStudio] = useState(false);
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
      } else if (isDraggingMusicalDna) {
        setMusicalDnaIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isDraggingZKStudio) {
        setZkStudioIconPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingDoom(false);
      setIsDraggingZyrkom(false);
      setIsDraggingMusicalDna(false);
      setIsDraggingZKStudio(false);
    };

    if (isDraggingDoom || isDraggingZyrkom || isDraggingMusicalDna || isDraggingZKStudio) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingDoom, isDraggingZyrkom, isDraggingMusicalDna, isDraggingZKStudio, dragOffset]);

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
    } else if (icon === 'musical-dna') {
      setIsDraggingMusicalDna(true);
    } else if (icon === 'zk-studio') {
      setIsDraggingZKStudio(true);
    }
    setSelectedIcon(icon);
  };

  const handleIconDoubleClick = (icon: string) => {
    if (icon === 'doom') {
      setShowDoomWindow(true);
    } else if (icon === 'zyrkom') {
      setShowZyrkomWindow(true);
    } else if (icon === 'musical-dna') {
      setShowMusicalDnaWindow(true);
    } else if (icon === 'zk-studio') {
      setShowZKStudioWindow(true);
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

        {/* Musical DNA Icon */}
        <div
          className={`desktop-icon ${selectedIcon === 'musical-dna' ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: musicalDnaIconPosition.x,
            top: musicalDnaIconPosition.y,
          }}
          onMouseDown={(e) => handleIconMouseDown('musical-dna', e)}
          onDoubleClick={() => handleIconDoubleClick('musical-dna')}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIcon('musical-dna');
          }}
          title="Musical DNA - Discover Your Unique Musical Fingerprint"
        >
          <img src="/musical-dna-icon.svg" alt="Musical DNA" />
          <span>Musical DNA</span>
        </div>

        {/* ZK Studio Icon */}
        <div
          className={`desktop-icon ${selectedIcon === 'zk-studio' ? 'selected' : ''}`}
          style={{
            position: 'absolute',
            left: zkStudioIconPosition.x,
            top: zkStudioIconPosition.y,
          }}
          onMouseDown={(e) => handleIconMouseDown('zk-studio', e)}
          onDoubleClick={() => handleIconDoubleClick('zk-studio')}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIcon('zk-studio');
          }}
          title="ZK Studio - Zero-Knowledge Digital Audio Workstation"
        >
          <img src="/zk-studio-icon.svg" alt="ZK Studio" />
          <span>ZK Studio</span>
        </div>
      </div>

      {/* Windows */}
      {showDoomWindow && (
        <DoomWindow onClose={() => setShowDoomWindow(false)} />
      )}
      
      {showZyrkomWindow && (
        <ZyrkomWindow onClose={() => setShowZyrkomWindow(false)} />
      )}

      {showMusicalDnaWindow && (
        <MusicalDnaWindow onClose={() => setShowMusicalDnaWindow(false)} />
      )}

      {showZKStudioWindow && (
        <ZKStudioWindow onClose={() => setShowZKStudioWindow(false)} />
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
          {showMusicalDnaWindow && (
            <button className="button-95 text-xs flex items-center gap-1">
              <img src="/musical-dna-icon.svg" alt="" width="16" height="16" />
              Musical DNA
            </button>
          )}
          {showZKStudioWindow && (
            <button className="button-95 text-xs flex items-center gap-1">
              <img src="/zk-studio-icon.svg" alt="" width="16" height="16" />
              ZK Studio
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