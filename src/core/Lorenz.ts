import { DisplayParams, LorenzParams, LorenzSolution, LorenzWebGLProgram } from '../types/index';

// Import shaders as strings (will be handled by build process)
import projectVert from '../shaders/project.vert?raw';
import tailFrag from '../shaders/tail.frag?raw';
import tailVert from '../shaders/tail.vert?raw';

export class Lorenz {
  public gl: WebGLRenderingContext;
  public params: LorenzParams;
  public display: DisplayParams;
  public solutions: LorenzSolution[] = [];
  public tail: Float32Array = new Float32Array(0);
  public tail_buffer: WebGLBuffer;
  public tail_index = 0;
  public tail_colors: Float32Array = new Float32Array(0);
  public tail_colors_buffer: WebGLBuffer;
  public tail_index_buffer: WebGLBuffer;
  public tail_element_buffer: WebGLBuffer;
  public tail_length: Float32Array = new Float32Array(0);
  public program!: LorenzWebGLProgram;
  public frame = 0;
  public fps = 0;
  public accum = 0;
  public second = Math.floor(Date.now() / 1000);
  public ready = false;
  private startTime = Date.now(); // For oscillation timing
  private customColors?: [number, number, number][]; // Custom color palette
  private useDistanceBasedColoring = false;
  private distanceColorA: [number, number, number] = [0.658, 0.376, 0.718]; // Rosolanc purple
  private distanceColorB: [number, number, number] = [0.110, 0.420, 0.627]; // Helvetia blue
  private oscillationCenters: [number, number, number][] = [
    [-8, -8, 27],  // Left attractor center
    [8, 8, 27]     // Right attractor center
  ];

  constructor(canvas: HTMLCanvasElement, customColors?: [number, number, number][], useDistanceColoring = false) {
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!context) {
      throw new Error('Could not create WebGL context.');
    }
    const gl = context as WebGLRenderingContext;
    this.gl = gl;
    
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    this.params = {
      sigma: 10,
      beta: 8 / 3,
      rho: 28,
      display_rho: 28, // Fixed display offset
      step_size: 0.002,
      steps_per_frame: 3,
      oscillation: {
        enabled: true,
        sigma: {
          base: 10,
          amplitude: 2,
          frequency: 0.001 // Very slow oscillation
        },
        beta: {
          base: 8 / 3,
          amplitude: 0.5,
          frequency: 0.0008
        },
        rho: {
          base: 28,
          amplitude: 5,
          frequency: 0.0012
        }
      }
    };

    this.display = {
      scale: 1 / 25,
      rotation: [1.65, 3.08, -0.93],
      rotationd: [0.0001, 0.0001, 0.0001], // Much more subtle rotation speeds
      translation: [0, 0.075, 1.81],
      _length: 512
    };

    // Initialize WebGL buffers
    this.tail_buffer = gl.createBuffer()!;
    this.tail_colors_buffer = gl.createBuffer()!;
    
    const length = this.display._length;
    this.tail_index_buffer = Lorenz.createIndexArray(gl, length);
    this.tail_element_buffer = Lorenz.createElementArray(gl, length);

    this.customColors = customColors;
    this.useDistanceBasedColoring = useDistanceColoring;

