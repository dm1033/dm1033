// Unit tests for the pure game logic (engine, reducer, profile, scenario contract).
// Kept separate from vite.config.ts so the React and Tailwind plugins are not loaded for tests;
// the engine has no DOM dependency, so the suite runs in plain Node in about three seconds.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Tests must not depend on each other's module state or on wall-clock time.
    restoreMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts', 'src/state/**/*.{ts,tsx}', 'src/data/index.ts'],
      // sound.ts is Web Audio glue; the React provider/hook half of GameContext.tsx needs a DOM.
      exclude: ['src/**/*.test.ts', 'src/test/**', 'src/engine/sound.ts'],
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      thresholds: {
        'src/engine/game.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
        'src/engine/scoring.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
        'src/engine/reports.ts': { statements: 85, branches: 80, functions: 85, lines: 85 },
        'src/state/profile.ts': { statements: 95, branches: 85, functions: 95, lines: 95 },
      },
    },
  },
})
