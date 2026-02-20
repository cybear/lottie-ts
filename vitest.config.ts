import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Only track coverage for modules that have unit tests in this phase.
      // Broader coverage targets will be added as more tests are added.
      include: [
        'src/utils/bez.ts',
        'src/utils/common.ts',
        'src/utils/PolynomialBezier.ts',
        'src/utils/markers/markerParser.ts',
        'src/utils/helpers/arrays.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 60,
        statements: 80,
      },
    },
  },
});
