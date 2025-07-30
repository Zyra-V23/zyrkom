import React, { useEffect, useRef, useState } from 'react';
import FloatingWindow from './FloatingWindow';

interface DoomWindowProps {
  onClose: () => void;
}

declare global {
  interface Window {
    Module: any;
  }
}

const DoomWindow: React.FC<DoomWindowProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [status, setStatus] = useState('Initializing...');
  const [pointerLock, setPointerLock] = useState(true);
  const [resize, setResize] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Set initial canvas size
    canvas.width = 640;
    canvas.height = 400;
    
    // Cleanup previous module if it exists
    if (window.Module) {
      window.Module = undefined;
    }
    
    // Setup Module configuration before loading script
    window.Module = {
      print: (...args: any[]) => {
        console.log(...args);
      },
      canvas: canvas,
      setStatus: (text: string) => {
        if (!window.Module.setStatus.last) {
          window.Module.setStatus.last = { time: Date.now(), text: '' };
        }
        
        if (text === window.Module.setStatus.last.text) return;
        
        const m = text.match(/([^(]+)\((\d+(?:\.\d+)?)\/(\d+)\)/);
        const now = Date.now();
        
        if (m && now - window.Module.setStatus.last.time < 30) return;
        
        window.Module.setStatus.last.time = now;
        window.Module.setStatus.last.text = text;
        
        if (m) {
          const progress = (parseInt(m[2]) / parseInt(m[4])) * 100;
          setLoadingProgress(progress);
          setStatus(m[1]);
          setIsLoading(true);
        } else {
          setLoadingProgress(100);
          setStatus(text || 'Ready');
          if (!text) {
            setIsLoading(false);
          }
        }
      },
      totalDependencies: 0,
      monitorRunDependencies: (left: number) => {
        window.Module.totalDependencies = Math.max(window.Module.totalDependencies, left);
        const statusText = left ? 
          `Preparing... (${window.Module.totalDependencies - left}/${window.Module.totalDependencies})` : 
          'All downloads complete.';
        window.Module.setStatus(statusText);
      },
      requestFullscreen: (lockPointer: boolean, _resizeCanvas: boolean) => {
        if (canvas.requestFullscreen) {
          canvas.requestFullscreen().then(() => {
            if (lockPointer && canvas.requestPointerLock) {
              canvas.requestPointerLock();
            }
          }).catch((err) => {
            console.error('Fullscreen failed:', err);
          });
        }
      },
      // Add error handling
      onRuntimeInitialized: () => {
        console.log('Doom runtime initialized');
        setIsLoading(false);
        setStatus('Ready');
      }
    };

    // Add WebGL context lost handler
    const handleContextLost = (e: Event) => {
      alert('WebGL context lost. You will need to reload the DOOM window.');
      e.preventDefault();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // Load Doom script
    const script = document.createElement('script');
    script.src = '/doomgeneric.js';
    script.async = true;
    script.onload = () => {
      console.log('Doom script loaded successfully');
    };
    script.onerror = () => {
      setStatus('Failed to load DOOM');
      setIsLoading(false);
    };

    document.body.appendChild(script);

    // Set initial status
    window.Module.setStatus('Downloading...');

    // Cleanup function
    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Don't cleanup Module here as it might still be in use
    };
  }, []);

  const handleFullscreen = () => {
    if (window.Module && window.Module.requestFullscreen) {
      window.Module.requestFullscreen(pointerLock, resize);
    }
  };

  return (
    <FloatingWindow
      title="DOOM - RIP AND TEAR"
      onClose={onClose}
      width={900}
      height={700}
    >
      <div className="h-full bg-black flex flex-col">
        {/* Controls */}
        <div className="p-2 bg-gray-800 flex items-center justify-between text-xs text-white">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={resize}
                onChange={(e) => setResize(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Resize canvas</span>
            </label>
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={pointerLock}
                onChange={(e) => setPointerLock(e.target.checked)}
                className="w-3 h-3"
              />
              <span>Lock/hide mouse pointer</span>
            </label>
            <button
              onClick={handleFullscreen}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
              disabled={isLoading}
            >
              Fullscreen
            </button>
          </div>
          <div className="text-green-400">
            {status}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="p-4 bg-gray-900 text-center">
            <div className="text-red-500 mb-2">Loading DOOM...</div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-400">{Math.round(loadingProgress)}%</div>
          </div>
        )}

        {/* Game canvas */}
        <div className="flex-1 bg-black relative flex items-center justify-center p-4">
          <div style={{ 
            border: '2px solid #333', 
            borderRadius: '4px',
            background: 'black',
            display: 'inline-block' 
          }}>
            <canvas
              ref={canvasRef}
              className="bg-black"
              onContextMenu={(e) => e.preventDefault()}
              tabIndex={-1}
              style={{
                border: '0px none',
                backgroundColor: 'black',
                display: 'block',
                paddingRight: 0,
                outline: 'none',
                imageRendering: 'pixelated',
                maxWidth: '100%',
                maxHeight: '100%',
                width: '640px',
                height: '400px'
              }}
            />
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <div className="text-red-500 text-sm font-bold">
                  LOADING DOOM...
                </div>
                <div className="text-gray-400 text-xs mt-2">
                  Prepare for carnage
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!isLoading && (
          <div className="p-2 bg-gray-800 text-xs text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="text-red-400">Movement:</strong> WASD or Arrow Keys
              </div>
              <div>
                <strong className="text-red-400">Shoot:</strong> Space or Ctrl
              </div>
              <div>
                <strong className="text-red-400">Use/Open:</strong> E or Enter
              </div>
              <div>
                <strong className="text-red-400">Menu:</strong> Escape
              </div>
            </div>
          </div>
        )}
      </div>
    </FloatingWindow>
  );
};

export default DoomWindow;