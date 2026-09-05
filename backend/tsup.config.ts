import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['cjs'],
  target: 'node22',
  outDir: 'dist',
  platform: 'node',
  clean: true,
  sourcemap: true,
});
