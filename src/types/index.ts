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

export interface ThreeBodyParams {
  masses: [number, number, number]; // m1, m2, m3
  G: number; // Gravitational constant
  step_size: number;
  steps_per_frame: number;
  // Oscillation parameters
  oscillation: {
    enabled: boolean;
    masses: {
      base: [number, number, number];
      amplitude: [number, number, number];
      frequency: [number, number, number];
    };
    G: {
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

export interface ThreeBodyWebGLProgram {
  program: WebGLProgram;
  attrib: Record<string, number>;
  uniform: Record<string, WebGLUniformLocation>;
}

export interface LorenzSolution extends Array<number> {
  0: number; // x
  1: number; // y
  2: number; // z
}

export interface ThreeBodySolution extends Array<number> {
  // Body 1: position and velocity
  0: number; 1: number; 2: number;   // x1, y1, z1
  3: number; 4: number; 5: number;   // vx1, vy1, vz1
  // Body 2: position and velocity
  6: number; 7: number; 8: number;   // x2, y2, z2
  9: number; 10: number; 11: number; // vx2, vy2, vz2
  // Body 3: position and velocity
  12: number; 13: number; 14: number; // x3, y3, z3
  15: number; 16: number; 17: number; // vx3, vy3, vz3
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

export interface ThreeBodyProps {
  width?: number;
  height?: number;
  className?: string;
  onSolutionCountChange?: (count: number) => void;
  onFpsChange?: (fps: number) => void;
  initialParams?: Partial<ThreeBodyParams>;
  initialDisplay?: Partial<DisplayParams>;
  customColors?: [number, number, number][][]; // Array of color arrays for each body [body1_colors, body2_colors, body3_colors]
  bodyColors?: [number, number, number][]; // Default colors for the 3 bodies
} 