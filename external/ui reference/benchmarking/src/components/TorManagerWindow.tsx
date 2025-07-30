import React, { useState, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';
import { torMullvadManager, TorStatus } from '../utils/torMullvadManager';

interface TorManagerWindowProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const TorManagerWindow: React.FC<TorManagerWindowProps> = ({
  isOpen,
  onClose,
  position,
  onPositionChange
}) => {
  const [torStatus, setTorStatus] = useState<TorStatus>({ running: false, pid: null, onionAddress: null });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      checkTorStatus();
      // Verificar estado cada 5 segundos
      const interval = setInterval(checkTorStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const checkTorStatus = async () => {
    try {
      const status = await torMullvadManager.getTorStatus();
      setTorStatus(status);
    } catch (error) {
      console.error('Error verificando estado de Tor:', error);
      addLog(`❌ Error verificando estado: ${error}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const handleStartTor = async () => {
    setIsLoading(true);
    addLog('🧅 Iniciando túnel Tor...');
    
    try {
      const result = await torMullvadManager.startTor();
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        if (result.pid) {
          addLog(`🔧 PID: ${result.pid}`);
        }
        // Actualizar estado después de un momento
        setTimeout(checkTorStatus, 2000);
      } else {
        addLog(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      addLog(`❌ Error iniciando Tor: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTor = async () => {
    setIsLoading(true);
    addLog('🛑 Deteniendo túnel Tor...');
    
    try {
      const result = await torMullvadManager.stopTor();
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        setTorStatus({ running: false, pid: null, onionAddress: null });
      } else {
        addLog(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  if (!isOpen) return null;

  return (
    <FloatingWindow
      title="🧅 Tor Network Manager v1.0"
      onClose={onClose}
      initialX={position.x}
      initialY={position.y}
      width={480}
      height={420}
      minWidth={400}
      minHeight={350}
      maxWidth={600}
      maxHeight={500}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Estado actual */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px inset #c0c0c0',
          padding: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}>
            🧅 TOR NETWORK STATUS
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '9px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: torStatus.running ? '#00ff00' : '#ff0000',
              border: '1px solid #000000'
            }} />
            <span style={{ fontWeight: 'bold' }}>
              {torStatus.running ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
            {torStatus.pid && (
              <span style={{ color: '#666666' }}>PID: {torStatus.pid}</span>
            )}
          </div>
          
          {torStatus.onionAddress && (
            <div style={{ marginTop: '4px', fontSize: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>Onion Address:</div>
              <div style={{
                backgroundColor: '#f0f0f0',
                border: '1px inset #c0c0c0',
                padding: '2px 4px',
                fontFamily: 'monospace',
                fontSize: '7px',
                wordBreak: 'break-all'
              }}>
                {torStatus.onionAddress}
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div style={{
          backgroundColor: '#f0f0f0',
          border: '1px solid #808080',
          padding: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '10px' }}>
            TUNNEL CONTROLS
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleStartTor}
              disabled={isLoading || torStatus.running}
              style={{
                padding: '4px 8px',
                backgroundColor: torStatus.running ? '#d0d0d0' : '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: (isLoading || torStatus.running) ? 'not-allowed' : 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              {isLoading ? '⏳ STARTING...' : '🚀 START TOR'}
            </button>
            
            <button
              onClick={handleStopTor}
              disabled={isLoading || !torStatus.running}
              style={{
                padding: '4px 8px',
                backgroundColor: !torStatus.running ? '#d0d0d0' : '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: (isLoading || !torStatus.running) ? 'not-allowed' : 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              {isLoading ? '⏳ STOPPING...' : '🛑 STOP TOR'}
            </button>

            <button
              onClick={checkTorStatus}
              disabled={isLoading}
              style={{
                padding: '4px 8px',
                backgroundColor: '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              🔄 REFRESH
            </button>
          </div>
        </div>

        {/* Logs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px' }}>
              ACTIVITY LOG
            </div>
            <button
              onClick={clearLogs}
              style={{
                padding: '2px 6px',
                backgroundColor: '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: 'pointer',
                fontSize: '8px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              CLEAR
            </button>
          </div>
          
          <div style={{
            flex: 1,
            backgroundColor: '#000000',
            color: '#00ff00',
            border: '2px inset #c0c0c0',
            padding: '4px',
            fontFamily: 'monospace',
            fontSize: '8px',
            overflow: 'auto',
            minHeight: '120px'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666666' }}>No activity logged yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '8px',
          paddingTop: '4px',
          borderTop: '1px solid #808080',
          fontSize: '8px',
          color: '#666666',
          textAlign: 'center'
        }}>
          Tor Network Manager • Privacy & Anonymity Tool • v1.0
        </div>
      </div>
    </FloatingWindow>
  );
}; 