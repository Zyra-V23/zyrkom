import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface DisplaySettings {
  // CRT Effects
  scanlineOpacity: number;
  crtFlicker: boolean;
  pixelPerfectScaling: boolean;
  
  // Color Schemes
  colorScheme: 'dos-blue' | 'green-terminal' | 'amber-monitor' | 'custom';
  customColors: {
    background: string;
    foreground: string;
    accent: string;
  };
  
  // Performance
  enableAnimations: boolean;
  reducedMotion: boolean;
  
  // Layout
  fontSize: number;
  windowOpacity: number;
}

interface DisplayContextType {
  settings: DisplaySettings;
  updateSetting: <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => void;
  resetToDefaults: () => void;
  applySettings: () => void;
  getColorSchemeValues: () => { background: string; foreground: string; accent: string };
}

const defaultSettings: DisplaySettings = {
  scanlineOpacity: 0.2,
  crtFlicker: true,
  pixelPerfectScaling: true,
  colorScheme: 'green-terminal',
  customColors: {
    background: '#000040',
    foreground: '#00ff00',
    accent: '#ffffff'
  },
  enableAnimations: true,
  reducedMotion: false,
  fontSize: 12,
  windowOpacity: 0.95
};

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export const useDisplay = () => {
  const context = useContext(DisplayContext);
  if (context === undefined) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
};

interface DisplayProviderProps {
  children: ReactNode;
}

