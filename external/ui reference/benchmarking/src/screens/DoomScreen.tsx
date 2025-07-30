import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';
import RetroButton from '../components/RetroButton';
import RetroWindow from '../components/RetroWindow';

interface DoomScreenProps {
  onBack: () => void;
}

const DoomScreen: React.FC<DoomScreenProps> = ({ onBack }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIsLoading(false);
      setLoadError(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setLoadError(true);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, []);

  const toggleFullscreen = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (!isFullscreen) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const toggleMute = () => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    // Try to communicate with the DOOM iframe to control audio
    try {
      iframe.contentWindow.postMessage({ 
        type: 'AUDIO_CONTROL', 
        muted: !isMuted 
      }, '*');
      setIsMuted(!isMuted);
    } catch (error) {
      console.warn('Could not control DOOM audio:', error);
    }
  };

  const doomControls = (
    <div className="mb-4 flex flex-wrap gap-2 justify-center">
      <RetroButton onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft size={16} />
        BACK TO MAIN
      </RetroButton>
      <RetroButton onClick={toggleFullscreen} className="flex items-center gap-2">
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN'}
      </RetroButton>
      <RetroButton onClick={toggleMute} className="flex items-center gap-2">
        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        {isMuted ? 'UNMUTE' : 'MUTE'}
      </RetroButton>
    </div>
  );

  const loadingScreen = (
    <div className="flex flex-col items-center justify-center h-96 text-green-400">
      <div className="text-2xl mb-4 animate-pulse">LOADING DOOM...</div>
      <div className="text-sm mb-4">Initializing WebAssembly...</div>
      <div className="w-64 h-2 bg-gray-800 rounded">
        <div className="h-full bg-green-400 rounded animate-pulse" style={{ width: '60%' }}></div>
      </div>
      <div className="text-xs mt-4 text-center max-w-md">
        <p>Loading DOOM WebAssembly build...</p>
        <p>This may take a moment on first load.</p>
      </div>
    </div>
  );

  const errorScreen = (
    <div className="flex flex-col items-center justify-center h-96 text-red-400">
      <div className="text-2xl mb-4">ERROR LOADING DOOM</div>
      <div className="text-sm mb-4">Failed to load WebAssembly build</div>
      <div className="text-xs text-center max-w-md mb-4">
        <p>Make sure the DOOM files are properly served:</p>
        <ul className="list-disc list-inside mt-2 text-left">
          <li>doomgeneric.html</li>
          <li>doomgeneric.js</li>
          <li>doomgeneric.wasm</li>
          <li>doomgeneric.data</li>
        </ul>
      </div>
      <RetroButton onClick={() => window.location.reload()}>
        RETRY
      </RetroButton>
    </div>
  );

  const gameInstructions = (
    <div className="mb-4 text-xs text-green-400 bg-black bg-opacity-50 p-3 rounded border border-green-400">
      <div className="font-bold mb-2">🎮 DOOM CONTROLS:</div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <strong>Movement:</strong>
          <br />• Arrow Keys / WASD
          <br />• Mouse Look
        </div>
        <div>
          <strong>Actions:</strong>
          <br />• SPACE - Open doors
          <br />• CTRL - Fire weapon
          <br />• SHIFT - Run
        </div>
      </div>
      <div className="mt-2">
        <strong>Game:</strong> ESC - Menu | TAB - Map | F1 - Help
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-black p-4">
      <RetroWindow title="DOOM - CLASSIC FPS EXPERIENCE">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-green-400 mb-2">
              🔥 DOOM WebAssembly 🔥
            </h1>
            <p className="text-green-300 text-sm">
              Classic DOOM running in your browser via WebAssembly
            </p>
          </div>

          {/* Controls */}
          {doomControls}

          {/* Instructions */}
          {!isLoading && !loadError && gameInstructions}

          {/* Game Container */}
          <div className="relative bg-black border-2 border-green-400 rounded-lg overflow-hidden">
            {isLoading && loadingScreen}
            {loadError && errorScreen}
            
            {!loadError && (
              <iframe
                ref={iframeRef}
                src="/doomgeneric.html"
                className={`w-full transition-opacity duration-500 ${
                  isLoading ? 'opacity-0 h-0' : 'opacity-100 h-96 md:h-[600px]'
                }`}
                title="DOOM WebAssembly"
                allow="fullscreen"
                style={{
                  border: 'none',
                  background: '#000'
                }}
              />
            )}
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs text-green-400 space-y-1">
            <p>🎯 Original DOOM (1993) compiled to WebAssembly</p>
            <p>🔧 Built with Emscripten + SDL2 + SDL_mixer</p>
            <p>⚡ Optimized for modern browsers with WebAssembly support</p>
          </div>
        </div>
      </RetroWindow>
    </div>
  );
};

export default DoomScreen; 