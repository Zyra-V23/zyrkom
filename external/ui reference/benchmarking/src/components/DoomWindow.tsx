import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Maximize2 } from 'lucide-react';
import FloatingWindow from './FloatingWindow';
import RetroButton from './RetroButton';

interface DoomWindowProps {
  onClose: () => void;
}

const DoomWindow: React.FC<DoomWindowProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if DOOM files exist
    const checkDoomFiles = async () => {
      try {
        const response = await fetch('/doomgeneric.html');
        if (!response.ok) {
          throw new Error('DOOM files not found. Please compile DOOM first.');
        }
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load DOOM');
        setIsLoading(false);
      }
    };

    checkDoomFiles();
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load DOOM game');
    setIsLoading(false);
  };

  const handleFullScreen = () => {
    navigate('/doom');
  };

  return (
    <FloatingWindow
      title="DOOM - RIP AND TEAR"
      onClose={onClose}
      initialX={100}
      initialY={100}
      width={800}
      height={600}
      minWidth={640}
      maxWidth={1024}
      minHeight={480}
      maxHeight={768}
    >
      <div className="h-full flex flex-col bg-black">
        {/* Header with Full Screen Button */}
        <div className="bg-gray-800 border-b border-gray-600 p-2 flex justify-between items-center">
          <div className="text-green-400 font-['Press_Start_2P'] text-xs">
            🔥 DOOM WebAssembly 🔥
          </div>
          <RetroButton 
            onClick={handleFullScreen}
            className="flex items-center gap-1 text-xs py-1 px-2"
          >
            <Maximize2 size={12} />
            FULL SCREEN
          </RetroButton>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center text-green-400 font-['Press_Start_2P']">
            <div className="text-center">
              <div className="mb-4">🔥 LOADING DOOM 🔥</div>
              <div className="text-sm">PREPARING FOR CARNAGE...</div>
              <div className="mt-4 text-xs">
                <div className="animate-pulse">████████████████</div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex-1 flex items-center justify-center text-red-400 font-['Press_Start_2P']">
            <div className="text-center p-4">
              <div className="mb-4">💀 ERROR 💀</div>
              <div className="text-sm mb-4">{error}</div>
              <div className="text-xs">
                <div>DOOM FILES MISSING!</div>
                <div className="mt-2 text-left bg-gray-800 p-2 rounded">
                  <div>Required files:</div>
                  <div>• doomgeneric.html</div>
                  <div>• doomgeneric.js</div>
                  <div>• doomgeneric.wasm</div>
                  <div>• doomgeneric.data</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex-1 relative">
            <iframe
              ref={iframeRef}
              src="/doomgeneric.html"
              className="w-full h-full border-none"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title="DOOM Game"
              style={{
                imageRendering: 'pixelated',
                filter: 'contrast(1.1) brightness(1.05)'
              }}
            />
            
            {/* DOOM Controls Overlay */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-green-400 text-xs font-['Press_Start_2P'] p-2 rounded">
              <div>CONTROLS:</div>
              <div>WASD/ARROWS - MOVE</div>
              <div>CTRL - FIRE</div>
              <div>SPACE - USE/OPEN</div>
              <div>SHIFT - RUN</div>
              <div>ESC - MENU</div>
            </div>

            {/* DOOM Status Overlay */}
            <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-red-400 text-xs font-['Press_Start_2P'] p-2 rounded">
              <div className="text-center">
                <div>🔥 DOOM 🔥</div>
                <div className="text-green-400 mt-1">READY TO RIP</div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="bg-gray-800 border-t border-gray-600 p-2 text-center">
          <div className="text-green-400 font-['Press_Start_2P'] text-xs">
            {isLoading ? 'INITIALIZING HELL...' : 
             error ? 'COMPILATION REQUIRED' : 
             'DOOM IS RUNNING - HAVE FUN!'}
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default DoomWindow; 