import { defineConfig } from 'vite';

export default defineConfig({
  root: './examples/browser',
  server: {
    port: 3000
  },
  build: {
    outDir: '../../dist-browser-example'
  }
});
