import React, { useState, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';
import { torMullvadManager, MullvadStatus, MullvadLocation } from '../utils/torMullvadManager';

interface MullvadManagerWindowProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

export const MullvadManagerWindow: React.FC<MullvadManagerWindowProps> = ({
  isOpen,
  onClose,
  position,
  onPositionChange
}) => {
  const [mullvadStatus, setMullvadStatus] = useState<MullvadStatus>({ connected: false, location: null, ip: null });
  const [availableLocations, setAvailableLocations] = useState<MullvadLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      checkMullvadStatus();
      loadAvailableLocations();
      // Verificar estado cada 10 segundos
      const interval = setInterval(checkMullvadStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const checkMullvadStatus = async () => {
    try {
      const status = await torMullvadManager.getMullvadStatus();
      setMullvadStatus(status);
    } catch (error) {
      console.error('Error verificando estado de Mullvad:', error);
      addLog(`❌ Error verificando estado: ${error}`);
    }
  };

  const loadAvailableLocations = async () => {
    try {
      const locations = await torMullvadManager.getMullvadLocations();
      setAvailableLocations(locations);
      if (locations.length > 0 && !selectedLocation) {
        setSelectedLocation(locations[0].code);
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
      addLog(`❌ Error cargando ubicaciones: ${error}`);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const handleConnect = async () => {
    setIsLoading(true);
    addLog('🔒 Conectando a Mullvad VPN...');
    
    try {
      const result = await torMullvadManager.connectMullvad();
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        // Actualizar estado después de un momento
        setTimeout(checkMullvadStatus, 2000);
      } else {
        addLog(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      addLog(`❌ Error conectando: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    addLog('🔓 Desconectando Mullvad VPN...');
    
    try {
      const result = await torMullvadManager.disconnectMullvad();
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        setMullvadStatus({ connected: false, location: null, ip: null });
      } else {
        addLog(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeLocation = async () => {
    if (!selectedLocation) return;
    
    setIsLoading(true);
    const selectedLocationObj = availableLocations.find(loc => loc.code === selectedLocation);
    const locationName = selectedLocationObj ? selectedLocationObj.name : selectedLocation;
    addLog(`🌍 Cambiando ubicación a ${locationName}...`);
    
    try {
      const result = await torMullvadManager.setMullvadLocation(selectedLocation);
      
      if (result.success) {
        addLog(`✅ ${result.message}`);
        // Verificar nuevo estado después de cambiar
        setTimeout(checkMullvadStatus, 3000);
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
      title="🔒 Mullvad VPN Manager v1.0"
      onClose={onClose}
      initialX={position.x}
      initialY={position.y}
      width={500}
      height={450}
      minWidth={420}
      minHeight={380}
      maxWidth={650}
      maxHeight={550}
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
            🔒 MULLVAD VPN STATUS
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
              backgroundColor: mullvadStatus.connected ? '#00ff00' : '#ff0000',
              border: '1px solid #000000'
            }} />
            <span style={{ fontWeight: 'bold' }}>
              {mullvadStatus.connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          
          {mullvadStatus.connected && (
            <div style={{ marginTop: '6px', fontSize: '8px' }}>
              {mullvadStatus.location && (
                <div style={{ marginBottom: '2px' }}>
                  <span style={{ fontWeight: 'bold' }}>Location:</span> {mullvadStatus.location}
                </div>
              )}
              {mullvadStatus.ip && (
                <div style={{
                  backgroundColor: '#f0f0f0',
                  border: '1px inset #c0c0c0',
                  padding: '2px 4px',
                  fontFamily: 'monospace',
                  fontSize: '7px'
                }}>
                  IP: {mullvadStatus.ip}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles de conexión */}
        <div style={{
          backgroundColor: '#f0f0f0',
          border: '1px solid #808080',
          padding: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '10px' }}>
            CONNECTION CONTROLS
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
            <button
              onClick={handleConnect}
              disabled={isLoading || mullvadStatus.connected}
              style={{
                padding: '4px 8px',
                backgroundColor: mullvadStatus.connected ? '#d0d0d0' : '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: (isLoading || mullvadStatus.connected) ? 'not-allowed' : 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              {isLoading ? '⏳ CONNECTING...' : '🚀 CONNECT'}
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={isLoading || !mullvadStatus.connected}
              style={{
                padding: '4px 8px',
                backgroundColor: !mullvadStatus.connected ? '#d0d0d0' : '#c0c0c0',
                border: '1px outset #c0c0c0',
                cursor: (isLoading || !mullvadStatus.connected) ? 'not-allowed' : 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              {isLoading ? '⏳ DISCONNECTING...' : '🛑 DISCONNECT'}
            </button>

            <button
              onClick={checkMullvadStatus}
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

          {/* Selector de ubicación */}
          <div style={{ fontSize: '9px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              CHANGE LOCATION:
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '2px',
                  border: '1px inset #c0c0c0',
                  backgroundColor: '#ffffff',
                  fontSize: '8px',
                  fontFamily: 'var(--font-pixel)'
                }}
              >
                {availableLocations.map((location) => (
                  <option key={location.code} value={location.code}>
                    {location.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleChangeLocation}
                disabled={isLoading || !selectedLocation}
                style={{
                  padding: '2px 6px',
                  backgroundColor: '#c0c0c0',
                  border: '1px outset #c0c0c0',
                  cursor: (isLoading || !selectedLocation) ? 'not-allowed' : 'pointer',
                  fontSize: '8px',
                  fontFamily: 'var(--font-pixel)',
                  color: '#000000'
                }}
              >
                APPLY
              </button>
            </div>
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
            minHeight: '100px'
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
          Mullvad VPN Manager • Secure & Private Internet • v1.0
        </div>
      </div>
    </FloatingWindow>
  );
}; 