import type { Meta, StoryObj } from '@storybook/react';
import { ThreeBodyAttractor } from '../components/ThreeBodyAttractor';

const meta: Meta<typeof ThreeBodyAttractor> = {
  title: 'Components/ThreeBodyAttractor',
  component: ThreeBodyAttractor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An interactive WebGL visualization of gravitational three-body systems. The three-body problem demonstrates chaotic dynamics when three celestial bodies interact gravitationally.'
      }
    }
  },
  argTypes: {
    width: {
      control: { type: 'range', min: 400, max: 1200, step: 50 },
      description: 'Canvas width in pixels'
    },
    height: {
      control: { type: 'range', min: 300, max: 800, step: 50 },
      description: 'Canvas height in pixels'
    },
    className: {
      control: 'text',
      description: 'Additional CSS class names'
    },
    onSolutionCountChange: {
      action: 'solutionCountChanged',
      description: 'Callback when the number of bodies changes'
    },
    onFpsChange: {
      action: 'fpsChanged',
      description: 'Callback when FPS changes'
    },
    initialParams: {
      control: 'object',
      description: 'Initial three-body system parameters'
    },
    initialDisplay: {
      control: 'object',
      description: 'Initial display parameters'
    },
    bodyColors: {
      control: 'object',
      description: 'Colors for the 3 bodies [body1_color, body2_color, body3_color] in RGB 0-1 range'
    }
  }
};

export default meta;
type Story = StoryObj<typeof ThreeBodyAttractor>;

export const Default: Story = {
  args: {
    width: 800,
    height: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'The default three-body gravitational system with standard parameters. Each color represents a different body in the system.'
      }
    }
  }
};

export const CustomMasses: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      masses: [2.0, 1.0, 0.5], // Different masses
      G: 1.2,
      step_size: 0.008, // Updated to match new default
      steps_per_frame: 6 // Updated to match new default
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Three-body system with different masses creating asymmetric orbital dynamics.'
      }
    }
  }
};

export const HighGravity: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      masses: [1.0, 1.0, 1.0],
      G: 2.0, // Higher gravitational constant
      step_size: 0.006, // Slightly slower for stability with high G
      steps_per_frame: 5 // Slightly slower for stability
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Three-body system with increased gravitational strength creating tighter, faster orbits.'
      }
    }
  }
};

export const SlowMotion: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      masses: [1.0, 1.0, 1.0],
      G: 0.8,
      step_size: 0.004, // Slower but still faster than before
      steps_per_frame: 3 // Slower steps per frame
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Slower simulation for detailed observation of gravitational interactions and orbital mechanics.'
      }
    }
  }
};

export const CustomColors: Story = {
  args: {
    width: 800,
    height: 600,
    bodyColors: [
      [1.0, 0.8, 0.2], // Gold
      [0.8, 0.2, 1.0], // Purple  
      [0.2, 1.0, 0.8]  // Cyan
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Three-body system with custom colors: gold, purple, and cyan for the three bodies.'
      }
    }
  }
};

export const ClassicalColors: Story = {
  args: {
    width: 800,
    height: 600,
    bodyColors: [
      [1.0, 1.0, 0.9], // Sun-like yellow
      [0.4, 0.6, 1.0], // Earth-like blue
      [0.9, 0.4, 0.2]  // Mars-like red
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Planetary-inspired colors: sun-like yellow, earth-like blue, and mars-like red.'
      }
    }
  }
};

export const ArtisticPalette: Story = {
  args: {
    width: 800,
    height: 600,
    bodyColors: [
      [0.9, 0.2, 0.4], // Crimson  
      [0.2, 0.8, 0.5], // Emerald
      [0.5, 0.3, 0.9]  // Violet
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Artistic color palette with vibrant crimson, emerald, and violet for a striking visual effect.'
      }
    }
  }
};

export const DramaticOscillation: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      masses: [1.0, 1.0, 1.0],
      G: 1.0,
      step_size: 0.007, // Slightly slower for stability with high oscillation
      steps_per_frame: 5, // Slightly slower for stability
      oscillation: {
        enabled: true,
        masses: {
          base: [1.0, 1.5, 0.8], // Different base masses
          amplitude: [0.7, 0.6, 0.8], // High amplitude
          frequency: [0.004, 0.003, 0.005] // Fast oscillation
        },
        G: {
          base: 1.2,
          amplitude: 0.4, // Strong gravity oscillation
          frequency: 0.002
        }
      }
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Highly dynamic three-body system with both mass and gravity oscillations creating dramatic orbital changes.'
      }
    }
  }
};

export const ChaosDemo: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      masses: [1.2, 0.8, 1.0],
      G: 1.1,
      step_size: 0.009, // Even faster for chaotic demo
      steps_per_frame: 7 // Even faster for chaotic demo
    },
    initialDisplay: {
      scale: 1/15,
      rotation: [0.2, 0.8, 0.1],
      rotationd: [0.0003, 0.0002, 0.0001],
      translation: [0, 0, 3],
      _length: 2048
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of chaotic behavior in three-body systems with longer trails and varied parameters.'
      }
    }
  }
}; 