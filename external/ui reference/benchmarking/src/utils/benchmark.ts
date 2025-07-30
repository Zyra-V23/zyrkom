// Benchmark utility functions for performance analysis

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gpuUsage: number;
  cpuUsage: number;
  temperature: number;
  score: number;
}

export interface SystemCapabilities {
  webglSupported: boolean;
  webgl2Supported: boolean;
  webgpuSupported: boolean;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  renderer: string;
  vendor: string;
}

// Check WebGL support and capabilities
export const getWebGLCapabilities = (): SystemCapabilities => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) {
    return {
      webglSupported: false,
      webgl2Supported: false,
      webgpuSupported: false,
      maxTextureSize: 0,
      maxViewportDims: [0, 0],
      renderer: 'Not Available',
      vendor: 'Not Available'
    };
  }

  const isWebGL2 = gl instanceof WebGL2RenderingContext;
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  
  return {
    webglSupported: true,
    webgl2Supported: isWebGL2,
    webgpuSupported: 'gpu' in navigator,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)
  };
};

// Calculate performance score based on metrics
export const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  const fpsWeight = 0.4;
  const frameTimeWeight = 0.2;
  const gpuWeight = 0.2;
  const cpuWeight = 0.1;
  const tempWeight = 0.1;

  // Normalize values (higher is better for fps, lower is better for others)
  const fpsScore = Math.min(metrics.fps / 60, 2) * 100; // Cap at 120fps = 200 points
  const frameTimeScore = Math.max(0, 100 - (metrics.frameTime - 16.67) * 2); // 60fps = 16.67ms
  const gpuScore = Math.max(0, 100 - metrics.gpuUsage);
  const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
  const tempScore = Math.max(0, 100 - (metrics.temperature - 40) * 2); // 40°C baseline

  return Math.round(
    fpsScore * fpsWeight +
    frameTimeScore * frameTimeWeight +
    gpuScore * gpuWeight +
    cpuScore * cpuWeight +
    tempScore * tempWeight
  );
};
        
// Determine GPU tier based on performance
export const getGPUTier = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' => {
  if (score >= 85) return 'ULTRA';
  if (score >= 70) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
};

// Format performance metrics for display
export const formatMetrics = (metrics: PerformanceMetrics) => {
  return {
    fps: `${metrics.fps} FPS`,
    frameTime: `${metrics.frameTime.toFixed(2)} ms`,
    gpuUsage: `${metrics.gpuUsage}%`,
    cpuUsage: `${metrics.cpuUsage}%`,
    temperature: `${metrics.temperature}°C`,
    score: metrics.score.toString()
  };
};

// Check if WebGPU is supported
export const isWebGPUSupported = async (): Promise<boolean> => {
  if (!('gpu' in navigator) || !(navigator as any).gpu) return false;
  
  try {
    const adapter = await (navigator as any).gpu.requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
};

// Generate benchmark recommendations
export const generateRecommendations = (metrics: PerformanceMetrics[]): string[] => {
  const recommendations: string[] = [];
  
  const avgFps = metrics.reduce((sum, m) => sum + m.fps, 0) / metrics.length;
  const maxTemp = Math.max(...metrics.map(m => m.temperature));
  const maxGpuUsage = Math.max(...metrics.map(m => m.gpuUsage));
  const maxCpuUsage = Math.max(...metrics.map(m => m.cpuUsage));

  if (avgFps < 30) {
    recommendations.push('Consider upgrading your graphics card for better performance');
  } else if (avgFps < 60) {
    recommendations.push('Performance is adequate but could benefit from optimization');
  }

  if (maxTemp > 80) {
    recommendations.push('High temperatures detected - improve cooling solution');
  }

  if (maxGpuUsage > 95) {
    recommendations.push('GPU is at maximum utilization - consider upgrading');
  }

  if (maxCpuUsage > 90) {
    recommendations.push('CPU bottleneck detected - consider CPU upgrade');
  }

  if (recommendations.length === 0) {
    recommendations.push('System is well-balanced for current workload');
  }

  return recommendations;
};