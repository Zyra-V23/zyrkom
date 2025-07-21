import React, { useRef, useEffect } from 'react'

interface AudioVisualizationData {
  frequencies: number[]
  amplitudes: number[]
  time_domain: number[]
  constraint_values: number[]
}

interface FrequencyVisualizerProps {
  data: AudioVisualizationData
  animated?: boolean
}

const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({ data, animated = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const drawVisualization = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { frequencies, amplitudes, constraint_values } = data
      if (!frequencies.length) return

      const barWidth = canvas.width / frequencies.length
      const centerY = canvas.height / 2

      // Draw frequency bars
      for (let i = 0; i < frequencies.length; i++) {
        const x = i * barWidth
        const amplitude = Math.abs(amplitudes[i])
        const height = amplitude * centerY * 0.8
        
        // Color based on constraint values
        const constraint = constraint_values[i] || 1
        const hue = constraint > 1.5 ? 120 : constraint < 0.7 ? 0 : 60 // Green, Red, Yellow
        const alpha = Math.min(1, amplitude + 0.3)
        
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`
        
        // Draw waveform
        ctx.fillRect(x, centerY - height / 2, barWidth - 1, height)
        
        // Matrix-style grid lines
        if (i % 10 === 0) {
          ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvas.height)
          ctx.stroke()
        }
      }

      // Draw frequency labels
      ctx.fillStyle = '#00ff00'
      ctx.font = '12px "Fira Code", monospace'
      ctx.textAlign = 'center'
      
      const sampleIndices = [0, Math.floor(frequencies.length / 4), Math.floor(frequencies.length / 2), Math.floor(3 * frequencies.length / 4), frequencies.length - 1]
      sampleIndices.forEach(i => {
        if (i < frequencies.length) {
          const x = i * barWidth + barWidth / 2
          const freq = frequencies[i].toFixed(1)
          ctx.fillText(`${freq}Hz`, x, canvas.height - 10)
        }
      })

      // Draw constraint ratio indicators
      ctx.fillStyle = '#00cccc'
      ctx.font = '10px "Fira Code", monospace'
      for (let i = 0; i < Math.min(constraint_values.length, 5); i++) {
        const ratio = constraint_values[i * Math.floor(constraint_values.length / 5)]
        if (ratio) {
          const x = (i * canvas.width) / 5
          ctx.fillText(`${ratio.toFixed(3)}`, x, 20)
        }
      }
    }

    if (animated) {
      let animationFrame: number
      const animate = () => {
        drawVisualization()
        animationFrame = requestAnimationFrame(animate)
      }
      animate()

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame)
        }
      }
    } else {
      drawVisualization()
    }
  }, [data, animated])

  return (
    <div className="frequency-wave h-full w-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-black border border-green-500 border-opacity-30"
        style={{ 
          background: 'linear-gradient(180deg, rgba(0, 255, 0, 0.05), transparent)',
          boxShadow: 'inset 0 0 20px rgba(0, 255, 0, 0.1)'
        }}
      />
      
      {/* Matrix-style overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full opacity-20"
             style={{
               background: `
                 repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0, 255, 0, 0.1) 20px, rgba(0, 255, 0, 0.1) 21px),
                 repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0, 255, 0, 0.1) 20px, rgba(0, 255, 0, 0.1) 21px)
               `
             }}
        />
      </div>
      
      {/* Info overlay */}
      <div className="absolute top-2 left-2 text-xs text-green-400 font-mono">
        <div>Samples: {data.frequencies.length}</div>
        <div>Range: {data.frequencies[0]?.toFixed(1)}Hz - {data.frequencies[data.frequencies.length - 1]?.toFixed(1)}Hz</div>
      </div>
    </div>
  )
}

export default FrequencyVisualizer 