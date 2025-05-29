import { DisplayParams, ThreeBodyParams, ThreeBodySolution, ThreeBodyWebGLProgram } from '../types/index';

// Import shaders as strings (will be handled by build process)
import projectVert from '../shaders/project.vert?raw';
import tailFrag from '../shaders/tail.frag?raw';
import tailVert from '../shaders/tail.vert?raw';

export class ThreeBody {
  public gl: WebGLRenderingContext;
  public params: ThreeBodyParams;
  public display: DisplayParams;
  public solution?: ThreeBodySolution; // Single three-body system
  
  // Separate tail buffers for each body in the system
  public tails: Float32Array[] = [new Float32Array(0), new Float32Array(0), new Float32Array(0)];
  public tail_buffers: WebGLBuffer[] = [];
  public tail_index = 0;
  public tail_colors: Float32Array[] = [new Float32Array(0), new Float32Array(0), new Float32Array(0)];
  public tail_colors_buffers: WebGLBuffer[] = [];
  public tail_index_buffer: WebGLBuffer;
  public tail_element_buffer: WebGLBuffer;
  public tail_lengths: Float32Array[] = [new Float32Array(0), new Float32Array(0), new Float32Array(0)];
  
  public program!: ThreeBodyWebGLProgram;
  public frame = 0;
  public fps = 0;
  public accum = 0;
  public second = Math.floor(Date.now() / 1000);
  public ready = false;
  private startTime = Date.now(); // For oscillation timing
  private bodyColors: [number, number, number][] = [
    [0.702, 0.098, 0.671], // Rosolanc purple
    [0.604, 0.710, 0.839], // Light glaucous blue  
    [0.824, 0.412, 0.118]  // Cinnamon rufous
  ];

  constructor(canvas: HTMLCanvasElement, bodyColors?: [number, number, number][]) {
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!context) {
      throw new Error('Could not create WebGL context.');
    }
    const gl = context as WebGLRenderingContext;
    this.gl = gl;
    
    gl.clearColor(0.05, 0.05, 0.1, 1); // Darker background for space
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.params = {
      masses: [1.0, 1.0, 1.0],
      G: 1.0,
      step_size: 0.008,
      steps_per_frame: 6,
      oscillation: {
        enabled: false,
        masses: {
          base: [1.0, 1.0, 1.0],
          amplitude: [0.2, 0.2, 0.2],
          frequency: [0.002, 0.0024, 0.0016]
        },
        G: {
          base: 1.0,
          amplitude: 0.1,
          frequency: 0.003
        }
      }
    };

    this.display = {
      scale: 1,
      rotation: [0.5, 0.3, 0],
      rotationd: [0.0002, 0.0001, 0.0001],
      translation: [0, 0, 2.5],
      _length: 1024
    };

    if (bodyColors) {
      this.bodyColors = bodyColors;
    }

    // Initialize WebGL buffers for each body
    this.tail_buffers = [
      gl.createBuffer()!,
      gl.createBuffer()!,
      gl.createBuffer()!
    ];
    this.tail_colors_buffers = [
      gl.createBuffer()!,
      gl.createBuffer()!,
      gl.createBuffer()!
    ];
    
    const length = this.display._length;
    this.tail_index_buffer = ThreeBody.createIndexArray(gl, length);
    this.tail_element_buffer = ThreeBody.createElementArray(gl, length);

