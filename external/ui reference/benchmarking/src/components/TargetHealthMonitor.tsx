import React, { useState, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';

interface TargetHealthMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  attackStats: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    blockedRequests: number;
    requestsPerSecond: number;
    uptime: number;
    currentPhase: string;
  };
}

interface HealthMetrics {
  responseTime: number;
  availability: number;
  errorRate: number;
  serverLoad: number;
  lastChecked: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'DOWN';
  consecutiveFailures: number;
}

export const TargetHealthMonitor: React.FC<TargetHealthMonitorProps> = ({
  isOpen,
  onClose,
  targetUrl,
  attackStats,
}) => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics>({
    responseTime: 0,
    availability: 100,
    errorRate: 0,
    serverLoad: 0,
    lastChecked: new Date().toISOString(),
    status: 'HEALTHY',
    consecutiveFailures: 0,
  });

  const [healthHistory, setHealthHistory] = useState<Array<{
    timestamp: string;
    responseTime: number;
    status: number;
  }>>([]);

  // Real health monitoring - ping target every 2 seconds
  useEffect(() => {
    if (!isOpen) return;

    const monitorHealth = async () => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(targetUrl, {
          method: 'HEAD',
          mode: 'no-cors', // Avoid CORS issues
          cache: 'no-cache',
        });
        
        const responseTime = Date.now() - startTime;
        const timestamp = new Date().toISOString();
        
        // Update health history
        setHealthHistory(prev => {
          const newHistory = [...prev, {
            timestamp,
            responseTime,
            status: response.status || 200,
          }];
          return newHistory.slice(-30); // Keep last 30 measurements
        });

        // Calculate metrics based on attack stats and response
        const errorRate = attackStats.totalRequests > 0 
          ? ((attackStats.failedRequests + attackStats.blockedRequests) / attackStats.totalRequests) * 100 
          : 0;
        
        const availability = attackStats.totalRequests > 0 
          ? (attackStats.successfulRequests / attackStats.totalRequests) * 100 
          : 100;

        // Estimate server load based on response time and error rate
        const baseLoad = Math.min((responseTime / 1000) * 10, 100);
        const attackLoad = Math.min((attackStats.requestsPerSecond / 10) * 20, 100);
        const errorLoad = errorRate * 2;
        const serverLoad = Math.min(baseLoad + attackLoad + errorLoad, 100);

        // Determine status
        let status: HealthMetrics['status'] = 'HEALTHY';
        let consecutiveFailures = 0;

        if (responseTime > 10000 || errorRate > 50) {
          status = 'CRITICAL';
          consecutiveFailures = healthMetrics.consecutiveFailures + 1;
        } else if (responseTime > 5000 || errorRate > 25) {
          status = 'DEGRADED';
          consecutiveFailures = healthMetrics.consecutiveFailures + 1;
        } else if (responseTime > 2000 || errorRate > 10) {
          status = 'DEGRADED';
        } else {
          consecutiveFailures = 0;
        }

        setHealthMetrics({
          responseTime,
          availability,
          errorRate,
          serverLoad,
          lastChecked: timestamp,
          status,
          consecutiveFailures,
        });

      } catch (error) {
        // Target is likely down or blocking requests
        const responseTime = Date.now() - startTime;
        
        setHealthMetrics(prev => ({
          ...prev,
          responseTime,
          availability: 0,
          errorRate: 100,
          serverLoad: 100,
          lastChecked: new Date().toISOString(),
          status: 'DOWN',
          consecutiveFailures: prev.consecutiveFailures + 1,
        }));
      }
    };

    // Initial check
    monitorHealth();
    
    // Set up interval for continuous monitoring
    const interval = setInterval(monitorHealth, 2000);
    
    return () => clearInterval(interval);
  }, [isOpen, targetUrl, attackStats]);

  if (!isOpen) return null;

  const getStatusColor = (status: HealthMetrics['status']) => {
    switch (status) {
      case 'HEALTHY': return '#00ff00';
      case 'DEGRADED': return '#ffff00';
      case 'CRITICAL': return '#ff8800';
      case 'DOWN': return '#ff0000';
      default: return '#666';
    }
  };

  const getLoadBarColor = (load: number) => {
    if (load < 30) return '#00ff00';
    if (load < 60) return '#ffff00';
    if (load < 80) return '#ff8800';
    return '#ff0000';
  };

  return (
    <FloatingWindow
      title="🎯 Target Health Monitor - Real-time Damage Assessment"
      onClose={onClose}
      initialX={50}
      initialY={50}
      width={500}
      height={400}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#c0c0c0',
        fontFamily: 'MS Sans Serif, sans-serif',
        fontSize: '11px',
        padding: '8px',
      }}>
        {/* Target Info */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px inset #c0c0c0',
          padding: '8px',
          marginBottom: '8px',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Target: {targetUrl}</div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Last checked: {new Date(healthMetrics.lastChecked).toLocaleTimeString()}
          </div>
        </div>

        {/* Status Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          marginBottom: '8px',
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px inset #c0c0c0',
            padding: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>STATUS</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: getStatusColor(healthMetrics.status),
              fontSize: '14px',
            }}>
              {healthMetrics.status}
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#ffffff',
            border: '2px inset #c0c0c0',
            padding: '8px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '2px' }}>RESPONSE TIME</div>
            <div style={{ 
              fontWeight: 'bold', 
              color: healthMetrics.responseTime > 5000 ? '#ff0000' : '#000',
              fontSize: '14px',
            }}>
              {healthMetrics.responseTime}ms
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px inset #c0c0c0',
          padding: '8px',
          marginBottom: '8px',
          flex: 1,
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Real-time Metrics</div>
          
          {/* Availability */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>
              Availability: {healthMetrics.availability.toFixed(1)}%
            </div>
            <div style={{
              width: '100%',
              height: '16px',
              backgroundColor: '#808080',
              border: '1px inset #c0c0c0',
            }}>
              <div style={{
                width: `${healthMetrics.availability}%`,
                height: '100%',
                backgroundColor: healthMetrics.availability > 80 ? '#00ff00' : 
                                healthMetrics.availability > 50 ? '#ffff00' : '#ff0000',
              }} />
            </div>
          </div>

          {/* Error Rate */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>
              Error Rate: {healthMetrics.errorRate.toFixed(1)}%
            </div>
            <div style={{
              width: '100%',
              height: '16px',
              backgroundColor: '#808080',
              border: '1px inset #c0c0c0',
            }}>
              <div style={{
                width: `${Math.min(healthMetrics.errorRate, 100)}%`,
                height: '100%',
                backgroundColor: healthMetrics.errorRate < 10 ? '#00ff00' : 
                                healthMetrics.errorRate < 30 ? '#ffff00' : '#ff0000',
              }} />
            </div>
          </div>

          {/* Server Load */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', marginBottom: '2px' }}>
              Estimated Server Load: {healthMetrics.serverLoad.toFixed(1)}%
            </div>
            <div style={{
              width: '100%',
              height: '16px',
              backgroundColor: '#808080',
              border: '1px inset #c0c0c0',
            }}>
              <div style={{
                width: `${Math.min(healthMetrics.serverLoad, 100)}%`,
                height: '100%',
                backgroundColor: getLoadBarColor(healthMetrics.serverLoad),
              }} />
            </div>
          </div>

          {/* Attack Impact */}
          <div style={{
            backgroundColor: '#f0f0f0',
            border: '1px inset #c0c0c0',
            padding: '6px',
            marginTop: '8px',
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '10px', marginBottom: '4px' }}>
              Attack Impact Assessment
            </div>
            <div style={{ fontSize: '9px', lineHeight: '1.3' }}>
              • Requests/sec: {attackStats.requestsPerSecond}<br/>
              • Total requests: {attackStats.totalRequests.toLocaleString()}<br/>
              • Consecutive failures: {healthMetrics.consecutiveFailures}<br/>
              • Attack duration: {Math.floor(attackStats.uptime / 60)}m {attackStats.uptime % 60}s<br/>
              • Current phase: {attackStats.currentPhase}
            </div>
          </div>
        </div>

        {/* Response Time Graph */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '2px inset #c0c0c0',
          padding: '8px',
          height: '80px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
            Response Time History (last 30 checks)
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'end',
            height: '50px',
            gap: '1px',
          }}>
            {healthHistory.map((point, index) => {
              const maxTime = Math.max(...healthHistory.map(p => p.responseTime), 1000);
              const height = Math.min((point.responseTime / maxTime) * 50, 50);
              const color = point.responseTime > 5000 ? '#ff0000' : 
                          point.responseTime > 2000 ? '#ffff00' : '#00ff00';
              
              return (
                <div
                  key={index}
                  style={{
                    width: '4px',
                    height: `${height}px`,
                    backgroundColor: color,
                    border: '1px solid #666',
                  }}
                  title={`${point.responseTime}ms at ${new Date(point.timestamp).toLocaleTimeString()}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
}; 