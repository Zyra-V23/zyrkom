import React, { useState, useEffect } from 'react';
import { Terminal } from 'lucide-react';
import RetroMenu from '../components/RetroMenu';
import RetroButton from '../components/RetroButton';
import ConfigWindow from '../components/ConfigWindow';
import BenchWindow from '../components/BenchWindow';
import MiscWindow from '../components/MiscWindow';
import DoomWindow from '../components/DoomWindow';
import WowLoginWindow from '../components/WowLoginWindow';
import { RustAttackWindow } from '../components/RustAttackWindow';
import { TorManagerWindow } from '../components/TorManagerWindow';
import { MullvadManagerWindow } from '../components/MullvadManagerWindow';
import FloatingWindow from '../components/FloatingWindow';
import { useSound } from '../contexts/SoundContext';

const MainScreen: React.FC = () => {
  const { playMenuSelect, playTyping } = useSound();
  const [text, setText] = useState('');
  const [commandLine, setCommandLine] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingRun, setIsTypingRun] = useState(false);
  const [runText, setRunText] = useState('');
  
  // Estados para ventanas flotantes
  const [showConfigWindow, setShowConfigWindow] = useState(false);
  const [showBenchWindow, setShowBenchWindow] = useState(false);
  const [showMiscWindow, setShowMiscWindow] = useState(false);
  const [showDoomWindow, setShowDoomWindow] = useState(false);
  const [showWowLoginWindow, setShowWowLoginWindow] = useState(false);
  const [showRustAttackWindow, setShowRustAttackWindow] = useState(false);
  const [rustAttackPosition, setRustAttackPosition] = useState({ x: 100, y: 100 });
  const [showTerminal, setShowTerminal] = useState(true);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'minimize' | 'restore' | null>(null);
  
  // Estado para el easter egg del fondo
  const [isMonsterMode, setIsMonsterMode] = useState(false);

  // Estado para el reloj
  const [currentTime, setCurrentTime] = useState(new Date());

  // Estados para el icono arrastrable
  const iconSize = 54; // 36 * 1.5
  const iconImgSize = 36; // 24 * 1.5
  const desktopWidth = window.innerWidth;
  const desktopHeight = window.innerHeight;
  const initialIconX = Math.floor(desktopWidth * 0.65);
  const initialIconY = Math.floor(desktopHeight * 0.55);
  const initialWowIconX = Math.floor(desktopWidth * 0.75);
  const initialWowIconY = Math.floor(desktopHeight * 0.55);

  const [iconPosition, setIconPosition] = useState({ x: initialIconX, y: initialIconY });
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [iconDragOffset, setIconDragOffset] = useState({ x: 0, y: 0 });
  const [iconSelected, setIconSelected] = useState(false);

  // Estados para el icono de WoW: Classic
  const [wowIconPosition, setWowIconPosition] = useState({ x: initialWowIconX, y: initialWowIconY });
  const [isDraggingWowIcon, setIsDraggingWowIcon] = useState(false);
  const [wowIconDragOffset, setWowIconDragOffset] = useState({ x: 0, y: 0 });
  const [wowIconSelected, setWowIconSelected] = useState(false);

  // Estados para el icono de Tor Manager
  const initialTorIconX = Math.floor(desktopWidth * 0.05);
  const initialTorIconY = Math.floor(desktopHeight * 0.15);
  const [torIconPosition, setTorIconPosition] = useState({ x: initialTorIconX, y: initialTorIconY });
  const [isDraggingTorIcon, setIsDraggingTorIcon] = useState(false);
  const [torIconDragOffset, setTorIconDragOffset] = useState({ x: 0, y: 0 });
  const [torIconSelected, setTorIconSelected] = useState(false);

  // Estados para el icono de Mullvad Manager
  const initialMullvadIconX = Math.floor(desktopWidth * 0.05);
  const initialMullvadIconY = Math.floor(desktopHeight * 0.30);
  const [mullvadIconPosition, setMullvadIconPosition] = useState({ x: initialMullvadIconX, y: initialMullvadIconY });
  const [isDraggingMullvadIcon, setIsDraggingMullvadIcon] = useState(false);
  const [mullvadIconDragOffset, setMullvadIconDragOffset] = useState({ x: 0, y: 0 });
  const [mullvadIconSelected, setMullvadIconSelected] = useState(false);

  // Estados para las ventanas de gestión de túneles
  const [showTorManager, setShowTorManager] = useState(false);
  const [showMullvadManager, setShowMullvadManager] = useState(false);
  const [torManagerPosition, setTorManagerPosition] = useState({ x: 100, y: 100 });
  const [mullvadManagerPosition, setMullvadManagerPosition] = useState({ x: 150, y: 150 });

  // Menú dinámico basado en el modo - SIN TERMINAL
  const getMenuItems = () => {
    const baseItems = [
      { label: 'GAME', key: 'GAME' },
      { label: 'CONFIG', key: 'CONFIG' },
      { label: 'BENCH', key: 'BENCH' },
      { label: 'MISC', key: 'MISC' }
    ];

    if (isMonsterMode) {
      return [
        ...baseItems,
        { label: 'DOOM', key: 'DOOM' }
      ];
    }

    return baseItems;
  };

  const fullText = `VERSION 1.0.0 (C)2025
MEMORY OK
GRAPHICS ADAPTER DETECTED
INITIALIZING BENCHMARK MODULES...
READY.

TYPE "HELP" FOR COMMANDS OR USE MENU

AVAILABLE COMMANDS:
BENCH   - RUN BENCHMARK
CATALOG - VIEW GAMES
REPORTS - VIEW REPORTS
CONFIG  - CONFIGURE SYSTEM
${isMonsterMode ? 'DOOM    - RIP AND TEAR\n' : ''}CLEAR   - CLEAR SCREEN

8=D>`;

  useEffect(() => {
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setText(fullText.substring(0, index + 1));
        index++;
        
        if (index % 4 === 0) {
          playTyping();
        }
      } else {
        clearInterval(typingInterval);
      }
    }, 30);

    return () => clearInterval(typingInterval);
  }, [playTyping]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Establecer fondo inicial
  useEffect(() => {
    // Establecer el fondo inicial al cargar el componente
    document.body.style.backgroundImage = "url('/assets/images/most-famous-windows-95-desktop-abdvzrjfnw81471k.jpg')";
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    
    // Cleanup: restaurar fondo original cuando se desmonte el componente
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
    };
  }, []);

  // Actualizar posición inicial del icono cuando cambie el tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setIconPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 36),
        y: Math.min(prev.y, window.innerHeight - 64) // 36 del taskbar + 28 del icono
      }));
      setWowIconPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 36),
        y: Math.min(prev.y, window.innerHeight - 64) // 36 del taskbar + 28 del icono
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manejo del arrastre del icono
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingIcon) {
        const newX = e.clientX - iconDragOffset.x;
        const newY = e.clientY - iconDragOffset.y;
        
        // Limitar dentro de la pantalla
        const maxX = window.innerWidth - 36;
        const maxY = window.innerHeight - 64; // 36 del taskbar + 28 del icono
        
        setIconPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
      
      if (isDraggingWowIcon) {
        const newX = e.clientX - wowIconDragOffset.x;
        const newY = e.clientY - wowIconDragOffset.y;
        
        // Limitar dentro de la pantalla
        const maxX = window.innerWidth - 36;
        const maxY = window.innerHeight - 64; // 36 del taskbar + 28 del icono
        
        setWowIconPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }

      if (isDraggingTorIcon) {
        const newX = e.clientX - torIconDragOffset.x;
        const newY = e.clientY - torIconDragOffset.y;
        
        // Limitar dentro de la pantalla
        const maxX = window.innerWidth - 36;
        const maxY = window.innerHeight - 64; // 36 del taskbar + 28 del icono
        
        setTorIconPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }

      if (isDraggingMullvadIcon) {
        const newX = e.clientX - mullvadIconDragOffset.x;
        const newY = e.clientY - mullvadIconDragOffset.y;
        
        // Limitar dentro de la pantalla
        const maxX = window.innerWidth - 36;
        const maxY = window.innerHeight - 64; // 36 del taskbar + 28 del icono
        
        setMullvadIconPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingIcon(false);
      setIsDraggingWowIcon(false);
      setIsDraggingTorIcon(false);
      setIsDraggingMullvadIcon(false);
    };

    if (isDraggingIcon || isDraggingWowIcon || isDraggingTorIcon || isDraggingMullvadIcon) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingIcon, iconDragOffset, isDraggingWowIcon, wowIconDragOffset, isDraggingTorIcon, torIconDragOffset, isDraggingMullvadIcon, mullvadIconDragOffset]);

  const typeRun = async () => {
    setIsTypingRun(true);
    setRunText('');
    const runString = 'RUN';
    
    for (let i = 0; i < runString.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setRunText(prev => prev + runString[i]);
      playTyping();
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsTypingRun(false);
    setRunText('');
  };

  const handleMenuClick = (item: any) => {
    playMenuSelect();
    
    switch (item.key) {
      case 'CONFIG':
        if (showConfigWindow) {
          setShowConfigWindow(false);
          setText(prev => `${prev}\nCLOSING CONFIGURATION...\n`);
        } else {
          setShowConfigWindow(true);
          setText(prev => `${prev}\nOPENING SYSTEM CONFIGURATION...\n`);
        }
        break;
      case 'BENCH':
        if (showBenchWindow) {
          setShowBenchWindow(false);
          setText(prev => `${prev}\nCLOSING BENCHMARK MODULE...\n`);
        } else {
          setShowBenchWindow(true);
          setText(prev => `${prev}\nOPENING BENCHMARK MODULE...\n`);
        }
        break;
      case 'MISC':
        if (showMiscWindow) {
          setShowMiscWindow(false);
          setText(prev => `${prev}\nCLOSING REPORTS MODULE...\n`);
        } else {
          setShowMiscWindow(true);
          setText(prev => `${prev}\nOPENING REPORTS MODULE...\n`);
        }
        break;
      case 'DOOM':
        if (showDoomWindow) {
          setShowDoomWindow(false);
          setText(prev => `${prev}\nCLOSING DOOM - RIP AND TEAR COMPLETE!\n`);
        } else {
          setShowDoomWindow(true);
          setText(prev => `${prev}\nLOADING DOOM - PREPARE FOR CARNAGE!\n`);
        }
        break;
      case 'GAME':
        setText(prev => `${prev}\nGAME CATALOG LOADING...\n`);
        break;
    }
  };

  const handleCommandSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      playMenuSelect();
      const command = commandLine.trim().toLowerCase();
      
      switch (command) {
        case 'help':
          const helpText = isMonsterMode 
            ? `\n\nAVAILABLE COMMANDS:\nBENCH   - RUN BENCHMARK\nCATALOG - VIEW GAMES\nREPORTS - VIEW REPORTS\nCONFIG  - CONFIGURE SYSTEM\nDOOM    - RIP AND TEAR\nCLEAR   - CLEAR SCREEN\n`
            : `\n\nAVAILABLE COMMANDS:\nBENCH   - RUN BENCHMARK\nCATALOG - VIEW GAMES\nREPORTS - VIEW REPORTS\nCONFIG  - CONFIGURE SYSTEM\nCLEAR   - CLEAR SCREEN\n`;
          setText(prev => `${prev}${helpText}`);
          break;
        case 'bench':
          if (showBenchWindow) {
            setShowBenchWindow(false);
            setText(prev => `${prev}\nCLOSING BENCHMARK MODULE...\n`);
          } else {
            setShowBenchWindow(true);
            setText(prev => `${prev}\nOPENING BENCHMARK MODULE...\n`);
          }
          break;
        case 'catalog':
          setText(prev => `${prev}\nGAME CATALOG LOADING...\n`);
          break;
        case 'reports':
          if (showMiscWindow) {
            setShowMiscWindow(false);
            setText(prev => `${prev}\nCLOSING REPORTS MODULE...\n`);
          } else {
            setShowMiscWindow(true);
            setText(prev => `${prev}\nOPENING REPORTS MODULE...\n`);
          }
          break;
        case 'config':
          if (showConfigWindow) {
            setShowConfigWindow(false);
            setText(prev => `${prev}\nCLOSING SYSTEM CONFIGURATION...\n`);
          } else {
            setShowConfigWindow(true);
            setText(prev => `${prev}\nOPENING SYSTEM CONFIGURATION...\n`);
          }
          break;
        case 'doom':
          if (isMonsterMode) {
            if (showDoomWindow) {
              setShowDoomWindow(false);
              setText(prev => `${prev}\nCLOSING DOOM - RIP AND TEAR COMPLETE!\n`);
            } else {
              setShowDoomWindow(true);
              setText(prev => `${prev}\nLOADING DOOM - PREPARE FOR CARNAGE!\n`);
            }
          } else {
            setText(prev => `${prev}\nUNKNOWN COMMAND: ${commandLine}\n`);
          }
          break;
        case 'clear':
          setText('');
          break;
        case 'iddqd':
          toggleMonsterMode();
          break;
        default:
          setText(prev => `${prev}\nUNKNOWN COMMAND: ${commandLine}\n`);
      }
      
      await typeRun();
      setText(prev => `${prev}\n8=D>`);
      setCommandLine('');
    }
  };

  // Función para alternar el fondo
  const toggleMonsterMode = () => {
    setIsMonsterMode(!isMonsterMode);
    playMenuSelect();
    
    if (!isMonsterMode) {
      setText(prev => `${prev}\nIDDQD ACTIVATED - MONSTER MODE ON!\n`);
      // Cambiar el fondo del body
      document.body.style.backgroundImage = "url('/assets/images/windows-95-monster-landscape-kbgpiby14kfezqme.jpg')";
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      setText(prev => `${prev}\nMONSTER MODE DEACTIVATED\n`);
      // Volver al fondo original
      document.body.style.backgroundImage = "url('/assets/images/most-famous-windows-95-desktop-abdvzrjfnw81471k.jpg')";
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    }
  };

  // Función para minimizar terminal con animación
  const minimizeTerminal = () => {
    setIsAnimating(true);
    setAnimationType('minimize');
    setText(prev => `${prev}\nTERMINAL MINIMIZED TO TASKBAR...\n`);
    
    // Después de la animación, ocultar la ventana
    setTimeout(() => {
      setIsTerminalMinimized(true);
      setShowTerminal(false);
      setIsAnimating(false);
      setAnimationType(null);
    }, 300);
  };

  // Función para restaurar terminal con animación
  const restoreTerminal = () => {
    setIsTerminalMinimized(false);
    setShowTerminal(true);
    setIsAnimating(true);
    setAnimationType('restore');
    setText(prev => `${prev}\nTERMINAL RESTORED...\n`);
    
    // Después de la animación, limpiar estados
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, 300);
  };

  // Manejo del icono arrastrable
  const handleIconMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIconSelected(true);
    setIconDragOffset({
      x: e.clientX - iconPosition.x,
      y: e.clientY - iconPosition.y
    });
    setIsDraggingIcon(true);
    playTyping(); // Sonido de selección
  };

  // Click simple: solo selecciona el icono
  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // No hace nada más que seleccionar
  };

  // Doble click: activa/desactiva DOOM
  const handleIconDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDraggingIcon) {
      toggleMonsterMode();
    }
  };

  // Manejo del icono de WoW
  const handleWowIconMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setWowIconSelected(true);
    setWowIconDragOffset({
      x: e.clientX - wowIconPosition.x,
      y: e.clientY - wowIconPosition.y
    });
    setIsDraggingWowIcon(true);
    playTyping(); // Sonido de selección
  };

  const handleWowIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // No hace nada más que seleccionar
  };

  const handleWowIconDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isDraggingWowIcon) {
      setShowWowLoginWindow(true);
      playMenuSelect();
    }
  };

  // Deseleccionar icono al hacer clic en otro lugar
  const handleDesktopClick = () => {
    setIconSelected(false);
    setWowIconSelected(false);
    setTorIconSelected(false);
    setMullvadIconSelected(false);
  };

  // Manejar login exitoso de WoW
  const handleWowLogin = () => {
    setShowWowLoginWindow(true);
  };

  // Funciones para el icono de Tor Manager
  const handleTorIconMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingTorIcon(true);
    setTorIconDragOffset({
      x: e.clientX - torIconPosition.x,
      y: e.clientY - torIconPosition.y
    });
  };

  const handleTorIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTorIconSelected(true);
    setIconSelected(false);
    setWowIconSelected(false);
    setMullvadIconSelected(false);
  };

  const handleTorIconDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playMenuSelect();
    setShowTorManager(true);
  };

  // Funciones para el icono de Mullvad Manager
  const handleMullvadIconMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingMullvadIcon(true);
    setMullvadIconDragOffset({
      x: e.clientX - mullvadIconPosition.x,
      y: e.clientY - mullvadIconPosition.y
    });
  };

  const handleMullvadIconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMullvadIconSelected(true);
    setIconSelected(false);
    setWowIconSelected(false);
    setTorIconSelected(false);
  };

  const handleMullvadIconDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playMenuSelect();
    setShowMullvadManager(true);
  };

  return (
    <div 
      className="flex flex-col h-full text-[#00ff00] font-['Press_Start_2P']" 
      style={{ 
      background: 'transparent',
      position: 'relative',
      zIndex: 10
      }}
      onClick={handleDesktopClick}
    >
      <RetroMenu items={getMenuItems()} onMenuClick={handleMenuClick} />
      
      <div className="flex-1 p-4" style={{ position: 'relative', zIndex: 10 }}>
        <div className="flex items-center justify-center mb-6 mx-auto" style={{ 
          backgroundColor: isMonsterMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 100, 200, 0.2)', 
          padding: isMonsterMode ? '12px' : '16px', 
          borderRadius: '8px',
          border: isMonsterMode ? '1px solid rgba(255, 0, 0, 0.3)' : '2px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(15px)',
          boxShadow: isMonsterMode ? `
            0 2px 10px rgba(255, 0, 0, 0.2), 
            0 0 15px rgba(255, 0, 0, 0.1),
            inset 0 0 10px rgba(0, 0, 0, 0.2)
          ` : '0 4px 15px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10,
          maxWidth: isMonsterMode ? '768px' : 'auto',
          width: isMonsterMode ? '768px' : 'auto'
        }}>
          {!isMonsterMode ? (
            <>
              <Terminal className="w-12 h-12 mr-2" style={{ color: '#ffffff' }} />
              <h1 className="text-2xl font-bold" style={{ color: '#ffffff', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>RETRO BENCH</h1>
            </>
          ) : (
            <pre style={{ 
              color: '#ff0000', 
              fontSize: '8px', 
              lineHeight: '1',
              textShadow: `
                0 0 3px #ff0000,
                0 0 6px #cc0000,
                0 0 9px #990000,
                1px 1px 0px #000000,
                2px 2px 0px #000000,
                3px 3px 0px #000000,
                0 0 15px rgba(255, 0, 0, 0.5)
              `,
              fontFamily: 'monospace',
              margin: '0 auto',
              whiteSpace: 'pre',
              textAlign: 'center',
              background: 'linear-gradient(45deg, rgba(0,0,0,0.1), rgba(20,0,0,0.2))',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 0, 0, 0.2)',
              filter: 'contrast(1.2) brightness(1.1)',
              display: 'block',
              width: 'fit-content'
            }}>
{`=================     ===============     ===============   ========  ========
\\ . . . . . . .\\   //. . . . . . .\\   //. . . . . . .\\  \\. . .\\// . . //
||. . ._____. . .|| ||. . ._____. . .|| ||. . ._____. . .|| || . . .\/ . . .||
|| . .||   ||. . || || . .||   ||. . || || . .||   ||. . || ||. . . . . . . ||
||. . ||   || . .|| ||. . ||   || . .|| ||. . ||   || . .|| || . | . . . . .||
|| . .||   ||. _-|| ||-_ .||   ||. . || || . .||   ||. _-|| ||-_.|\ . . . . ||
||. . ||   ||-'  || ||  \`-||   || . .|| ||. . ||   ||-'  || ||  \`|\_ . .|. .||
|| . _||   ||    || ||    ||   ||_ . || || . _||   ||    || ||   |\\ \`-_/| . ||
||_-' ||  .|/    || ||    \\|.  || \`-_|| ||_-' ||  .|/    || ||   | \\  / |-_.||
||    ||_-'      || ||      \`-_||    || ||    ||_-'      || ||   | \\  / |  \`||
||    \`'         || ||         \`'    || ||    \`'         || ||   | \\  / |   ||
||            .===' \`===.         .==='\`===.         .===' /==. |  \\/  |   ||
||         .=='   \\_|-_ \`===. .==='   _|_   \`===. .===' _-|/   \`==  \\/  |   ||
||      .=='    _-'    \`-_  \`='    _-'   \`-_    \`='  _-'   \`-_  /|  \\/  |   ||
||   .=='    _-'          \`-__\\._-'         \`-_./__-'         \`' |. /|  |   ||
||.=='    _-'                                                     \`' |  /==.||
=='    _-'                                                            \\/   \`==
\\   _-'                                                                \`-_   /
 \`''                                                                      \`\`'`}
            </pre>
          )}
        </div>
        
        {/* Sin mensaje de bienvenida - se quita completamente */}
      </div>
      
      {/* Taskbar - Windows 95 style */}
      <div style={{
        backgroundColor: '#c0c0c0',
        borderTop: '2px outset #c0c0c0',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        height: '28px',
          position: 'relative',
        zIndex: 20
      }}>
        {/* Start button */}
        <div style={{
          backgroundColor: '#c0c0c0',
          border: '2px outset #c0c0c0',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: '#000000'
        }}>
          Start
        </div>
        
        {/* Taskbar buttons */}
        {isTerminalMinimized && (
          <div 
            onClick={restoreTerminal}
            className="taskbar-button"
            style={{
              backgroundColor: '#c0c0c0',
              border: '1px inset #c0c0c0',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'MS Sans Serif, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#000000'
            }}
          >
            <Terminal size={12} />
            MS-DOS Prompt
              </div>
        )}
        
        {!showConfigWindow && (
          <div 
            onClick={() => setShowConfigWindow(true)}
            className="taskbar-button"
            style={{
              backgroundColor: '#c0c0c0',
              border: '1px inset #c0c0c0',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'MS Sans Serif, sans-serif',
              color: '#000000'
            }}
          >
            Configuration
          </div>
        )}
        
        {!showBenchWindow && (
          <div 
            onClick={() => setShowBenchWindow(true)}
            className="taskbar-button"
            style={{
              backgroundColor: '#c0c0c0',
              border: '1px inset #c0c0c0',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'MS Sans Serif, sans-serif',
              color: '#000000'
            }}
          >
            Benchmark
        </div>
        )}
        
        {!showMiscWindow && (
          <div 
            onClick={() => setShowMiscWindow(true)}
            className="taskbar-button"
              style={{
              backgroundColor: '#c0c0c0',
              border: '1px inset #c0c0c0',
              padding: '2px 8px',
              fontSize: '10px',
                cursor: 'pointer',
              fontFamily: 'MS Sans Serif, sans-serif',
              color: '#000000'
              }}
          >
            Reports
          </div>
        )}
        
        {!showDoomWindow && isMonsterMode && (
          <div 
            onClick={() => setShowDoomWindow(true)}
            className="taskbar-button"
            style={{
              backgroundColor: '#c0c0c0',
              border: '1px inset #c0c0c0',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'MS Sans Serif, sans-serif',
              color: '#000000'
              }}
            >
            DOOM
            </div>
          )}
        
        {/* Clock */}
        <div style={{
          marginLeft: 'auto',
          backgroundColor: '#c0c0c0',
          border: '1px inset #c0c0c0',
          padding: '2px 8px',
          fontSize: '10px',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: '#000000'
        }}>
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      
      <footer className="p-2 text-center text-xs" style={{
        backgroundColor: 'rgba(0, 80, 160, 0.4)',
        borderTop: '1px solid rgba(255, 255, 255, 0.3)',
        backdropFilter: 'blur(5px)',
        color: '#ffffff',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        zIndex: 10
      }}>
        {isMonsterMode ? (
          <span style={{ 
            color: '#ff0000', 
            textShadow: `
              0 0 3px #ff0000,
              0 0 6px #cc0000,
              1px 1px 0px #000000,
              2px 2px 0px #000000,
              0 0 10px rgba(255, 0, 0, 0.5)
            `,
            fontWeight: 'bold'
          }}>
            DOOM MODE ACTIVATED - RIP AND TEAR UNTIL IT IS DONE
          </span>
        ) : (
          "RETRO BENCH V1.0.0 (C)2025 - PRESS F1 FOR HELP"
        )}
      </footer>

      {/* Floating Terminal Window */}
      {showTerminal && (
        <FloatingWindow
          title="MS-DOS Prompt - C:\RETROBENCH"
          onClose={minimizeTerminal}
          initialX={100}
          initialY={100}
          width={600}
          height={400}
          buttonType="minimize"
          className={isAnimating ? `window-${animationType}` : ''}
        >
          <div style={{
            backgroundColor: '#000000',
            color: '#c0c0c0',
            padding: '8px',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            lineHeight: '1.2',
            height: '100%',
            overflow: 'auto'
          }}>
            <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
              {!isTypingRun ? (
                <>
                  <span style={{ color: '#c0c0c0' }}>C:\RETROBENCH&gt;</span>
                  <div style={{ position: 'relative', flex: 1, marginLeft: '4px' }}>
                    <input
                      type="text"
                      value={commandLine}
                      onChange={e => setCommandLine(e.target.value)}
                      onKeyDown={handleCommandSubmit}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#c0c0c0',
                        fontFamily: "'Courier New', monospace",
                        fontSize: '12px',
                        width: '100%',
                        caretColor: 'transparent'
                      }}
                      autoFocus
                    />
                    {showCursor && (
                      <div style={{
                        position: 'absolute',
                        left: `${commandLine.length * 7.2}px`,
                        top: '1px',
                        width: '7px',
                        height: '12px',
                        backgroundColor: '#c0c0c0',
                        animation: 'terminal-blink 1s infinite'
                      }} />
                    )}
                  </div>
                </>
              ) : (
                <span style={{ color: '#c0c0c0' }}>{runText}</span>
              )}
            </div>
          </div>
        </FloatingWindow>
      )}

      {/* Ventanas flotantes */}
      {showConfigWindow && (
        <ConfigWindow 
          onClose={() => setShowConfigWindow(false)} 
        />
      )}
      {showBenchWindow && (
        <BenchWindow onClose={() => setShowBenchWindow(false)} />
      )}
      {showMiscWindow && (
        <MiscWindow onClose={() => setShowMiscWindow(false)} />
      )}
      {showDoomWindow && (
        <DoomWindow onClose={() => setShowDoomWindow(false)} />
      )}
      
      {showWowLoginWindow && (
        <WowLoginWindow 
          onClose={() => setShowWowLoginWindow(false)}
          onLogin={handleWowLogin}
        />
      )}
      
      {showRustAttackWindow && (
        <RustAttackWindow
          isOpen={showRustAttackWindow}
          onClose={() => setShowRustAttackWindow(false)}
          position={rustAttackPosition}
          onPositionChange={setRustAttackPosition}
        />
      )}
      
      {/* Ventanas de gestión de túneles */}
      {showTorManager && (
        <TorManagerWindow
          isOpen={showTorManager}
          onClose={() => setShowTorManager(false)}
          position={torManagerPosition}
          onPositionChange={setTorManagerPosition}
        />
      )}

      {showMullvadManager && (
        <MullvadManagerWindow
          isOpen={showMullvadManager}
          onClose={() => setShowMullvadManager(false)}
          position={mullvadManagerPosition}
          onPositionChange={setMullvadManagerPosition}
        />
      )}
      
      {/* Icono arrastrable de DOOM */}
      <div 
        className={`desktop-icon ${iconSelected ? 'selected' : ''} ${isMonsterMode ? 'monster-mode' : 'normal-mode'}`}
        style={{
          position: 'fixed',
          left: iconPosition.x,
          top: iconPosition.y,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingIcon ? 'grabbing' : 'grab',
          zIndex: isDraggingIcon ? 100 : 10,
          userSelect: 'none',
          padding: '2px',
          borderRadius: '2px',
          transition: isDraggingIcon ? 'none' : 'all 0.2s ease'
        }}
        onMouseDown={handleIconMouseDown}
        onClick={handleIconClick}
        onDoubleClick={handleIconDoubleClick}
        title={isMonsterMode ? "Deactivate Monster Mode (IDDQD)" : "Activate Monster Mode (IDDQD)"}
      >
        <div style={{
          width: `${iconImgSize}px`,
          height: `${iconImgSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px'
        }}>
        {isMonsterMode ? (
            <span style={{ fontSize: '16px' }}>💀</span>
        ) : (
          <img 
              src="/assets/images/107875047-8c7bed80-6eb5-11eb-92b0-5580b2a4ec51.png" 
            alt="DOOM Icon"
              style={{
                width: `${iconImgSize}px`,
                height: `${iconImgSize}px`,
                imageRendering: 'pixelated',
                filter: 'contrast(1.2) brightness(1.1)',
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
        <div style={{
          fontSize: '8px',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: iconSelected ? '#ffffff' : (isMonsterMode ? '#ff0000' : '#000000'),
          textAlign: 'center',
          lineHeight: '1',
          textShadow: iconSelected ? '1px 1px 0px #000000' : 'none',
          fontWeight: 'normal',
          pointerEvents: 'none'
        }}>
          DOOM
        </div>
      </div>

      {/* Icono arrastrable de WoW: Classic */}
      <div 
        className={`desktop-icon ${wowIconSelected ? 'selected' : ''}`}
        style={{
          position: 'fixed',
          left: wowIconPosition.x,
          top: wowIconPosition.y,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingWowIcon ? 'grabbing' : 'grab',
          zIndex: isDraggingWowIcon ? 100 : 10,
          userSelect: 'none',
          padding: '2px',
          borderRadius: '2px',
          transition: isDraggingWowIcon ? 'none' : 'all 0.2s ease',
          backgroundColor: wowIconSelected ? 'rgba(0, 0, 255, 0.3)' : 'transparent'
        }}
        onMouseDown={handleWowIconMouseDown}
        onClick={handleWowIconClick}
        onDoubleClick={handleWowIconDoubleClick}
        title="World of Warcraft: Classic"
      >
        <div style={{
          width: `${iconImgSize}px`,
          height: `${iconImgSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px'
        }}>
          <img 
            src="/assets/images/256x256.png" 
            alt="WoW Classic Icon"
            style={{
              width: `${iconImgSize}px`,
              height: `${iconImgSize}px`,
              imageRendering: 'pixelated',
              filter: 'contrast(1.2) brightness(1.1)',
              pointerEvents: 'none'
            }}
          />
        </div>
        <div style={{
          fontSize: '8px',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: wowIconSelected ? '#ffffff' : '#000000',
          textAlign: 'center',
          lineHeight: '1',
          textShadow: wowIconSelected ? '1px 1px 0px #000000' : 'none',
          fontWeight: 'normal',
          pointerEvents: 'none'
        }}>
          WoW Classic
        </div>
      </div>

      {/* Icono arrastrable de Tor Manager */}
      <div 
        className={`desktop-icon ${torIconSelected ? 'selected' : ''}`}
        style={{
          position: 'fixed',
          left: torIconPosition.x,
          top: torIconPosition.y,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingTorIcon ? 'grabbing' : 'grab',
          zIndex: isDraggingTorIcon ? 100 : 10,
          userSelect: 'none',
          padding: '2px',
          borderRadius: '2px',
          transition: isDraggingTorIcon ? 'none' : 'all 0.2s ease',
          backgroundColor: torIconSelected ? 'rgba(0, 0, 255, 0.3)' : 'transparent'
        }}
        onMouseDown={handleTorIconMouseDown}
        onClick={handleTorIconClick}
        onDoubleClick={handleTorIconDoubleClick}
        title="Tor Network Manager - Privacy & Anonymity"
      >
        <div style={{
          width: `${iconImgSize}px`,
          height: `${iconImgSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px'
        }}>
          <img 
            src="/assets/images/862810.png" 
            alt="Tor Manager Icon"
            style={{
              width: `${iconImgSize}px`,
              height: `${iconImgSize}px`,
              imageRendering: 'pixelated',
              filter: 'contrast(1.2) brightness(1.1)',
              pointerEvents: 'none'
            }}
          />
        </div>
        <div style={{
          fontSize: '8px',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: torIconSelected ? '#ffffff' : '#000000',
          textAlign: 'center',
          lineHeight: '1',
          textShadow: torIconSelected ? '1px 1px 0px #000000' : 'none',
          fontWeight: 'normal',
          pointerEvents: 'none'
        }}>
          Tor Manager
        </div>
      </div>

      {/* Icono arrastrable de Mullvad Manager */}
      <div 
        className={`desktop-icon ${mullvadIconSelected ? 'selected' : ''}`}
        style={{
          position: 'fixed',
          left: mullvadIconPosition.x,
          top: mullvadIconPosition.y,
          width: `${iconSize}px`,
          height: `${iconSize}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDraggingMullvadIcon ? 'grabbing' : 'grab',
          zIndex: isDraggingMullvadIcon ? 100 : 10,
          userSelect: 'none',
          padding: '2px',
          borderRadius: '2px',
          transition: isDraggingMullvadIcon ? 'none' : 'all 0.2s ease',
          backgroundColor: mullvadIconSelected ? 'rgba(0, 0, 255, 0.3)' : 'transparent'
        }}
        onMouseDown={handleMullvadIconMouseDown}
        onClick={handleMullvadIconClick}
        onDoubleClick={handleMullvadIconDoubleClick}
        title="Mullvad VPN Manager - Secure & Private Internet"
      >
        <div style={{
          width: `${iconImgSize}px`,
          height: `${iconImgSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '2px'
        }}>
          <img 
            src="/assets/images/44f4eef473735bc37b9896b60bd911d95d0fc3f4_2_499x499.png" 
            alt="Mullvad VPN Manager Icon"
            style={{
              width: `${iconImgSize}px`,
              height: `${iconImgSize}px`,
              imageRendering: 'pixelated',
              filter: 'contrast(1.2) brightness(1.1)',
              pointerEvents: 'none'
            }}
          />
        </div>
        <div style={{
          fontSize: '8px',
          fontFamily: 'MS Sans Serif, sans-serif',
          color: mullvadIconSelected ? '#ffffff' : '#000000',
          textAlign: 'center',
          lineHeight: '1',
          textShadow: mullvadIconSelected ? '1px 1px 0px #000000' : 'none',
          fontWeight: 'normal',
          pointerEvents: 'none'
        }}>
          Mullvad VPN
        </div>
      </div>
    </div>
  );
};

export default MainScreen;