    this.initializeShaders();
  }

  private initializeShaders(): void {
    this.program = ThreeBody.compile(this.gl, projectVert + tailVert, tailFrag);
    
    // Enable vertex attribute arrays
    this.gl.enableVertexAttribArray(0);
    this.gl.enableVertexAttribArray(1);
    this.ready = true;
  }

  static compile(gl: WebGLRenderingContext, vert: string, frag: string): ThreeBodyWebGLProgram {
    const v = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(v, vert);
    const f = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(f, frag);
    
    gl.compileShader(v);
    if (!gl.getShaderParameter(v, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(v) || 'Vertex shader compilation failed');
    }
    
    gl.compileShader(f);
    if (!gl.getShaderParameter(f, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(f) || 'Fragment shader compilation failed');
    }
    
    const p = gl.createProgram()!;
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p) || 'Program linking failed');
    }

    const result: ThreeBodyWebGLProgram = {
      program: p,
      attrib: {},
      uniform: {}
    };

    const nattrib = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let a = 0; a < nattrib; a++) {
      const attribInfo = gl.getActiveAttrib(p, a);
      if (attribInfo) {
        const location = gl.getAttribLocation(p, attribInfo.name);
        result.attrib[attribInfo.name] = location;
      }
    }

    const nuniform = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let u = 0; u < nuniform; u++) {
      const uniformInfo = gl.getActiveUniform(p, u);
      if (uniformInfo) {
        const location = gl.getUniformLocation(p, uniformInfo.name);
        if (location) {
          result.uniform[uniformInfo.name] = location;
        }
      }
    }

    return result;
  }

  static createElementArray(gl: WebGLRenderingContext, length: number): WebGLBuffer {
    const data = new Uint16Array(length * 2);
    for (let i = 0; i < data.length; i++) {
      data[i] = (length * 2 - i - 1) % length;
    }
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    return buffer;
  }

  static createIndexArray(gl: WebGLRenderingContext, length: number): WebGLBuffer {
    const data = new Float32Array(length * 2);
    for (let i = 0; i < data.length; i++) {
      data[i] = (length * 2 - i - 1) % length;
    }
    const buffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return buffer;
  }

  // Generate stable initial conditions for oscillating three-body dynamics
  static generate(): ThreeBodySolution {
    // Collection of well-known stable three-body configurations from literature
    const configs = [
      // Configuration 1: Figure-8 orbit (Chenciner-Montgomery)
      // Period ≈ 6.32591398, proven stable
      {
        positions: [
          [-0.97000436, 0.24308753, 0],
          [0.97000436, -0.24308753, 0], 
          [0, 0, 0]
        ],
        velocities: [
          [0.4662036850, 0.4323657300, 0],
          [0.4662036850, 0.4323657300, 0],
          [-0.93240737, -0.86473146, 0]
        ]
      },
      
      // Configuration 2: Lagrange equilateral triangle (rotating)
      // Bodies maintain equilateral triangle, stable periodic motion
      {
        positions: [
          [0, 1, 0],
          [-0.866025, -0.5, 0],
          [0.866025, -0.5, 0]
        ],
        velocities: [
          [-0.866025, 0, 0],
          [0.433013, 0.75, 0],
          [0.433013, -0.75, 0]
        ]
      },
      
      // Configuration 3: BHH (Broucke-Hadjidemetriou-Hénon) family
      // One body in nearly circular orbit, other two in rose curves
      {
        positions: [
          [-1.3760104789, 0, 0],
          [0.8390195211, 0, 0],
          [-0.1609804789, 0, 0]
        ],
        velocities: [
          [0, -1.00328, 0],
          [0, -0.53749, 0],
          [0, 0.84120, 0]
        ]
      },
      
      // Configuration 4: Modified figure-8 variant
      // Similar to original but with slightly different parameters
      {
        positions: [
          [-0.9700, 0.2431, 0],
          [0.9700, -0.2431, 0],
          [0, 0, 0]
        ],
        velocities: [
          [0.4700, 0.4350, 0],
          [0.4700, 0.4350, 0],
          [-0.9400, -0.8700, 0]
        ]
      },
      
      // Configuration 5: Linear formation with perpendicular velocities
      // Creates interesting crossing patterns
      {
        positions: [
          [-2.5, 0, 0],
          [0, 0, 0],
          [2.5, 0, 0]
        ],
        velocities: [
          [0, 1.1, 0],
          [0, -1.6, 0],
          [0, 1.1, 0]
        ]
      },
      
      // Configuration 6: Triangular formation with rotational motion
      // More dramatic oscillatory behavior
      {
        positions: [
          [-1.5, 0.866, 0],
          [1.5, 0.866, 0],
          [0, -1.732, 0]
        ],
        velocities: [
          [0.6, -0.3, 0],
          [-0.6, -0.3, 0],
          [0, 0.6, 0]
        ]
      }
    ];

    const config = configs[Math.floor(Math.random() * configs.length)];
    
    // Convert to flat array format and add small random perturbations for variation
    const solution: ThreeBodySolution = new Array(18).fill(0) as ThreeBodySolution;
    
    for (let i = 0; i < 3; i++) {
      const posOffset = i * 6;
      const velOffset = i * 6 + 3;
      
      // Add small random variations (±5%) to create unique but stable orbits
      const posVariation = 0.05;
      const velVariation = 0.05;
      
      solution[posOffset] = config.positions[i][0] * (1 + (Math.random() - 0.5) * posVariation);
      solution[posOffset + 1] = config.positions[i][1] * (1 + (Math.random() - 0.5) * posVariation);
      solution[posOffset + 2] = config.positions[i][2] * (1 + (Math.random() - 0.5) * posVariation);
      
      solution[velOffset] = config.velocities[i][0] * (1 + (Math.random() - 0.5) * velVariation);
      solution[velOffset + 1] = config.velocities[i][1] * (1 + (Math.random() - 0.5) * velVariation);
      solution[velOffset + 2] = config.velocities[i][2] * (1 + (Math.random() - 0.5) * velVariation);
    }

    return solution;
  }

  // Three-body gravitational integration using RK4
  static threeBody(s: ThreeBodySolution, dt: number, masses: [number, number, number], G: number): void {
    const calculateDerivatives = (state: ThreeBodySolution): number[] => {
      const derivatives = new Array(18).fill(0);
      
      // Extract positions for all three bodies
      const pos = [
        [state[0], state[1], state[2]],   // Body 1
        [state[6], state[7], state[8]],   // Body 2
        [state[12], state[13], state[14]] // Body 3
      ];
      
      // Velocities become position derivatives
      for (let i = 0; i < 3; i++) {
        derivatives[i * 6 + 0] = state[i * 6 + 3]; // dx/dt = vx
        derivatives[i * 6 + 1] = state[i * 6 + 4]; // dy/dt = vy
        derivatives[i * 6 + 2] = state[i * 6 + 5]; // dz/dt = vz
      }
      
      // Calculate gravitational forces for each body
      for (let i = 0; i < 3; i++) {
        let fx = 0, fy = 0, fz = 0;
        
        for (let j = 0; j < 3; j++) {
          if (i !== j) {
            const dx = pos[j][0] - pos[i][0];
            const dy = pos[j][1] - pos[i][1];
            const dz = pos[j][2] - pos[i][2];
            const r2 = dx * dx + dy * dy + dz * dz;
            
            // Apply softening only to avoid division by zero when bodies are very close
            const softening = 0.01;
            const r2_softened = r2 + softening * softening;
            const r = Math.sqrt(r2_softened);
            const r3 = r2_softened * r;
            
            const force = G * masses[j] / r3;
            fx += force * dx;
            fy += force * dy;
            fz += force * dz;
          }
        }
        
        // Acceleration = Force / mass
        derivatives[i * 6 + 3] = fx / masses[i]; // dvx/dt
        derivatives[i * 6 + 4] = fy / masses[i]; // dvy/dt
        derivatives[i * 6 + 5] = fz / masses[i]; // dvz/dt
      }
      
      return derivatives;
    };

    // RK4 integration
    const k1 = calculateDerivatives(s);
    
    const s_k1 = [...s] as ThreeBodySolution;
    for (let i = 0; i < 18; i++) {
      s_k1[i] = s[i] + k1[i] * dt / 2;
    }
    const k2 = calculateDerivatives(s_k1);
    
    const s_k2 = [...s] as ThreeBodySolution;
    for (let i = 0; i < 18; i++) {
      s_k2[i] = s[i] + k2[i] * dt / 2;
    }
    const k3 = calculateDerivatives(s_k2);
    
    const s_k3 = [...s] as ThreeBodySolution;
    for (let i = 0; i < 18; i++) {
      s_k3[i] = s[i] + k3[i] * dt;
    }
    const k4 = calculateDerivatives(s_k3);
    
    // Update state
    for (let i = 0; i < 18; i++) {
      s[i] += (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) * dt / 6;
    }
  }

  private update(bodyIndex: number, a: number, b: number): void {
    const gl = this.gl;
    const length = this.display._length;
    const buffer = this.tails[bodyIndex].buffer;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffers[bodyIndex]);
    if (a === 0 && b === length - 1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tails[bodyIndex]);
    } else {
      const sublength = b - a + 1;
      const offset = 3 * a * 4; // Single solution, no multiple system offset
      const view = new Float32Array(buffer, offset, sublength * 3);
      gl.bufferSubData(gl.ARRAY_BUFFER, offset, view);
    }
  }

  private updateOscillatingParams(): void {
    if (!this.params.oscillation.enabled) return;
    
    const time = Date.now() - this.startTime;
    const { oscillation } = this.params;
    
    // Update masses with oscillation
    for (let i = 0; i < 3; i++) {
      this.params.masses[i] = oscillation.masses.base[i] + 
        Math.sin(time * oscillation.masses.frequency[i]) * oscillation.masses.amplitude[i];
    }
    
    // Update G with oscillation
    this.params.G = oscillation.G.base + 
      Math.sin(time * oscillation.G.frequency) * oscillation.G.amplitude;
  }

  step(): this {
    if (!this.ready || !this.solution) return this;
    
    // Update oscillating parameters before stepping
    this.updateOscillatingParams();
    
    const { masses, G, step_size: dt, steps_per_frame } = this.params;
    const length = this.display._length;
    const start_index = this.tail_index;
    let stop_index = 0;
    
    for (let s = 0; s < steps_per_frame; s++) {
      const tail_index = this.tail_index;
      this.tail_index = (this.tail_index + 1) % length;
      
      // Update the single three-body solution
      ThreeBody.threeBody(this.solution, dt, masses, G);
      
      // Extract positions for each body and store in separate tail buffers
      for (let bodyIdx = 0; bodyIdx < 3; bodyIdx++) {
        const base = tail_index * 3; // Only one solution now
        const stateOffset = bodyIdx * 6; // Each body has 6 values (position + velocity)
        
        this.tails[bodyIdx][base + 0] = this.solution[stateOffset + 0]; // x
        this.tails[bodyIdx][base + 1] = this.solution[stateOffset + 1]; // y
        this.tails[bodyIdx][base + 2] = this.solution[stateOffset + 2]; // z
        
        const next = this.tail_lengths[bodyIdx][0] + 1; // Only one solution index
        this.tail_lengths[bodyIdx][0] = Math.min(next, length);
      }
      stop_index = tail_index;
    }
    
    // Update buffers for all bodies
    for (let bodyIdx = 0; bodyIdx < 3; bodyIdx++) {
      if (stop_index >= start_index) {
        this.update(bodyIdx, start_index, stop_index);
      } else {
        this.update(bodyIdx, start_index, length - 1);
        this.update(bodyIdx, 0, stop_index);
      }
    }
    
    this.display.rotation[0] += this.display.rotationd[0];
    this.display.rotation[1] += this.display.rotationd[1];
    this.display.rotation[2] += this.display.rotationd[2];
    
    this.frame++;
    const second = Math.floor(Date.now() / 1000);
    if (second !== this.second) {
      this.fps = this.accum;
      this.accum = 1;
      this.second = second;
    } else {
      this.accum++;
    }
    
    return this;
  }

  draw(): this {
    if (!this.ready || !this.solution) return this;

    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    
    gl.clear(gl.COLOR_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const length = this.display._length;
    const { scale, rotation, translation } = this.display;
    const start = (this.tail_index - 1 + length) % length;

    // Draw tails for each body
    if (this.program) {
      gl.useProgram(this.program.program);
      const { attrib, uniform } = this.program;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_index_buffer);
      gl.vertexAttribPointer(attrib.index, 1, gl.FLOAT, false, 0, (length - start - 1) * 4);
      
      gl.uniform1f(uniform.aspect, aspect);
      gl.uniform1f(uniform.scale, scale);
      gl.uniform3fv(uniform.rotation, rotation);
      gl.uniform3fv(uniform.translation, translation);
      gl.uniform1f(uniform.rho, 0); // No rho offset for three-body
      gl.uniform1f(uniform.max_length, length);
      
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tail_element_buffer);
      
      // Draw each body's trails (single solution)
      for (let bodyIdx = 0; bodyIdx < 3; bodyIdx++) {
        const color = this.bodyColors[bodyIdx];
        gl.uniform3f(uniform.color, color[0], color[1], color[2]);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffers[bodyIdx]);
        gl.uniform1f(uniform.tail_length, this.tail_lengths[bodyIdx][0]);
        gl.vertexAttribPointer(attrib.point, 3, gl.FLOAT, false, 0, 0);
        gl.drawElements(gl.LINE_STRIP, length, gl.UNSIGNED_SHORT, (length - start - 1) * 2);
      }
    }

    return this;
  }

  private growBuffers(): void {
    const gl = this.gl;
    const length = this.display._length;
    
    // Grow buffers for each body (single solution)
    for (let bodyIdx = 0; bodyIdx < 3; bodyIdx++) {
      if (this.tails[bodyIdx].length < length * 3) {
        const old_tail = this.tails[bodyIdx];
        this.tails[bodyIdx] = new Float32Array(length * 3);
        this.tails[bodyIdx].set(old_tail);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffers[bodyIdx]);
        gl.bufferData(gl.ARRAY_BUFFER, length * 4 * 3, gl.DYNAMIC_DRAW);
        this.update(bodyIdx, 0, length - 1);
      }
      
      if (this.tail_lengths[bodyIdx].length < 1) {
        this.tail_lengths[bodyIdx] = new Float32Array(1); // Only need one entry
      }
      
      if (this.tail_colors[bodyIdx].length < 3) {
        this.tail_colors[bodyIdx] = new Float32Array(3);
        const color = this.bodyColors[bodyIdx];
        this.tail_colors[bodyIdx][0] = color[0];
        this.tail_colors[bodyIdx][1] = color[1];
        this.tail_colors[bodyIdx][2] = color[2];
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_colors_buffers[bodyIdx]);
        gl.bufferData(gl.ARRAY_BUFFER, 4 * 3, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tail_colors[bodyIdx]);
      }
    }
  }

  add(s: ThreeBodySolution): this {
    this.solution = [...s] as ThreeBodySolution;
    this.growBuffers();
    return this;
  }

  get length(): number {
    return this.display._length;
  }

  set length(v: number) {
    this.display._length = v;
    // TODO: Implement trim function similar to Lorenz if needed
  }

  setBodyColors(colors: [number, number, number][]): this {
    if (colors.length >= 3) {
      this.bodyColors = colors.slice(0, 3) as [number, number, number][];
      // Regenerate color buffers
      this.growBuffers();
    }
    return this;
  }
} 