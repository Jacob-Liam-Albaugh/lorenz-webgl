import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glsl', '**/*.vert', '**/*.frag'],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'LorenzWebGL',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
}); 