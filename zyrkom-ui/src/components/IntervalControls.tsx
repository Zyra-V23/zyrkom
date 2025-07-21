import React, { useState } from 'react'

interface IntervalResponse {
  ratio: number
  cents: number
  base_frequency: number
  target_frequency: number
  constraint_count: number
  proof_generated: boolean
}

interface IntervalControlsProps {
  onIntervalGenerate: (intervalType: string, baseFreq: number) => void
  onProofGenerate: (intervalType: string) => void
  onAudioPlay: () => void
  currentInterval: IntervalResponse | null
  isGeneratingProof: boolean
  isPlayingAudio: boolean
}

const IntervalControls: React.FC<IntervalControlsProps> = ({
  onIntervalGenerate,
  onProofGenerate,
  onAudioPlay,
  currentInterval,
  isGeneratingProof,
  isPlayingAudio
}) => {
  const [selectedInterval, setSelectedInterval] = useState('perfect_fifth')
  const [baseFrequency, setBaseFrequency] = useState(261.63) // C4

  const intervals = [
    { id: 'perfect_fifth', name: 'Perfect Fifth', ratio: '3:2', cents: '701.96' },
    { id: 'major_third', name: 'Major Third', ratio: '5:4', cents: '386.31' },
    { id: 'octave', name: 'Octave', ratio: '2:1', cents: '1200.00' },
    { id: 'minor_third', name: 'Minor Third', ratio: '6:5', cents: '315.64' },
    { id: 'perfect_fourth', name: 'Perfect Fourth', ratio: '4:3', cents: '498.04' }
  ]

  const handleGenerate = () => {
    onIntervalGenerate(selectedInterval, baseFrequency)
  }

  const handleProofGenerate = () => {
    onProofGenerate(selectedInterval)
  }

  return (
    <div className="space-y-4">
      {/* Interval Selection */}
      <div>
        <label className="block text-sm matrix-text-glow mb-2">
          Musical Interval
        </label>
        <select
          value={selectedInterval}
          onChange={(e) => setSelectedInterval(e.target.value)}
          className="matrix-input w-full"
        >
          {intervals.map(interval => (
            <option key={interval.id} value={interval.id}>
              {interval.name} ({interval.ratio}) - {interval.cents} cents
            </option>
          ))}
        </select>
      </div>

      {/* Base Frequency */}
      <div>
        <label className="block text-sm matrix-text-glow mb-2">
          Base Frequency (Hz)
        </label>
        <input
          type="number"
          value={baseFrequency}
          onChange={(e) => setBaseFrequency(Number(e.target.value))}
          className="matrix-input w-full"
          min="20"
          max="20000"
          step="0.01"
        />
        <div className="text-xs opacity-75 mt-1">
          Common: C4=261.63, A4=440.00, E4=329.63
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleGenerate}
          className="matrix-button w-full"
        >
          Generate Interval
        </button>

        {currentInterval && (
          <div className="space-y-2">
            <button
              onClick={handleProofGenerate}
              disabled={isGeneratingProof}
              className="matrix-button w-full"
            >
              {isGeneratingProof ? 'Generating ZK Proof...' : 'Generate ZK Proof'}
            </button>

            <button
              onClick={onAudioPlay}
              disabled={isPlayingAudio}
              className="matrix-button w-full"
            >
              {isPlayingAudio ? 'Playing Audio...' : 'Play Audio'}
            </button>
          </div>
        )}
      </div>

      {/* Quick Frequency Presets */}
      <div>
        <label className="block text-sm matrix-text-glow mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'C4', freq: 261.63 },
            { name: 'A4', freq: 440.00 },
            { name: 'E4', freq: 329.63 },
            { name: 'G4', freq: 392.00 }
          ].map(preset => (
            <button
              key={preset.name}
              onClick={() => setBaseFrequency(preset.freq)}
              className="text-xs matrix-button py-1 px-2"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default IntervalControls 