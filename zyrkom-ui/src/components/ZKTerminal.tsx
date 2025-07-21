import React, { useState, useEffect, useRef } from 'react'

interface ZKTerminalProps {
  testResults: string[]
  onRunTests: () => void
}

const ZKTerminal: React.FC<ZKTerminalProps> = ({ testResults, onRunTests }) => {
  const [command, setCommand] = useState('')
  const [history, setHistory] = useState<string[]>([
    '🎵🔐 Zyrkom ZK Terminal v0.1.0',
    'Type "help" for available commands',
    '> Ready for musical cryptography operations...',
    ''
  ])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (testResults.length > 0) {
      setHistory(prev => [...prev, '', '> Test Results:', ...testResults, ''])
    }
  }, [testResults])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase()
    
    setHistory(prev => [...prev, `> ${cmd}`])
    
    switch (trimmedCmd) {
      case 'help':
        setHistory(prev => [...prev, 
          'Available commands:',
          '  test         - Run ZK test suite',
          '  status       - Show system status', 
          '  intervals    - List musical intervals',
          '  clear        - Clear terminal',
          '  help         - Show this help',
          ''
        ])
        break
        
      case 'test':
        setHistory(prev => [...prev, 'Running ZK test suite...', ''])
        onRunTests()
        break
        
      case 'status':
        setHistory(prev => [...prev,
          'System Status:',
          '  ZK Backend: Circle STARKs (Stwo)',
          '  Field: M31 (2³¹ - 1)',
          '  Audio: Enabled',
          '  Matrix UI: Active',
          '  Constraint Engine: Online',
          ''
        ])
        break
        
      case 'intervals':
        setHistory(prev => [...prev,
          'Supported Musical Intervals:',
          '  Perfect Fifth  - 3:2 ratio (701.96 cents)',
          '  Major Third    - 5:4 ratio (386.31 cents)', 
          '  Octave        - 2:1 ratio (1200.00 cents)',
          '  Minor Third   - 6:5 ratio (315.64 cents)',
          '  Perfect Fourth - 4:3 ratio (498.04 cents)',
          ''
        ])
        break
        
      case 'clear':
        setHistory([
          '🎵🔐 Zyrkom ZK Terminal v0.1.0',
          'Type "help" for available commands',
          '> Terminal cleared...',
          ''
        ])
        break
        
      default:
        setHistory(prev => [...prev, `Unknown command: ${cmd}`, 'Type "help" for available commands', ''])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (command.trim()) {
      handleCommand(command)
      setCommand('')
    }
  }

  return (
    <div className="h-full flex flex-col matrix-terminal">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-green-500 border-opacity-30">
        <h2 className="text-lg matrix-text-glow">ZK Terminal</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleCommand('test')}
            className="text-xs matrix-button py-1 px-2"
          >
            Run Tests
          </button>
          <button 
            onClick={() => handleCommand('clear')}
            className="text-xs matrix-button py-1 px-2"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto mb-4 font-mono text-sm leading-relaxed"
        style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#00ff00 transparent'
        }}
      >
        {history.map((line, i) => (
          <div 
            key={i} 
            className={`${
              line.startsWith('>') ? 'text-green-400' : 
              line.startsWith('✅') ? 'text-green-300' :
              line.startsWith('❌') ? 'text-red-400' :
              line.startsWith('🎵') ? 'text-yellow-400' :
              'text-green-200'
            } ${line.trim() === '' ? 'h-4' : ''}`}
          >
            {line.includes('✅') || line.includes('❌') || line.includes('🎵') ? (
              <span className="matrix-text-flicker">{line}</span>
            ) : (
              line
            )}
          </div>
        ))}
        
        {/* Typing indicator when tests are running */}
        {testResults.length === 0 && history.some(line => line.includes('Running')) && (
          <div className="text-green-400 matrix-text-flicker">
            <span className="matrix-loading">⟳</span> Processing...
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex">
        <span className="text-green-400 mr-2 font-mono">$</span>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1 matrix-input bg-transparent border-none outline-none"
          placeholder="Enter command..."
          autoFocus
        />
      </form>
      
      {/* Matrix scanline effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.1) 2px, rgba(0, 255, 0, 0.1) 4px)',
          animation: 'matrix-scan 3s ease-in-out infinite'
        }}
      />
    </div>
  )
}

export default ZKTerminal 