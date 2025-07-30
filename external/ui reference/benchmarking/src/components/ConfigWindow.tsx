import React, { useState } from 'react';
import FloatingWindow from './FloatingWindow';
import { useDisplay } from '../contexts/DisplayContext';

interface ConfigWindowProps {
  onClose: () => void;
}

const ConfigWindow: React.FC<ConfigWindowProps> = ({ onClose }) => {
  const { settings, updateSetting, resetToDefaults, getColorSchemeValues } = useDisplay();
  const [activeTab, setActiveTab] = useState<'display' | 'performance' | 'colors'>('display');

  const colorSchemeOptions = [
    { value: 'dos-blue', label: 'DOS Blue' },
    { value: 'green-terminal', label: 'Green Terminal' },
    { value: 'amber-monitor', label: 'Amber Monitor' },
    { value: 'custom', label: 'Custom' }
  ] as const;

  const currentColors = getColorSchemeValues();

  const renderTabButton = (tabId: 'display' | 'performance' | 'colors', label: string) => (
    <button
      key={tabId}
      onClick={() => setActiveTab(tabId)}
      style={{
        padding: '4px 8px',
        backgroundColor: activeTab === tabId ? '#000080' : '#c0c0c0',
        color: activeTab === tabId ? '#ffffff' : '#000000',
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

  const renderDisplayTab = () => (
    <div style={{ color: '#000000' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', marginBottom: '4px' }}>
          SCANLINE OPACITY: {Math.round(settings.scanlineOpacity * 100)}%
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.scanlineOpacity}
          onChange={(e) => updateSetting('scanlineOpacity', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', marginBottom: '4px' }}>
          FONT SIZE: {settings.fontSize}px
        </div>
        <input
          type="range"
          min="8"
          max="20"
          step="1"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', marginBottom: '4px' }}>
          WINDOW OPACITY: {Math.round(settings.windowOpacity * 100)}%
        </div>
        <input
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          value={settings.windowOpacity}
          onChange={(e) => updateSetting('windowOpacity', parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
          <input
            type="checkbox"
            checked={settings.crtFlicker}
            onChange={(e) => updateSetting('crtFlicker', e.target.checked)}
          />
          CRT FLICKER
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
          <input
            type="checkbox"
            checked={settings.pixelPerfectScaling}
            onChange={(e) => updateSetting('pixelPerfectScaling', e.target.checked)}
          />
          PIXEL PERFECT
        </label>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div style={{ color: '#000000' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
          <input
            type="checkbox"
            checked={settings.enableAnimations}
            onChange={(e) => updateSetting('enableAnimations', e.target.checked)}
          />
          ENABLE ANIMATIONS
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
          <input
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
          />
          REDUCED MOTION
        </label>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        border: '1px solid #808080', 
        padding: '8px',
        fontSize: '8px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#000080' }}>PERFORMANCE TIPS:</div>
        <div style={{ color: '#000000' }}>
          <div>• Disable animations for better performance</div>
          <div>• Reduce scanline opacity for smoother rendering</div>
          <div>• Enable reduced motion for accessibility</div>
          <div>• Lower window opacity reduces GPU load</div>
        </div>
      </div>
    </div>
  );

  const renderColorsTab = () => (
    <div style={{ color: '#000000' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '9px', marginBottom: '4px' }}>COLOR SCHEME:</div>
        <select
          value={settings.colorScheme}
          onChange={(e) => updateSetting('colorScheme', e.target.value as any)}
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            border: '1px solid #808080',
            padding: '2px',
            fontSize: '9px',
            fontFamily: 'var(--font-pixel)'
          }}
        >
          {colorSchemeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Color Preview */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        border: '1px solid #808080', 
        padding: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px', color: '#000080' }}>PREVIEW:</div>
        <div 
          style={{
            padding: '8px',
            fontSize: '8px',
            fontFamily: 'monospace',
            backgroundColor: currentColors.background,
            color: currentColors.foreground,
            border: `1px solid ${currentColors.accent}`
          }}
        >
          <div style={{ color: currentColors.accent }}>C:\RETRO-BENCH&gt;</div>
          <div>SYSTEM READY FOR BENCHMARKING</div>
          <div style={{ color: currentColors.accent }}>PRESS ANY KEY TO CONTINUE...</div>
        </div>
      </div>

      {/* Custom Colors (only show if custom scheme is selected) */}
      {settings.colorScheme === 'custom' && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '8px', color: '#000080' }}>CUSTOM COLORS:</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '8px', marginBottom: '2px' }}>BACKGROUND:</div>
              <input
                type="color"
                value={settings.customColors.background}
                onChange={(e) => updateSetting('customColors', {
                  ...settings.customColors,
                  background: e.target.value
                })}
                style={{ width: '100%', height: '24px' }}
              />
            </div>

            <div>
              <div style={{ fontSize: '8px', marginBottom: '2px' }}>FOREGROUND:</div>
              <input
                type="color"
                value={settings.customColors.foreground}
                onChange={(e) => updateSetting('customColors', {
                  ...settings.customColors,
                  foreground: e.target.value
                })}
                style={{ width: '100%', height: '24px' }}
              />
            </div>

            <div>
              <div style={{ fontSize: '8px', marginBottom: '2px' }}>ACCENT:</div>
              <input
                type="color"
                value={settings.customColors.accent}
                onChange={(e) => updateSetting('customColors', {
                  ...settings.customColors,
                  accent: e.target.value
                })}
                style={{ width: '100%', height: '24px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'display':
        return renderDisplayTab();
      case 'performance':
        return renderPerformanceTab();
      case 'colors':
        return renderColorsTab();
      default:
        return renderDisplayTab();
    }
  };

  return (
    <FloatingWindow
      title="DISPLAY CONFIGURATION"
      onClose={onClose}
      width={480}
      height={420}
      initialX={300}
      initialY={120}
      minWidth={450}
      minHeight={380}
      maxWidth={600}
      maxHeight={500}
    >
      <div>
        {/* Tab Navigation */}
        <div style={{ marginBottom: '12px', borderBottom: '1px solid #808080', paddingBottom: '4px' }}>
          {renderTabButton('display', 'DISPLAY')}
          {renderTabButton('performance', 'PERFORMANCE')}
          {renderTabButton('colors', 'COLORS')}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '240px', maxHeight: '240px', overflowY: 'auto' }}>
          {renderContent()}
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #808080'
        }}>
          <button
            onClick={resetToDefaults}
            style={{
              padding: '4px 8px',
              backgroundColor: '#c0c0c0',
              border: '1px solid #808080',
              cursor: 'pointer',
              fontSize: '9px',
              fontFamily: 'var(--font-pixel)',
              color: '#000000'
            }}
          >
            RESET TO DEFAULTS
          </button>
          
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '4px 8px',
                backgroundColor: '#c0c0c0',
                border: '1px solid #808080',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              CANCEL
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px 8px',
                backgroundColor: '#c0c0c0',
                border: '1px solid #808080',
                cursor: 'pointer',
                fontSize: '9px',
                fontFamily: 'var(--font-pixel)',
                color: '#000000'
              }}
            >
              APPLY & CLOSE
            </button>
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
};

export default ConfigWindow; 