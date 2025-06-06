// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/views/**'],
    },
  },
  resolve: {
    alias: {
      obsidian: resolve(__dirname, 'test/__mock__/obsidian.ts'),
    },
  },
});
