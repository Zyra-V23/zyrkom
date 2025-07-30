import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';
import FloatingWindow from './FloatingWindow';

interface WowLoginWindowProps {
  onClose: () => void;
  onLogin: () => void;
}

const WowLoginWindow: React.FC<WowLoginWindowProps> = ({ onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [soundtrack] = useState(() => 
    new Howl({
      src: ['/assets/audio/soundtrack.mp3'],
      loop: true,
      volume: 0.3,
      autoplay: false,
      onload: () => {
        console.log('Audio loaded successfully');
        setIsAudioLoading(false);
      },
      onloaderror: (id, error) => {
        console.error('Audio load error:', error);
        setIsAudioLoading(false);
      }
    })
  );

  const startAudio = () => {
    if (!isAudioPlaying) {
      soundtrack.play();
      setIsAudioPlaying(true);
    }
  };

  useEffect(() => {
    const tryAutoplay = async () => {
      try {
        soundtrack.play();
        setIsAudioPlaying(true);
      } catch (error) {
        console.log('Autoplay blocked, waiting for user interaction');
      }
    };
    
    tryAutoplay();
    
    return () => {
      soundtrack.stop();
      setIsAudioPlaying(false);
    };
  }, [soundtrack]);

  const handleLogin = () => {
    if (username === 'wallace' && password === 'PollaNegra666') {
      soundtrack.stop();
      onLogin();
      onClose();
    } else {
      setLoginError('Invalid credentials. Please try again.');
      setTimeout(() => setLoginError(''), 3000);
    }
  };

  const handleClose = () => {
    soundtrack.stop();
    onClose();
  };

  return (
    <FloatingWindow
      title="World of Warcraft - Classic"
      onClose={handleClose}
      initialX={200}
      initialY={150}
      width={800}
      height={550}
    >
      <div 
        className="w-full h-full bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: "url('/assets/images/WoW_Login_No_Text.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
        onClick={startAudio}
      >
        {/* Audio Control Button */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAudioLoading) return;
              if (isAudioPlaying) {
                soundtrack.pause();
                setIsAudioPlaying(false);
              } else {
                soundtrack.play();
                setIsAudioPlaying(true);
              }
            }}
            className={`bg-black bg-opacity-70 hover:bg-opacity-90 border border-yellow-600 rounded-full w-8 h-8 flex items-center justify-center text-yellow-400 hover:text-yellow-300 transition-all duration-200 ${isAudioLoading ? 'cursor-wait' : 'cursor-pointer'}`}
            title={isAudioLoading ? "Loading audio..." : (isAudioPlaying ? "Pause Music" : "Play Music")}
          >
            {isAudioLoading ? "⏳" : (isAudioPlaying ? "⏸️" : "▶️")}
          </button>
        </div>

        {/* Click to enable audio overlay (only shown if audio not playing) */}
        {!isAudioPlaying && !isAudioLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-15 cursor-pointer">
            <div 
              className="bg-black bg-opacity-80 px-4 py-2 rounded border border-yellow-600 text-yellow-400 text-sm animate-pulse"
              style={{
                fontFamily: "'Cinzel', serif",
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              🎵 Click anywhere to enable Teldrassil soundtrack
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isAudioLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-15">
            <div 
              className="bg-black bg-opacity-80 px-4 py-2 rounded border border-yellow-600 text-yellow-400 text-sm"
              style={{
                fontFamily: "'Cinzel', serif",
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
            >
              ⏳ Loading soundtrack... (33MB)
            </div>
          </div>
        )}

        {/* WoW Classic Logo */}
        <div className="absolute top-3 left-3 z-10">
          <div 
            className="text-yellow-400 font-bold text-base"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
              letterSpacing: '1px'
            }}
          >
            WORLD OF WARCRAFT
          </div>
          <div 
            className="text-yellow-300 text-xs"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
              letterSpacing: '2px'
            }}
          >
            - CLASSIC -
          </div>
        </div>

        {/* News Panel */}
        <div 
          className="absolute left-3 top-14 bg-black bg-opacity-85 rounded border border-yellow-600 p-3 z-10"
          style={{
            width: '200px',
            height: '110px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 15px rgba(0,0,0,0.6)'
          }}
        >
          <div 
            className="text-yellow-400 font-bold mb-2 text-xs"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            Breaking News
          </div>
          <div 
            className="text-yellow-200 text-xs leading-relaxed"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            test
          </div>
        </div>

        {/* Login Panel - Centrado en el portal */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div 
            className="bg-black bg-opacity-85 rounded-lg border-2 border-yellow-600 p-6"
            style={{
              backdropFilter: 'blur(12px)',
              boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), inset 0 0 20px rgba(0,0,0,0.3)',
              marginTop: '10px'
            }}
          >
            <div className="space-y-4">
              {/* Account Name */}
              <div>
                <label 
                  className="block text-yellow-400 text-xs font-bold mb-1"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  Account Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-56 px-3 py-2 bg-black bg-opacity-90 border border-yellow-600 rounded text-yellow-200 focus:outline-none focus:border-yellow-400 text-sm"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  autoFocus
                />
              </div>

              {/* Account Password */}
              <div>
                <label 
                  className="block text-yellow-400 text-xs font-bold mb-1"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  Account Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-56 px-3 py-2 bg-black bg-opacity-90 border border-yellow-600 rounded text-yellow-200 focus:outline-none focus:border-yellow-400 text-sm"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              {/* Login Button */}
              <button
                onClick={handleLogin}
                className="w-full py-2 bg-gradient-to-b from-yellow-600 to-yellow-800 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold rounded border border-yellow-400 transition-all duration-200 transform hover:scale-105 text-sm"
                style={{
                  fontFamily: "'Cinzel', serif",
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.4), 0 0 15px rgba(255,215,0,0.3)'
                }}
              >
                Login
              </button>

              {/* Error Message */}
              {loginError && (
                <div 
                  className="text-red-400 text-xs text-center mt-3"
                  style={{
                    fontFamily: "'Cinzel', serif",
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {loginError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center z-10">
          <div 
            className="text-yellow-300 text-xs"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
            }}
          >
            Version: 1.15.0 (52237)
          </div>
          <div 
            className="text-yellow-300 text-xs"
            style={{
              fontFamily: "'Cinzel', serif",
              textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
            }}
          >
            Copyright 2004-2019 Blizzard Entertainment
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default WowLoginWindow; 