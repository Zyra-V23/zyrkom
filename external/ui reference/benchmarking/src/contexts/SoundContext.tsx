import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { Howl } from 'howler';

interface SoundContextType {
  playMenuMove: () => void;
  playMenuSelect: () => void;
  playError: () => void;
  playSuccess: () => void;
  playTyping: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};

interface SoundProviderProps {
  children: ReactNode;
}

export const SoundProvider: React.FC<SoundProviderProps> = ({ children }) => {
  // Sound URLs from public CDNs
  const sounds = {
    menuMove: useRef(new Howl({ 
      src: ['https://assets.codepen.io/217233/menuselect.wav'],
      volume: 0.5
    })),
    menuSelect: useRef(new Howl({ 
      src: ['https://assets.codepen.io/217233/menuactivate.wav'],
      volume: 0.6
    })),
    error: useRef(new Howl({ 
      src: ['https://assets.codepen.io/217233/error.wav'],
      volume: 0.7
    })),
    success: useRef(new Howl({ 
      src: ['https://assets.codepen.io/217233/success.wav'],
      volume: 0.6
    })),
    typing: useRef(new Howl({ 
      src: ['https://assets.codepen.io/217233/typing.wav'],
      volume: 0.4
    })),
  };

  const playMenuMove = () => sounds.menuMove.current.play();
  const playMenuSelect = () => sounds.menuSelect.current.play();
  const playError = () => sounds.error.current.play();
  const playSuccess = () => sounds.success.current.play();
  const playTyping = () => sounds.typing.current.play();

  return (
    <SoundContext.Provider
      value={{
        playMenuMove,
        playMenuSelect,
        playError,
        playSuccess,
        playTyping,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};