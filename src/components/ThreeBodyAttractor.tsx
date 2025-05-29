import React, { useEffect, useRef, useState } from 'react';
import { ThreeBody } from '../core/ThreeBody';
import { ThreeBodyProps } from '../types/index';

export function ThreeBodyAttractor({
  width = 800,
  height = 600,
  className = '',
  onSolutionCountChange,
  onFpsChange,
  initialParams,
  initialDisplay,
  customColors,
  bodyColors = [
    [0.702, 0.098, 0.671], // Rosolanc purple
    [0.604, 0.710, 0.839], // Light glaucous blue  
    [0.824, 0.412, 0.118]  // Cinnamon rufous
  ]
}: ThreeBodyProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const threeBodyRef = useRef<ThreeBody | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize ThreeBody system
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    try {
      const threeBody = new ThreeBody(canvasRef.current, bodyColors);
      
      // Apply initial parameters if provided
      if (initialParams) {
        Object.assign(threeBody.params, initialParams);
      }
      
      if (initialDisplay) {
        Object.assign(threeBody.display, initialDisplay);
      }

      // Add exactly one three-body system (3 bodies)
      threeBody.add(ThreeBody.generate());

      threeBodyRef.current = threeBody;
      setIsInitialized(true);
      
      // Solution count callback - always 3 bodies in a three-body system
      onSolutionCountChange?.(3);
      
    } catch (error) {
      console.error('Failed to initialize ThreeBody system:', error);
    }
  }, [isInitialized, initialParams, initialDisplay, onSolutionCountChange, bodyColors]);

  // Handle color updates
  useEffect(() => {
    if (!isInitialized || !threeBodyRef.current) return;
    
    if (bodyColors) {
      threeBodyRef.current.setBodyColors(bodyColors);
    }
  }, [bodyColors, isInitialized]);

  // Animation loop
  useEffect(() => {
    if (!isInitialized || !threeBodyRef.current) return;

    const animate = () => {
      if (threeBodyRef.current) {
        threeBodyRef.current.step();
        threeBodyRef.current.draw();
        
        // Update FPS callback
        onFpsChange?.(threeBodyRef.current.fps);
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
    <div className={`threebody-container ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ 
          width: `${width}px`, 
          height: `${height}px`,
          display: 'block',
          background: '#0a0a1a'
        }}
      />
    </div>
  );
}; 