import React, { useState } from 'react';
import RetroMenu from '../components/RetroMenu';
import RetroWindow from '../components/RetroWindow';
import RetroButton from '../components/RetroButton';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '../contexts/GameDataContext';

const menuItems = [
  { label: 'GAME', key: 'GAME', path: '/' },
  { label: 'CONFIG', key: 'CONFIG', path: '/settings' },
  { label: 'BENCH', key: 'BENCH', path: '/benchmark' },
  { label: 'MISC', key: 'MISC' }
];

enum ViewType {
  REPORTS = 'REPORTS',
  ANALYSIS = 'ANALYSIS',
  RECOMMENDATIONS = 'RECOMMENDATIONS'
}

const ReportsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { benchmarkReports, clearReports } = useGameData();
  const [activeView, setActiveView] = useState<ViewType>(ViewType.REPORTS);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const renderReportsView = () => {
    if (benchmarkReports.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-[#666666] mb-4">NO BENCHMARK REPORTS AVAILABLE</div>
          <RetroButton onClick={() => navigate('/benchmark')}>
            RUN FIRST BENCHMARK
          </RetroButton>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RetroWindow title="BENCHMARK REPORTS" className="h-[60vh]">
          <div className="p-4 overflow-y-auto">
            {benchmarkReports.map((report, index) => (
              <div 
                key={report.id}
                className={`border border-[#00ff00] p-3 mb-3 cursor-pointer hover:bg-[#003300] ${
                  selectedReport?.id === report.id ? 'bg-[#003300]' : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[#00ff00] font-bold">{report.gameName}</div>
                  <div className="text-[#ffff00] text-sm">
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>AVG FPS: {report.averageFps}</div>
                  <div>MAX TEMP: {report.maxTemp}°C</div>
                  <div>DURATION: {report.duration}s</div>
                  <div>LEVELS: {report.results.length}</div>
                </div>
              </div>
            ))}
          </div>
        </RetroWindow>

        <RetroWindow title="REPORT DETAILS" className="h-[60vh]">
          {selectedReport ? (
            <div className="p-4 overflow-y-auto">
              <div className="mb-4">
                <div className="text-[#00ff00] text-lg font-bold mb-2">{selectedReport.gameName}</div>
                <div className="text-sm text-[#666666]">
                  {new Date(selectedReport.date).toLocaleString()}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[#00ff00] mb-2">OVERALL PERFORMANCE:</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Average FPS: {selectedReport.averageFps}</div>
                  <div>Max Temperature: {selectedReport.maxTemp}°C</div>
                  <div>Test Duration: {selectedReport.duration}s</div>
                  <div>Total Levels: {selectedReport.results.length}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[#00ff00] mb-2">PERFORMANCE BY LEVEL:</div>
                <div className="space-y-1">
                  {selectedReport.results.map((result: any, index: number) => (
                    <div key={index} className="grid grid-cols-5 gap-2 text-xs border-b border-[#333333] pb-1">
                      <span className="font-bold">{result.level}</span>
                      <span>{result.fps} FPS</span>
                      <span>{result.gpuUsage}% GPU</span>
                      <span>{result.cpuUsage}% CPU</span>
                      <span>{result.temperature}°C</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReport.bottlenecks.length > 0 && (
                <div className="mb-4">
                  <div className="text-[#ff0000] mb-2">BOTTLENECKS DETECTED:</div>
                  <div className="space-y-1">
                    {selectedReport.bottlenecks.map((bottleneck: string, index: number) => (
                      <div key={index} className="text-[#ff0000] text-sm">• {bottleneck}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="text-[#00ff00] mb-2">RECOMMENDATION:</div>
                <div className="text-[#ffff00] text-sm">{selectedReport.recommendation}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center text-[#666666]">
              SELECT A REPORT<br />TO VIEW DETAILS
            </div>
          )}
        </RetroWindow>
      </div>
    );
  };

  const renderAnalysisView = () => {
    if (benchmarkReports.length === 0) {
      return (
        <div className="text-center py-8 text-[#666666]">
          NO DATA AVAILABLE FOR ANALYSIS
        </div>
      );
    }

    // Calculate aggregate statistics
    const totalReports = benchmarkReports.length;
    const avgFpsOverall = Math.round(
      benchmarkReports.reduce((sum, report) => sum + report.averageFps, 0) / totalReports
    );
    const maxTempOverall = Math.max(...benchmarkReports.map(r => r.maxTemp));
    const commonBottlenecks = benchmarkReports
      .flatMap(r => r.bottlenecks)
      .reduce((acc: any, bottleneck) => {
        acc[bottleneck] = (acc[bottleneck] || 0) + 1;
        return acc;
      }, {});

    return (
      <RetroWindow title="PERFORMANCE ANALYSIS" className="h-[60vh]">
        <div className="p-4 overflow-y-auto">
          <div className="mb-6">
            <div className="text-[#00ff00] text-lg font-bold mb-4">SYSTEM OVERVIEW</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[#00ff00] p-3">
                <div className="text-[#ffff00] text-sm">TOTAL BENCHMARKS</div>
                <div className="text-2xl">{totalReports}</div>
              </div>
              <div className="border border-[#00ff00] p-3">
                <div className="text-[#ffff00] text-sm">AVERAGE FPS</div>
                <div className="text-2xl">{avgFpsOverall}</div>
              </div>
              <div className="border border-[#00ff00] p-3">
                <div className="text-[#ffff00] text-sm">MAX TEMPERATURE</div>
                <div className="text-2xl">{maxTempOverall}°C</div>
              </div>
              <div className="border border-[#00ff00] p-3">
                <div className="text-[#ffff00] text-sm">PERFORMANCE TIER</div>
                <div className="text-2xl">
                  {avgFpsOverall >= 60 ? 'HIGH' : avgFpsOverall >= 30 ? 'MEDIUM' : 'LOW'}
                </div>
              </div>
            </div>
          </div>

          {Object.keys(commonBottlenecks).length > 0 && (
            <div className="mb-6">
              <div className="text-[#00ff00] text-lg font-bold mb-4">COMMON ISSUES</div>
              <div className="space-y-2">
                {Object.entries(commonBottlenecks)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([bottleneck, count]) => (
                    <div key={bottleneck} className="flex justify-between">
                      <span className="text-[#ff0000]">{bottleneck}</span>
                      <span className="text-[#ffff00]">{count as number} times</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-[#00ff00] text-lg font-bold mb-4">GAME PERFORMANCE RANKING</div>
            <div className="space-y-2">
              {benchmarkReports
                .sort((a, b) => b.averageFps - a.averageFps)
                .map((report, index) => (
                  <div key={report.id} className="flex justify-between items-center border-b border-[#333333] pb-1">
                    <span>#{index + 1} {report.gameName}</span>
                    <span className="text-[#ffff00]">{report.averageFps} FPS</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </RetroWindow>
    );
  };

  const renderRecommendationsView = () => {
    if (benchmarkReports.length === 0) {
      return (
        <div className="text-center py-8 text-[#666666]">
          NO DATA AVAILABLE FOR RECOMMENDATIONS
        </div>
      );
    }

    const avgFps = benchmarkReports.reduce((sum, r) => sum + r.averageFps, 0) / benchmarkReports.length;
    const maxTemp = Math.max(...benchmarkReports.map(r => r.maxTemp));
    const allBottlenecks = benchmarkReports.flatMap(r => r.bottlenecks);

    const recommendations = [];

    if (avgFps < 30) {
      recommendations.push({
        priority: 'HIGH',
        category: 'PERFORMANCE',
        title: 'GPU UPGRADE RECOMMENDED',
        description: 'Your average FPS is below 30. Consider upgrading your graphics card for better gaming experience.'
      });
    } else if (avgFps < 60) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'PERFORMANCE',
        title: 'OPTIMIZATION OPPORTUNITY',
        description: 'Performance is adequate but could be improved. Consider optimizing game settings or minor hardware upgrades.'
      });
    }

    if (maxTemp > 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'COOLING',
        title: 'IMPROVE COOLING SOLUTION',
        description: 'High temperatures detected. Improve case ventilation or consider better CPU/GPU cooling.'
      });
    }

    if (allBottlenecks.some(b => b.includes('GPU'))) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'HARDWARE',
        title: 'GPU BOTTLENECK DETECTED',
        description: 'Your graphics card is limiting performance. Consider upgrading to a more powerful GPU.'
      });
    }

    if (allBottlenecks.some(b => b.includes('CPU'))) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'HARDWARE',
        title: 'CPU BOTTLENECK DETECTED',
        description: 'Your processor is limiting performance. Consider upgrading to a faster CPU.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'SYSTEM',
        title: 'SYSTEM PERFORMING WELL',
        description: 'Your system is well-balanced and performing adequately for current workloads.'
      });
    }

    return (
      <RetroWindow title="SYSTEM RECOMMENDATIONS" className="h-[60vh]">
        <div className="p-4 overflow-y-auto">
          <div className="mb-4">
            <div className="text-[#00ff00] text-lg font-bold mb-4">PERFORMANCE ANALYSIS</div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-[#ffff00] text-sm">AVERAGE FPS</div>
                <div className="text-2xl">{Math.round(avgFps)}</div>
              </div>
              <div className="text-center">
                <div className="text-[#ffff00] text-sm">MAX TEMP</div>
                <div className="text-2xl">{maxTemp}°C</div>
              </div>
              <div className="text-center">
                <div className="text-[#ffff00] text-sm">REPORTS</div>
                <div className="text-2xl">{benchmarkReports.length}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-[#00ff00] p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[#00ff00] font-bold">{rec.title}</div>
                  <div className={`text-xs px-2 py-1 ${
                    rec.priority === 'HIGH' ? 'bg-[#ff0000] text-white' :
                    rec.priority === 'MEDIUM' ? 'bg-[#ffff00] text-black' :
                    'bg-[#00ff00] text-black'
                  }`}>
                    {rec.priority}
                  </div>
                </div>
                <div className="text-[#ffff00] text-xs mb-1">{rec.category}</div>
                <div className="text-sm">{rec.description}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[#333333] pt-4">
            <div className="text-[#00ff00] font-bold mb-2">UPGRADE SUGGESTIONS:</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[#ffff00] mb-1">GPU OPTIONS:</div>
                <div>• RTX 4060 - Budget Gaming</div>
                <div>• RTX 4070 - High Performance</div>
                <div>• RTX 4080 - Enthusiast</div>
              </div>
              <div>
                <div className="text-[#ffff00] mb-1">CPU OPTIONS:</div>
                <div>• Ryzen 5 7600X - Mainstream</div>
                <div>• Ryzen 7 7700X - High-End</div>
                <div>• Ryzen 9 7900X - Enthusiast</div>
              </div>
            </div>
          </div>
        </div>
      </RetroWindow>
    );
  };

  const handleClearReports = () => {
    if (window.confirm('Are you sure you want to clear all benchmark reports?')) {
      clearReports();
      setSelectedReport(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#00ff00] font-mono">
      <RetroMenu 
        items={menuItems} 
        onMenuClick={(item) => {
          if (item.path) {
            navigate(item.path);
          }
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">BENCHMARK REPORTS</h1>
          <div className="text-[#00ff00]">ANALYZE PERFORMANCE DATA AND SYSTEM RECOMMENDATIONS</div>
        </div>
        
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            <RetroButton
              onClick={() => setActiveView(ViewType.REPORTS)}
              className={`text-xs px-4 py-2 ${activeView === ViewType.REPORTS ? 'bg-[#00ff00] text-black' : ''}`}
            >
              REPORTS
            </RetroButton>
            <RetroButton
              onClick={() => setActiveView(ViewType.ANALYSIS)}
              className={`text-xs px-4 py-2 ${activeView === ViewType.ANALYSIS ? 'bg-[#00ff00] text-black' : ''}`}
            >
              ANALYSIS
            </RetroButton>
            <RetroButton
              onClick={() => setActiveView(ViewType.RECOMMENDATIONS)}
              className={`text-xs px-4 py-2 ${activeView === ViewType.RECOMMENDATIONS ? 'bg-[#00ff00] text-black' : ''}`}
            >
              RECOMMENDATIONS
            </RetroButton>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {activeView === ViewType.REPORTS && renderReportsView()}
          {activeView === ViewType.ANALYSIS && renderAnalysisView()}
          {activeView === ViewType.RECOMMENDATIONS && renderRecommendationsView()}
        </div>
        
        <div className="flex justify-center mt-8 space-x-4">
          <RetroButton onClick={() => navigate('/benchmark')}>
            RUN NEW BENCHMARK
          </RetroButton>
          {benchmarkReports.length > 0 && (
            <RetroButton onClick={handleClearReports}>
              CLEAR ALL REPORTS
            </RetroButton>
          )}
          <RetroButton onClick={() => navigate('/')}>
            BACK TO MAIN
          </RetroButton>
        </div>
      </div>
      
      <div className="text-center text-xs text-[#666666] py-2">
        {benchmarkReports.length} REPORTS AVAILABLE • LAST UPDATED: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

export default ReportsScreen;