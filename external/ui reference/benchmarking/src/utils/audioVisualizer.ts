import { Howl } from 'howler';

// Frequencies for different benchmark stages
const frequencies = {
  init: 432, // Relaxing "A" frequency
  running: 528, // "Miracle" frequency
  complete: 396, // "G" frequency
};

class AudioVisualizer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isRunning = false;
  private dataArray: Uint8Array;
  private bufferLength: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
    
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    // Set initial gain to very low
    this.gainNode.gain.value = 0.1;
  }

  start(frequency: number = frequencies.init) {
    if (this.oscillator) {
      this.stop();
    }

    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
    
    this.isRunning = true;
    this.draw();
  }

  changeFrequency(frequency: number, duration: number = 1) {
    if (this.oscillator) {
      this.oscillator.frequency.linearRampToValueAtTime(
        frequency,
        this.audioContext.currentTime + duration
      );
    }
  }

  stop() {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    this.isRunning = false;
  }

  private draw = () => {
    if (!this.isRunning) return;

    requestAnimationFrame(this.draw);
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    this.ctx.fillStyle = 'rgb(0, 0, 0)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgb(0, 255, 0)';
    this.ctx.beginPath();
    
    const sliceWidth = this.canvas.width / this.bufferLength;
    let x = 0;
    
    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * this.canvas.height / 2;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  };

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  dispose() {
    this.stop();
    this.audioContext.close();
  }
}

export { AudioVisualizer, frequencies };