export const DisplayProvider: React.FC<DisplayProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('retro-bench-display-settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const updateSetting = <K extends keyof DisplaySettings>(key: K, value: DisplaySettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  const getColorSchemeValues = () => {
    switch (settings.colorScheme) {
      case 'dos-blue':
        return {
          background: '#000080',
          foreground: '#ffffff',
          accent: '#ffff00'
        };
      case 'green-terminal':
        return {
          background: '#000040',
          foreground: '#00ff00',
          accent: '#ffffff'
        };
      case 'amber-monitor':
        return {
          background: '#000000',
          foreground: '#ffb000',
          accent: '#ffffff'
        };
      case 'custom':
        return settings.customColors;
      default:
        return settings.customColors;
    }
  };

  const applySettings = () => {
    const root = document.documentElement;
    const body = document.body;
    const colors = getColorSchemeValues();
    
    // Apply CSS custom properties for colors
    root.style.setProperty('--scanline-opacity', settings.scanlineOpacity.toString());
    root.style.setProperty('--bg-primary', colors.background);
    root.style.setProperty('--text-primary', colors.foreground);
    root.style.setProperty('--text-accent', colors.accent);
    root.style.setProperty('--color-text', colors.foreground);
    root.style.setProperty('--color-text-bright', colors.foreground);
    root.style.setProperty('--color-text-dim', colors.foreground + '80');
    root.style.setProperty('--font-size-base', `${settings.fontSize}px`);
    root.style.setProperty('--window-opacity', settings.windowOpacity.toString());
    
    // Apply font size to body
    body.style.fontSize = `${settings.fontSize}px`;
    
    // Apply CRT effects
    let crtElement = document.querySelector('.crt-overlay') as HTMLElement;
    if (!crtElement) {
      crtElement = document.createElement('div');
      crtElement.className = 'crt-overlay';
      crtElement.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9999;
        background: linear-gradient(
          to bottom,
          transparent 50%,
          rgba(0, 0, 0, 0.15) 50%
        );
        background-size: 100% 2px;
      `;
      body.appendChild(crtElement);
    }
    
    // Apply scanline opacity
    crtElement.style.opacity = settings.scanlineOpacity.toString();
    
    // Apply CRT flicker
    if (settings.crtFlicker) {
      crtElement.style.animation = 'crt-flicker 0.15s infinite linear';
      // Add flicker keyframes if not exists
      if (!document.querySelector('#crt-flicker-keyframes')) {
        const style = document.createElement('style');
        style.id = 'crt-flicker-keyframes';
        style.textContent = `
          @keyframes crt-flicker {
            0% { opacity: ${settings.scanlineOpacity}; }
            98% { opacity: ${settings.scanlineOpacity}; }
            99% { opacity: ${settings.scanlineOpacity * 0.8}; }
            100% { opacity: ${settings.scanlineOpacity}; }
          }
        `;
        document.head.appendChild(style);
      }
    } else {
      crtElement.style.animation = 'none';
    }
    
    // Apply pixel perfect scaling
    if (settings.pixelPerfectScaling) {
      root.style.setProperty('image-rendering', 'pixelated');
      root.style.setProperty('image-rendering', '-moz-crisp-edges');
      root.style.setProperty('image-rendering', 'crisp-edges');
    } else {
      root.style.setProperty('image-rendering', 'auto');
    }
    
    // Apply reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
      // Disable all animations
      const style = document.createElement('style');
      style.id = 'reduced-motion-override';
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      // Remove existing style if present
      const existing = document.querySelector('#reduced-motion-override');
      if (existing) existing.remove();
      if (settings.reducedMotion) {
        document.head.appendChild(style);
      }
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.2s');
      const existing = document.querySelector('#reduced-motion-override');
      if (existing) existing.remove();
    }
    
    // Apply animations setting
    if (!settings.enableAnimations) {
      root.style.setProperty('--animation-duration', '0s');
      const style = document.createElement('style');
      style.id = 'disable-animations';
      style.textContent = `
        * {
          animation: none !important;
          transition: none !important;
        }
      `;
      const existing = document.querySelector('#disable-animations');
      if (existing) existing.remove();
      document.head.appendChild(style);
    } else {
      const existing = document.querySelector('#disable-animations');
      if (existing) existing.remove();
      if (!settings.reducedMotion) {
        root.style.setProperty('--animation-duration', '0.3s');
      }
    }
    
    // Apply window opacity to all retro windows and floating windows
    const windows = document.querySelectorAll('.retro-window, .floating-window');
    windows.forEach((window) => {
      (window as HTMLElement).style.opacity = settings.windowOpacity.toString();
    });
    
    // Apply color scheme to terminal elements
    const terminalElements = document.querySelectorAll('.terminal-text, .terminal-prompt, .retro-window');
    terminalElements.forEach((element) => {
      (element as HTMLElement).style.color = colors.foreground;
      (element as HTMLElement).style.backgroundColor = colors.background + '80'; // Semi-transparent
    });
    
    // Apply colors to menu items
    const menuItems = document.querySelectorAll('.retro-menu-item');
    menuItems.forEach((item) => {
      (item as HTMLElement).style.setProperty('--menu-text-color', colors.foreground);
      (item as HTMLElement).style.setProperty('--menu-accent-color', colors.accent);
    });
    
    // Save to localStorage
    localStorage.setItem('retro-bench-display-settings', JSON.stringify(settings));
    
    console.log('Display settings applied:', {
      colors,
      scanlineOpacity: settings.scanlineOpacity,
      crtFlicker: settings.crtFlicker,
      pixelPerfectScaling: settings.pixelPerfectScaling,
      enableAnimations: settings.enableAnimations,
      reducedMotion: settings.reducedMotion,
      fontSize: settings.fontSize,
      windowOpacity: settings.windowOpacity
    });
  };

  // Apply settings on mount and when settings change
  useEffect(() => {
    applySettings();
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const crtElement = document.querySelector('.crt-overlay');
      if (crtElement) {
        crtElement.remove();
      }
      const styles = document.querySelectorAll('#crt-flicker-keyframes, #reduced-motion-override, #disable-animations');
      styles.forEach(style => style.remove());
    };
  }, []);

  return (
    <DisplayContext.Provider
      value={{
        settings,
        updateSetting,
        resetToDefaults,
        applySettings,
        getColorSchemeValues,
      }}
    >
      {children}
    </DisplayContext.Provider>
  );
}; 