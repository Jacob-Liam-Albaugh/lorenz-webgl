import React, { useEffect, useRef, useState } from 'react';
import { Lorenz } from '../core/Lorenz';
import { LorenzProps } from '../types/index';

export function LorenzAttractor({
  width = 800,
  height = 600,
  className = '',
  onSolutionCountChange,
  onFpsChange,
  initialParams,
  initialDisplay,
  particleCount = 12,
  customColors,
  useDistanceBasedColoring = false,
  distanceColorA = [0.658, 0.376, 0.718], // Rosolanc purple
  distanceColorB = [0.110, 0.420, 0.627], // Helvetia blue
  oscillationCenters
}: LorenzProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lorenzRef = useRef<Lorenz | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Lorenz system
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    try {
      const lorenz = new Lorenz(
        canvasRef.current, 
        useDistanceBasedColoring ? undefined : customColors,
        useDistanceBasedColoring
      );
      
      // Apply initial parameters if provided
      if (initialParams) {
        Object.assign(lorenz.params, initialParams);
      }
      
      if (initialDisplay) {
        Object.assign(lorenz.display, initialDisplay);
      }

      // Configure distance-based coloring if enabled
      if (useDistanceBasedColoring) {
        lorenz.enableDistanceBasedColoring(distanceColorA, distanceColorB);
        lorenz.setOscillationCenters(oscillationCenters || [[-8, -8, 27], [8, 8, 27]]);
      }

      // Add initial solutions
      for (let i = 0; i < particleCount; i++) {
        lorenz.add(Lorenz.generate());
      }

      lorenzRef.current = lorenz;
      setIsInitialized(true);
      
      // Initial solution count callback
      onSolutionCountChange?.(lorenz.solutions.length);
      
    } catch (error) {
      console.error('Failed to initialize Lorenz system:', error);
    }
  }, [isInitialized, initialParams, initialDisplay, onSolutionCountChange, particleCount, customColors, useDistanceBasedColoring, distanceColorA, distanceColorB, oscillationCenters]);

  // Handle color updates
  useEffect(() => {
    if (!isInitialized || !lorenzRef.current) return;
    
    if (useDistanceBasedColoring) {
      lorenzRef.current.enableDistanceBasedColoring(distanceColorA, distanceColorB);
      lorenzRef.current.setOscillationCenters(oscillationCenters || [[-8, -8, 27], [8, 8, 27]]);
    } else if (customColors) {
      lorenzRef.current.disableDistanceBasedColoring();
      lorenzRef.current.setCustomColors(customColors);
    } else {
      lorenzRef.current.disableDistanceBasedColoring();
      lorenzRef.current.clearCustomColors();
    }
  }, [customColors, useDistanceBasedColoring, distanceColorA, distanceColorB, oscillationCenters, isInitialized]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !lorenzRef.current) return;

    const animate = () => {
      if (lorenzRef.current) {
        lorenzRef.current.step();
        lorenzRef.current.draw();
        
        // Update FPS callback
        onFpsChange?.(lorenzRef.current.fps);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isInitialized, onFpsChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`lorenz-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          display: 'block',
          background: '#1a1a1a'
        }}
      />
    </div>
  );
}; 