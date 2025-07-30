import React, { useState, useEffect } from 'react';
import FloatingWindow from './FloatingWindow';
import { useSound } from '../contexts/SoundContext';
import { useGameData } from '../contexts/GameDataContext';

interface MiscWindowProps {
  onClose: () => void;
}

enum ViewType {
  PERFORMANCE = 'PERFORMANCE',
  COMPARISON = 'COMPARISON',
  ANALYSIS = 'ANALYSIS',
  RECOMMENDATIONS = 'RECOMMENDATIONS'
}

const MiscWindow: React.FC<MiscWindowProps> = ({ onClose }) => {
  const { playMenuSelect } = useSound();
  const { games, benchmarkReports } = useGameData();
  const [activeView, setActiveView] = useState<ViewType>(ViewType.PERFORMANCE);
  
  const handleViewChange = (view: ViewType) => {
    playMenuSelect();
    setActiveView(view);
  };

  const renderTabButton = (view: ViewType, label: string) => (
    <button
      key={view}
      onClick={() => handleViewChange(view)}
      style={{
        padding: '4px 8px',
        backgroundColor: activeView === view ? '#000080' : '#c0c0c0',
        color: activeView === view ? '#ffffff' : '#000000',
        border: '1px solid #808080',
        cursor: 'pointer',
        fontSize: '9px',
        fontFamily: 'var(--font-pixel)',
        marginRight: '2px'
      }}
    >
      {label}
    </button>
  );

  const renderPerformanceView = () => {
    if (benchmarkReports.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#000080', padding: '20px' }}>
          NO BENCHMARK DATA AVAILABLE
        </div>
      );
    }
    
    const selectedReport = benchmarkReports[0];
    
    return (
      <div style={{ color: '#000000' }}>
        <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>
          PERFORMANCE METRICS - {selectedReport.gameName}
        </h3>
        
        {/* Tabla de métricas */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #808080', 
          marginBottom: '12px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', fontSize: '9px', fontFamily: 'var(--font-pixel)' }}>
            <thead>
              <tr style={{ backgroundColor: '#c0c0c0', borderBottom: '1px solid #808080' }}>
                <th style={{ padding: '4px', textAlign: 'left' }}>PRESET</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>FPS</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>GPU%</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>CPU%</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>TEMP</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport.results.map((result, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '4px' }}>{result.level}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{result.fps}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{result.gpuUsage}%</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{result.cpuUsage}%</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{result.temperature}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gráfico simple con barras ASCII */}
        <div style={{ 
          backgroundColor: '#000000', 
          color: '#00ff00', 
          padding: '8px', 
          border: '1px solid #808080',
          fontFamily: 'monospace',
          fontSize: '8px'
        }}>
          <div>FPS PERFORMANCE CHART:</div>
          {selectedReport.results.map((result, index) => (
            <div key={index} style={{ marginTop: '2px' }}>
              {result.level.padEnd(6)} {'█'.repeat(Math.floor(result.fps / 10))} {result.fps}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderComparisonView = () => {
    if (benchmarkReports.length < 2) {
      return (
        <div style={{ textAlign: 'center', color: '#000080', padding: '20px' }}>
          NEED AT LEAST 2 BENCHMARKS FOR COMPARISON
        </div>
      );
    }
    
    return (
      <div style={{ color: '#000000' }}>
        <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>
          GAME PERFORMANCE COMPARISON
        </h3>
        
        <div style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #808080', 
          marginBottom: '12px',
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', fontSize: '9px', fontFamily: 'var(--font-pixel)' }}>
            <thead>
              <tr style={{ backgroundColor: '#c0c0c0', borderBottom: '1px solid #808080' }}>
                <th style={{ padding: '4px', textAlign: 'left' }}>GAME</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>AVG FPS</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>MAX TEMP</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>DURATION</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkReports.slice(0, 5).map((report, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '4px' }}>{report.gameName.substring(0, 12)}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{report.averageFps}</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{report.maxTemp}°C</td>
                  <td style={{ padding: '4px', textAlign: 'right' }}>{report.duration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAnalysisView = () => {
    if (benchmarkReports.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: '#000080', padding: '20px' }}>
          NO ANALYSIS DATA AVAILABLE
        </div>
      );
    }
    
    const avgFps = benchmarkReports.reduce((sum, r) => sum + r.averageFps, 0) / benchmarkReports.length;
    const maxTemp = Math.max(...benchmarkReports.map(r => r.maxTemp));
    const allBottlenecks = benchmarkReports.flatMap(r => r.bottlenecks);
    
    return (
      <div style={{ color: '#000000' }}>
        <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>
          PERFORMANCE ANALYSIS
        </h3>
        
        <div style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #808080', 
          padding: '8px', 
          marginBottom: '12px',
          fontSize: '9px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>SUMMARY:</div>
          <div>AVERAGE FPS: {avgFps}</div>
          <div>MAX TEMPERATURE: {maxTemp}°C</div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontWeight: 'bold' }}>BOTTLENECKS DETECTED:</div>
            {allBottlenecks.length > 0 ? (
              <div style={{ marginLeft: '8px' }}>
                {allBottlenecks.map((bottleneck, i) => (
                  <div key={i}>- {bottleneck}</div>
                ))}
              </div>
            ) : (
              <div style={{ marginLeft: '8px' }}>- NONE DETECTED</div>
            )}
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#000080', 
          color: '#ffffff', 
          padding: '8px', 
          border: '1px solid #808080',
          marginBottom: '12px',
          fontSize: '9px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>AI RECOMMENDATION:</div>
          <div>The following upgrades are recommended based on detected bottlenecks:</div>
        </div>
        
        <div style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #808080', 
          padding: '8px',
          fontSize: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>CAUSAL INFERENCE:</div>
          <div>ROOT CAUSES:</div>
          <div style={{ marginLeft: '8px' }}>
            <div>- PRIMARY: {avgFps < 60 ? 'INSUFFICIENT HARDWARE PERFORMANCE' : 'HARDWARE PERFORMS ADEQUATELY'}</div>
            <div>- SECONDARY: {maxTemp > 80 ? 'THERMAL THROTTLING DETECTED' : 'THERMAL PERFORMANCE ACCEPTABLE'}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendationsView = () => {
    return (
      <div style={{ color: '#000000' }}>
        <h3 style={{ color: '#000080', marginBottom: '12px', fontSize: '11px' }}>
          HARDWARE RECOMMENDATIONS
        </h3>
        
        <div style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #808080', 
          padding: '8px', 
          marginBottom: '12px',
          fontSize: '9px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>BASED ON ANALYSIS:</div>
          <div>The following upgrades are recommended based on detected bottlenecks:</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #808080', 
            padding: '8px',
            fontSize: '8px'
          }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>GPU UPGRADE OPTIONS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RTX 3060</span>
              <span>$329</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RTX 3070</span>
              <span>$499</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RTX 3080</span>
              <span>$699</span>
            </div>
            <div style={{ color: '#008000', marginTop: '4px' }}>EST. FPS GAIN: 35-65%</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#ffffff', 
            border: '1px solid #808080', 
            padding: '8px',
            fontSize: '8px'
          }}>
            <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '4px' }}>CPU UPGRADE OPTIONS</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RYZEN 5 5600X</span>
              <span>$199</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RYZEN 7 5800X</span>
              <span>$349</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>RYZEN 9 5900X</span>
              <span>$399</span>
            </div>
            <div style={{ color: '#008000', marginTop: '4px' }}>EST. FPS GAIN: 15-30%</div>
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#000080', 
          color: '#ffffff', 
          border: '1px solid #808080', 
          padding: '8px',
          fontSize: '9px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>OPTIMAL CONFIGURATION:</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>BEST VALUE BUILD:</span>
            <span>RTX 3070 + RYZEN 5 5600X</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TOTAL COST:</span>
            <span>$698</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>EXPECTED PERFORMANCE:</span>
            <span>120+ FPS @ HIGH</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case ViewType.PERFORMANCE:
        return renderPerformanceView();
      case ViewType.COMPARISON:
        return renderComparisonView();
      case ViewType.ANALYSIS:
        return renderAnalysisView();
      case ViewType.RECOMMENDATIONS:
        return renderRecommendationsView();
      default:
        return renderPerformanceView();
    }
  };

  return (
    <FloatingWindow
      title="BENCHMARK REPORTS & ANALYSIS"
      onClose={onClose}
      width={500}
      height={450}
      initialX={250}
      initialY={100}
      minWidth={450}
      minHeight={350}
      maxWidth={700}
      maxHeight={650}
    >
      <div>
        {/* Pestañas */}
        <div style={{ marginBottom: '12px', borderBottom: '1px solid #808080', paddingBottom: '4px' }}>
          {renderTabButton(ViewType.PERFORMANCE, 'PERFORMANCE')}
          {renderTabButton(ViewType.COMPARISON, 'COMPARISON')}
          {renderTabButton(ViewType.ANALYSIS, 'ANALYSIS')}
          {renderTabButton(ViewType.RECOMMENDATIONS, 'UPGRADE')}
        </div>

        {/* Contenido de la pestaña */}
        <div style={{ minHeight: '280px', maxHeight: '280px', overflowY: 'auto' }}>
          {renderContent()}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #808080',
          fontSize: '8px',
          color: '#000080'
        }}>
          REPORT GENERATED ON {new Date().toLocaleDateString()} • EXPORT: CSV, PNG, PDF
        </div>
      </div>
    </FloatingWindow>
  );
};

export default MiscWindow; 