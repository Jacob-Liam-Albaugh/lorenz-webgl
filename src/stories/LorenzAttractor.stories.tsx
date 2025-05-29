import type { Meta, StoryObj } from '@storybook/react';
import { LorenzAttractor } from '../components/LorenzAttractor';

const meta: Meta<typeof LorenzAttractor> = {
  title: 'Components/LorenzAttractor',
  component: LorenzAttractor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An interactive WebGL visualization of the Lorenz attractor system. The Lorenz attractor is a set of chaotic solutions of the Lorenz system of ordinary differential equations.'
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
      description: 'Callback when the number of solutions changes'
    },
    onFpsChange: {
      action: 'fpsChanged',
      description: 'Callback when FPS changes'
    },
    initialParams: {
      control: 'object',
      description: 'Initial Lorenz system parameters'
    },
    initialDisplay: {
      control: 'object',
      description: 'Initial display parameters'
    },
    particleCount: {
      control: { type: 'range', min: 1, max: 50, step: 1 },
      description: 'Number of particles (default: 12)'
    },
    customColors: {
      control: 'object',
      description: 'Array of RGB colors in 0-1 range, e.g., [[1, 0, 0], [0, 1, 0], [0, 0, 1]]'
    },
    useDistanceBasedColoring: {
      control: 'boolean',
      description: 'Enable distance-based color interpolation'
    },
    distanceColorA: {
      control: 'object',
      description: 'Color A for distance interpolation (RGB 0-1 range)'
    },
    distanceColorB: {
      control: 'object',
      description: 'Color B for distance interpolation (RGB 0-1 range)'
    },
    oscillationCenters: {
      control: 'object',
      description: 'Centers for distance calculation [[x1,y1,z1], [x2,y2,z2]]'
    }
  }
};

export default meta;
type Story = StoryObj<typeof LorenzAttractor>;

export const Default: Story = {
  args: {
    width: 800,
    height: 600,
  },
  parameters: {
    docs: {
      description: {
        story: 'The default Lorenz attractor with standard parameters. Use mouse to rotate, middle mouse to translate, and scroll to zoom.'
      }
    }
  }
};

export const CustomParameters: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      sigma: 15,
      beta: 2.5,
      rho: 35,
      step_size: 0.001,
      steps_per_frame: 5
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Lorenz attractor with custom parameters that create different chaotic behavior patterns.'
      }
    }
  }
};

export const SlowMotion: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      sigma: 10,
      beta: 8/3,
      rho: 28,
      step_size: 0.0005,
      steps_per_frame: 1
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Slower animation with smaller step size for detailed observation of the trajectory evolution.'
      }
    }
  }
};

export const HighSpeed: Story = {
  args: {
    width: 800,
    height: 600,
    initialParams: {
      sigma: 10,
      beta: 8/3,
      rho: 28,
      step_size: 0.005,
      steps_per_frame: 10
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Faster animation with larger step size and more steps per frame for rapid pattern formation.'
      }
    }
  }
};

export const CustomDisplay: Story = {
  args: {
    width: 800,
    height: 600,
    initialDisplay: {
      scale: 1/25,
      rotation: [0.1, 0, 0],
      rotationd: [0, 0, 0.01],
      translation: [0, 0, 2],
      _length: 10240
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom display settings with automatic rotation and longer trails.'
      }
    }
  }
};

export const CustomParticleCount: Story = {
  args: {
    width: 800,
    height: 600,
    particleCount: 6
  },
  parameters: {
    docs: {
      description: {
        story: 'Lorenz attractor with a custom number of particles (6 instead of the default 12).'
      }
    }
  }
};

export const ManyParticles: Story = {
  args: {
    width: 800,
    height: 600,
    particleCount: 24
  },
  parameters: {
    docs: {
      description: {
        story: 'Lorenz attractor with many particles (24) creating a denser visualization.'
      }
    }
  }
};

export const ArtisticPigments: Story = {
  args: {
    width: 800,
    height: 600,
    particleCount: 8,
    customColors: [
      [0.537, 0.357, 0.482],  // Dusky madder violet (#895B7B)
      [0.478, 0.537, 0.722],  // Deep lyons blue (#7A89B8) 
      [1.0, 0.369, 0.769],    // Eosine pink (#FF5EC4)
      [0.502, 0.275, 0.106],  // Hay's russet (#80461B)
    ]
  },
  parameters: {
    docs: {
      description: {
        story: 'Classic artistic pigment colors: Dusky madder violet, Deep lyons blue, Eosine pink, and Hay\'s russet.'
      }
    }
  }
};

export const DistanceBasedColoring: Story = {
  args: {
    width: 800,
    height: 600,
    particleCount: 10,
    useDistanceBasedColoring: true,
    distanceColorA: [0.658, 0.376, 0.718], // Rosolanc purple
    distanceColorB: [0.110, 0.420, 0.627], // Helvetia blue
    oscillationCenters: [[-8, -8, 27], [8, 8, 27]]
  },
  parameters: {
    docs: {
      description: {
        story: 'Distance-based coloring where particle colors interpolate between Rosolanc purple and Helvetia blue based on their distance to the oscillation centers.'
      }
    }
  }
};