    this.initializeShaders();
  }

  private initializeShaders(): void {
    this.program = Lorenz.compile(this.gl, projectVert + tailVert, tailFrag);
    
    // Enable vertex attribute arrays
    this.gl.enableVertexAttribArray(0);
    this.gl.enableVertexAttribArray(1);
    this.ready = true;
  }

  static compile(gl: WebGLRenderingContext, vert: string, frag: string): LorenzWebGLProgram {
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

    const result: LorenzWebGLProgram = {
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

  static generate(): LorenzSolution {
    return [
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
      (Math.random() - 0.5) * 50,
    ] as LorenzSolution;
  }

  static color(i: number): [number, number, number] {
    const colors = [
      0x8d, 0xd3, 0xc7,
      0xff, 0xff, 0xb3,
      0xbe, 0xba, 0xda,
      0xfb, 0x80, 0x72,
      0x80, 0xb1, 0xd3,
      0xfd, 0xb4, 0x62,
      0xb3, 0xde, 0x69,
      0xfc, 0xcd, 0xe5,
      0xd9, 0xd9, 0xd9,
      0xbc, 0x80, 0xbd,
      0xcc, 0xeb, 0xc5,
      0xff, 0xed, 0x6f,
      0xff, 0xff, 0xff
    ];
    const base = (i * 3) % colors.length;
    return colors.slice(base, base + 3).map(x => x / 255) as [number, number, number];
  }

  static lorenz(s: LorenzSolution, dt: number, σ: number, β: number, ρ: number): void {
    const dx = (x: number, y: number, z: number) => σ * (y - x);
    const dy = (x: number, y: number, z: number) => x * (ρ - z) - y;
    const dz = (x: number, y: number, z: number) => x * y - β * z;

    const [x, y, z] = s;

    const k1dx = dx(x, y, z);
    const k1dy = dy(x, y, z);
    const k1dz = dz(x, y, z);

    const k2x = x + k1dx * dt / 2;
    const k2y = y + k1dy * dt / 2;
    const k2z = z + k1dz * dt / 2;

    const k2dx = dx(k2x, k2y, k2z);
    const k2dy = dy(k2x, k2y, k2z);
    const k2dz = dz(k2x, k2y, k2z);

    const k3x = x + k2dx * dt / 2;
    const k3y = y + k2dy * dt / 2;
    const k3z = z + k2dz * dt / 2;

    const k3dx = dx(k3x, k3y, k3z);
    const k3dy = dy(k3x, k3y, k3z);
    const k3dz = dz(k3x, k3y, k3z);

    const k4x = x + k3dx * dt;
    const k4y = y + k3dy * dt;
    const k4z = z + k3dz * dt;

    const k4dx = dx(k4x, k4y, k4z);
    const k4dy = dy(k4x, k4y, k4z);
    const k4dz = dz(k4x, k4y, k4z);

    s[0] = x + (k1dx + 2*k2dx + 2*k3dx + k4dx) * dt / 6;
    s[1] = y + (k1dy + 2*k2dy + 2*k3dy + k4dy) * dt / 6;
    s[2] = z + (k1dz + 2*k2dz + 2*k3dz + k4dz) * dt / 6;
  }

  private update(a: number, b: number): void {
    const gl = this.gl;
    const length = this.display._length;
    const buffer = this.tail.buffer;
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffer);
    if (a === 0 && b === length - 1) {
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tail);
    } else {
      const sublength = b - a + 1;
      for (let s = 0; s < this.solutions.length; s++) {
        const offset = s * 3 * length * 4 + 3 * a * 4;
        const view = new Float32Array(buffer, offset, sublength * 3);
        gl.bufferSubData(gl.ARRAY_BUFFER, offset, view);
      }
    }
  }

  private updateOscillatingParams(): void {
    if (!this.params.oscillation.enabled) return;
    
    const time = Date.now() - this.startTime;
    const { oscillation } = this.params;
    
    // Update sigma with oscillation
    this.params.sigma = oscillation.sigma.base + 
      Math.sin(time * oscillation.sigma.frequency) * oscillation.sigma.amplitude;
    
    // Update beta with oscillation
    this.params.beta = oscillation.beta.base + 
      Math.sin(time * oscillation.beta.frequency) * oscillation.beta.amplitude;
    
    // Update rho with oscillation
    this.params.rho = oscillation.rho.base + 
      Math.sin(time * oscillation.rho.frequency) * oscillation.rho.amplitude;
  }

  private calculateDistanceToNearestCenter(point: LorenzSolution): number {
    let minDistance = Infinity;
    
    for (const center of this.oscillationCenters) {
      const dx = point[0] - center[0];
      const dy = point[1] - center[1];
      const dz = point[2] - center[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      minDistance = Math.min(minDistance, distance);
    }
    
    return minDistance;
  }

  private interpolateColor(colorA: [number, number, number], colorB: [number, number, number], t: number): [number, number, number] {
    const clampedT = Math.max(0, Math.min(1, t));
    return [
      colorA[0] + (colorB[0] - colorA[0]) * clampedT,
      colorA[1] + (colorB[1] - colorA[1]) * clampedT,
      colorA[2] + (colorB[2] - colorA[2]) * clampedT
    ];
  }

  private updateDistanceBasedColors(): void {
    if (!this.useDistanceBasedColoring || this.solutions.length === 0) return;
    
    const gl = this.gl;
    const count = this.solutions.length;
    
    // Calculate distances for current positions
    const distances: number[] = [];
    let minDist = Infinity;
    let maxDist = -Infinity;
    
    for (let i = 0; i < count; i++) {
      const distance = this.calculateDistanceToNearestCenter(this.solutions[i]);
      distances.push(distance);
      minDist = Math.min(minDist, distance);
      maxDist = Math.max(maxDist, distance);
    }
    
    // Normalize distances and update colors
    const range = maxDist - minDist;
    for (let i = 0; i < count; i++) {
      const normalizedDistance = range > 0 ? (distances[i] - minDist) / range : 0;
      const color = this.interpolateColor(this.distanceColorA, this.distanceColorB, normalizedDistance);
      
      this.tail_colors[i * 3 + 0] = color[0];
      this.tail_colors[i * 3 + 1] = color[1];
      this.tail_colors[i * 3 + 2] = color[2];
    }
    
    // Update GPU buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_colors_buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tail_colors.subarray(0, count * 3));
  }

  step(): this {
    if (!this.ready) return this;
    
    // Update oscillating parameters before stepping
    this.updateOscillatingParams();
    
    const { sigma: σ, beta: β, rho: ρ, step_size: dt, steps_per_frame } = this.params;
    const length = this.display._length;
    const tail = this.tail;
    const start_index = this.tail_index;
    let stop_index = 0;
    
    for (let s = 0; s < steps_per_frame; s++) {
      const tail_index = this.tail_index;
      this.tail_index = (this.tail_index + 1) % length;
      
      for (let i = 0; i < this.solutions.length; i++) {
        Lorenz.lorenz(this.solutions[i], dt, σ, β, ρ);
        const base = i * length * 3 + tail_index * 3;
        tail[base + 0] = this.solutions[i][0];
        tail[base + 1] = this.solutions[i][1];
        tail[base + 2] = this.solutions[i][2];
        const next = this.tail_length[i] + 1;
        this.tail_length[i] = Math.min(next, length);
      }
      stop_index = tail_index;
    }
    
    if (stop_index >= start_index) {
      this.update(start_index, stop_index);
    } else {
      this.update(start_index, length - 1);
      this.update(0, stop_index);
    }
    
    // Update colors based on distance if enabled
    this.updateDistanceBasedColors();
    
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
    if (!this.ready) return this;

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

    const count = this.solutions.length;
    if (count === 0) return this;

    const aspect = canvas.width / canvas.height;
    const length = this.display._length;
    const { scale, rotation, translation } = this.display;
    const { display_rho } = this.params;
    const start = (this.tail_index - 1 + length) % length;

    // Draw tails
    if (this.program) {
      gl.useProgram(this.program.program);
      const { attrib, uniform } = this.program;
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_index_buffer);
      gl.vertexAttribPointer(attrib.index, 1, gl.FLOAT, false, 0, (length - start - 1) * 4);
      
      gl.uniform1f(uniform.aspect, aspect);
      gl.uniform1f(uniform.scale, scale);
      gl.uniform3fv(uniform.rotation, rotation);
      gl.uniform3fv(uniform.translation, translation);
      gl.uniform1f(uniform.rho, display_rho);
      gl.uniform1f(uniform.max_length, length);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.tail_element_buffer);
      
      for (let i = 0; i < count; i++) {
        const r = this.tail_colors[i * 3 + 0];
        const g = this.tail_colors[i * 3 + 1];
        const b = this.tail_colors[i * 3 + 2];
        const offset = i * length * 4 * 3;
        
        gl.uniform3f(uniform.color, r, g, b);
        gl.uniform1f(uniform.tail_length, this.tail_length[i]);
        gl.vertexAttribPointer(attrib.point, 3, gl.FLOAT, false, 0, offset);
        gl.drawElements(gl.LINE_STRIP, length, gl.UNSIGNED_SHORT, (length - start - 1) * 2);
      }
    }

    return this;
  }

  private growBuffers(): void {
    const next2 = (x: number) => Math.pow(2, Math.ceil(Math.log(x) * Math.LOG2E));
    const gl = this.gl;
    const count = next2(this.solutions.length);
    const length = this.display._length;
    
    if (this.tail.length < count * length * 3) {
      const old_tail = this.tail;
      this.tail = new Float32Array(count * length * 3);
      this.tail.set(old_tail);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, count * length * 4 * 3, gl.DYNAMIC_DRAW);
      this.update(0, length - 1);
    }
    
    if (this.tail_length.length < count) {
      const old_tail_length = this.tail_length;
      this.tail_length = new Float32Array(count);
      this.tail_length.set(old_tail_length);
    }
    
    if (this.tail_colors.length < count * 3) {
      this.tail_colors = new Float32Array(count * 3);
      if (this.customColors) {
        for (let i = 0; i < count; i++) {
          const color = this.customColors[i % this.customColors.length];
          this.tail_colors[i * 3 + 0] = color[0];
          this.tail_colors[i * 3 + 1] = color[1];
          this.tail_colors[i * 3 + 2] = color[2];
        }
      } else {
        for (let i = 0; i < count; i++) {
          const color = Lorenz.color(i);
          this.tail_colors[i * 3 + 0] = color[0];
          this.tail_colors[i * 3 + 1] = color[1];
          this.tail_colors[i * 3 + 2] = color[2];
        }
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tail_colors_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, count * 4 * 3, gl.STATIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.tail_colors);
    }
  }

  add(s: LorenzSolution): this {
    this.solutions.push([...s] as LorenzSolution);
    this.growBuffers();
    return this;
  }

  private trim(length: number): this {
    const mod = (x: number, y: number) => x - y * Math.floor(x / y);
    const count = this.solutions.length;
    const oldlength = this.display._length;
    this.display._length = length;
    
    const old_tail = new Float32Array(this.tail.length);
    old_tail.set(this.tail);
    this.growBuffers();
    
    const actual = Math.min(length, oldlength);
    for (let s = 0; s < count; s++) {
      for (let n = 0; n < actual; n++) {
        const i = mod(this.tail_index - n - 1, oldlength);
        const o = actual - n - 1;
        const obase = s * length * 3 + o * 3;
        const ibase = s * oldlength * 3 + i * 3;
        this.tail[obase + 0] = old_tail[ibase + 0];
        this.tail[obase + 1] = old_tail[ibase + 1];
        this.tail[obase + 2] = old_tail[ibase + 2];
      }
      this.tail_length[s] = Math.min(this.tail_length[s], actual);
    }
    
    this.tail_index = actual % length;
    this.tail_index_buffer = Lorenz.createIndexArray(this.gl, length);
    this.tail_element_buffer = Lorenz.createElementArray(this.gl, length);
    this.update(0, length - 1);
    
    return this;
  }

  get length(): number {
    return this.display._length;
  }

  set length(v: number) {
    this.trim(v);
  }

  setCustomColors(colors: [number, number, number][]): this {
    this.customColors = colors;
    // Regenerate color buffer with new colors
    const count = this.solutions.length;
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const color = this.customColors[i % this.customColors.length];
        this.tail_colors[i * 3 + 0] = color[0];
        this.tail_colors[i * 3 + 1] = color[1];
        this.tail_colors[i * 3 + 2] = color[2];
      }
      // Update GPU buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tail_colors_buffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.tail_colors);
    }
    return this;
  }

  clearCustomColors(): this {
    this.customColors = undefined;
    // Regenerate color buffer with default colors
    const count = this.solutions.length;
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const color = Lorenz.color(i);
        this.tail_colors[i * 3 + 0] = color[0];
        this.tail_colors[i * 3 + 1] = color[1];
        this.tail_colors[i * 3 + 2] = color[2];
      }
      // Update GPU buffer
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.tail_colors_buffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.tail_colors);
    }
    return this;
  }

  enableDistanceBasedColoring(colorA: [number, number, number], colorB: [number, number, number]): this {
    this.useDistanceBasedColoring = true;
    this.distanceColorA = colorA;
    this.distanceColorB = colorB;
    // Disable custom colors when using distance-based coloring
    this.customColors = undefined;
    return this;
  }

  disableDistanceBasedColoring(): this {
    this.useDistanceBasedColoring = false;
    // Revert to default or custom colors
    this.clearCustomColors();
    return this;
  }

  setOscillationCenters(centers: [number, number, number][]): this {
    this.oscillationCenters = centers;
    return this;
  }
} 