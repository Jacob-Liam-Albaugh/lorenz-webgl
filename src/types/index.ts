export interface LorenzParams {
  sigma: number;
  beta: number;
  rho: number;
  display_rho: number; // Separate rho for display offset (doesn't oscillate)
  step_size: number;
  steps_per_frame: number;
  // Oscillation parameters
  oscillation: {
    enabled: boolean;
    sigma: {
      base: number;
      amplitude: number;
      frequency: number;
    };
    beta: {
      base: number;
      amplitude: number;
      frequency: number;
    };
    rho: {
      base: number;
      amplitude: number;
      frequency: number;
    };
  };
}

export interface DisplayParams {
  scale: number;
  rotation: [number, number, number];
  rotationd: [number, number, number];
  translation: [number, number, number];
  _length: number;
}

export interface LorenzWebGLProgram {
  program: WebGLProgram;
  attrib: Record<string, number>;
  uniform: Record<string, WebGLUniformLocation>;
}

export interface LorenzSolution extends Array<number> {
  0: number; // x
  1: number; // y
  2: number; // z
}

export interface LorenzProps {
  width?: number;
  height?: number;
  className?: string;
  onSolutionCountChange?: (count: number) => void;
  onFpsChange?: (fps: number) => void;
  initialParams?: Partial<LorenzParams>;
  initialDisplay?: Partial<DisplayParams>;
  particleCount?: number; // Number of particles to generate
  customColors?: [number, number, number][]; // Array of RGB colors (0-1 range)
  useDistanceBasedColoring?: boolean; // Enable distance-based coloring
  distanceColorA?: [number, number, number]; // Color A for distance interpolation
  distanceColorB?: [number, number, number]; // Color B for distance interpolation
  oscillationCenters?: [number, number, number][]; // Centers for distance calculation
} 