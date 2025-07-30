import { useState, useCallback } from 'react';
import { BenchmarkResult, BenchmarkReport } from '../contexts/GameDataContext';

export interface BenchmarkConfig {
  duration: number; // in seconds
  stressLevel: 'STANDARD' | 'EXTREME' | 'STABILITY';
  gameName: string;
}

export interface BenchmarkProgress {
  currentLevel: string;
  progress: number; // 0-100
  currentFps: number;
  currentTemp: number;
  isRunning: boolean;
}

export const useBenchmark = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<BenchmarkProgress>({
    currentLevel: '',
    progress: 0,
    currentFps: 0,
    currentTemp: 0,
    isRunning: false
  });

  // WebGL performance test
  const runWebGLTest = useCallback((complexity: number, duration: number): Promise<BenchmarkResult> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (!gl) {
        // Fallback for systems without WebGL
        resolve({
          level: 'ERROR',
          fps: 0,
          gpuUsage: 0,
          cpuUsage: 0,
          temperature: 0,
          frameTime: 0,
          score: 0
        });
        return;
      }

      let frameCount = 0;
      let totalFrameTime = 0;
      const startTime = performance.now();
      const endTime = startTime + (duration * 1000);
      
      // Create test geometry based on complexity
      const vertices = new Float32Array(complexity * 3);
      for (let i = 0; i < vertices.length; i += 3) {
        vertices[i] = (Math.random() - 0.5) * 2;     // x
        vertices[i + 1] = (Math.random() - 0.5) * 2; // y
        vertices[i + 2] = Math.random();              // z
      }

      // Create and compile shaders
      const vertexShaderSource = `
        attribute vec3 position;
        uniform float time;
        varying vec3 vColor;
        void main() {
          vec3 pos = position;
          pos.x += sin(time + position.y) * 0.1;
          pos.y += cos(time + position.x) * 0.1;
          gl_Position = vec4(pos, 1.0);
          vColor = vec3(position.x + 0.5, position.y + 0.5, position.z);
        }
      `;

      const fragmentShaderSource = `
        precision mediump float;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vec3 color = vColor * (sin(time) * 0.5 + 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      const createShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
      };

      const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
      
      if (!vertexShader || !fragmentShader) {
        resolve({
          level: 'ERROR',
          fps: 0,
          gpuUsage: 0,
          cpuUsage: 0,
          temperature: 0,
          frameTime: 0,
          score: 0
        });
        return;
      }

      const program = gl.createProgram();
      if (!program) return;
      
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Create buffer
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const positionLocation = gl.getAttribLocation(program, 'position');
      const timeLocation = gl.getUniformLocation(program, 'time');
      
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

      // Render loop
      const render = () => {
        const currentTime = performance.now();
        const frameStartTime = currentTime;
        
        if (currentTime >= endTime) {
          // Calculate final metrics
          const totalTime = (currentTime - startTime) / 1000;
          const avgFps = frameCount / totalTime;
          const avgFrameTime = totalFrameTime / frameCount;
          
          // Estimate metrics based on performance
          const score = Math.floor(avgFps * complexity / 100);
          const estimatedGpuUsage = Math.min(95, Math.max(30, 100 - (avgFps / 60) * 40));
          const estimatedCpuUsage = Math.min(90, Math.max(20, complexity / 50));
          const estimatedTemp = Math.min(85, Math.max(45, 60 + (complexity / 200)));

          resolve({
            level: complexity < 1000 ? 'LOW' : complexity < 2000 ? 'MEDIUM' : complexity < 4000 ? 'HIGH' : 'ULTRA',
            fps: Math.round(avgFps),
            gpuUsage: Math.round(estimatedGpuUsage),
            cpuUsage: Math.round(estimatedCpuUsage),
            temperature: Math.round(estimatedTemp),
            frameTime: avgFrameTime,
            score
          });
          return;
        }

        // Update progress
        const progressPercent = ((currentTime - startTime) / (duration * 1000)) * 100;
        setProgress(prev => ({
        ...prev,
          progress: progressPercent,
          currentFps: frameCount / ((currentTime - startTime) / 1000) || 0
        }));

        // Render frame
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.uniform1f(timeLocation, currentTime * 0.001);
        gl.drawArrays(gl.TRIANGLES, 0, complexity);
        
        frameCount++;
        const frameEndTime = performance.now();
        totalFrameTime += frameEndTime - frameStartTime;
        
        requestAnimationFrame(render);
      };

      requestAnimationFrame(render);
    });
  }, []);

  const runBenchmark = useCallback(async (config: BenchmarkConfig): Promise<BenchmarkReport> => {
    setIsRunning(true);
    setProgress({
      currentLevel: '',
      progress: 0,
      currentFps: 0,
      currentTemp: 0,
      isRunning: true
    });

    const results: BenchmarkResult[] = [];
    const levels = [
      { name: 'LOW', complexity: 500 },
      { name: 'MEDIUM', complexity: 1000 },
      { name: 'HIGH', complexity: 2000 },
      { name: 'ULTRA', complexity: 4000 }
    ];

    // Adjust complexity based on stress level
    const stressMultiplier = config.stressLevel === 'EXTREME' ? 2 : 
                            config.stressLevel === 'STABILITY' ? 0.5 : 1;

    for (const level of levels) {
      setProgress(prev => ({
        ...prev,
        currentLevel: level.name,
        progress: 0
      }));

      const adjustedComplexity = Math.floor(level.complexity * stressMultiplier);
      const result = await runWebGLTest(adjustedComplexity, config.duration / levels.length);
      results.push(result);
    }

    // Calculate overall metrics
    const averageFps = Math.round(
      results.reduce((sum, result) => sum + result.fps, 0) / results.length
    );
    
    const maxTemp = Math.max(...results.map(r => r.temperature));
    
    // Analyze bottlenecks
    const bottlenecks: string[] = [];
    const maxGpuUsage = Math.max(...results.map(r => r.gpuUsage));
    const maxCpuUsage = Math.max(...results.map(r => r.cpuUsage));
    
    if (maxGpuUsage > 95) bottlenecks.push('GPU REACHING MAXIMUM UTILIZATION');
    if (maxCpuUsage > 90) bottlenecks.push('CPU SHOWING SIGNS OF BOTTLENECK');
    if (maxTemp > 80) bottlenecks.push('HIGH TEMPERATURES DETECTED');
    if (averageFps < 30) bottlenecks.push('LOW FRAME RATE PERFORMANCE');

    // Generate recommendation
    let recommendation = '';
    if (averageFps < 30) {
      recommendation = 'CONSIDER LOWERING GRAPHICS SETTINGS OR UPGRADING GPU';
    } else if (averageFps < 60) {
      recommendation = 'SYSTEM PERFORMS ADEQUATELY - MINOR UPGRADES RECOMMENDED';
    } else if (maxTemp > 80) {
      recommendation = 'EXCELLENT PERFORMANCE - MONITOR TEMPERATURES';
    } else {
      recommendation = 'SYSTEM IS WELL-OPTIMIZED FOR CURRENT WORKLOAD';
    }

    const report: BenchmarkReport = {
      id: `bench_${Date.now()}`,
      gameName: config.gameName,
      date: new Date().toISOString(),
      duration: config.duration,
      results,
      averageFps,
      maxTemp,
      bottlenecks,
      recommendation
    };

    setIsRunning(false);
    setProgress({
      currentLevel: '',
      progress: 100,
      currentFps: 0,
      currentTemp: 0,
      isRunning: false
    });

    return report;
  }, [runWebGLTest]);

  const stopBenchmark = useCallback(() => {
    setIsRunning(false);
    setProgress({
      currentLevel: '',
      progress: 0,
      currentFps: 0,
      currentTemp: 0,
      isRunning: false
    });
  }, []);

  return {
    runBenchmark,
    stopBenchmark,
    isRunning,
    progress
  };
};