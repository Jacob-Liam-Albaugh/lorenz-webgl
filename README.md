# Lorenz System WebGL

This is an interactive animation of a chaotic [Lorenz
system](https://en.wikipedia.org/wiki/Lorenz_system). Click and drag
to look around the system in 3D. Middle-click and drag to reposition.

Online demo: http://skeeto.github.io/lorenz-webgl/

The demo begins with 12 solutions (particles) with very close starting values. You
will see them gradually separate over the first minute or so.

## Features

- **Customizable Particle Count**: Control the number of particles (default: 12)
- **Custom Colors**: Define your own color palette for particles
- **Distance-Based Coloring**: Dynamic color interpolation based on distance to oscillation centers
- **Interactive 3D Navigation**: Click and drag to rotate, middle-click to translate
- **Real-time Parameter Oscillation**: Parameters can oscillate over time for dynamic behavior

## Usage

### Basic Usage
```tsx
import { LorenzAttractor } from 'lorenz-webgl';

<LorenzAttractor width={800} height={600} />
```

### Custom Particle Count
```tsx
<LorenzAttractor 
  width={800} 
  height={600} 
  particleCount={6} 
/>
```

### Custom Colors
```tsx
const fireColors: [number, number, number][] = [
  [1, 0.2, 0],     // Orange-red
  [1, 0.4, 0],     // Orange
  [1, 0.6, 0],     // Light orange
  [1, 1, 0],       // Yellow
  [0.8, 0, 0],     // Dark red
];

<LorenzAttractor 
  width={800} 
  height={600} 
  particleCount={5}
  customColors={fireColors}
/>
```

### Using with Default Colors
```tsx
// Omit customColors to use the built-in color palette
<LorenzAttractor 
  width={800} 
  height={600} 
  particleCount={20}
/>
```

### Artistic Pigment Colors
```tsx
// Using classic artistic pigment colors
const artisticColors: [number, number, number][] = [
  [0.537, 0.357, 0.482],  // Dusky madder violet
  [0.478, 0.537, 0.722],  // Deep lyons blue
  [1.0, 0.369, 0.769],    // Eosine pink
  [0.502, 0.275, 0.106],  // Hay's russet
];

<LorenzAttractor 
  width={800} 
  height={600} 
  particleCount={4}
  customColors={artisticColors}
/>
```

### Distance-Based Coloring
```tsx
// Colors change based on distance to oscillation centers
<LorenzAttractor 
  width={800} 
  height={600} 
  particleCount={4}
  useDistanceBasedColoring={true}
  distanceColorA={[0.658, 0.376, 0.718]} // Rosolanc purple
  distanceColorB={[0.110, 0.420, 0.627]} // Helvetia blue
  oscillationCenters={[[-8, -8, 27], [8, 8, 27]]} // Lorenz attractor centers
/>
```

Colors should be provided as RGB values in the range 0-1. If fewer colors are provided than particles, the colors will cycle through the array.
