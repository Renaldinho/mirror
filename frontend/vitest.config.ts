import { defineConfig } from 'vitest/config';

// Keep the Pi and Windows development environments from spawning one worker per
// logical CPU for this small suite.
export default defineConfig({
  test: {
    maxWorkers: 2,
    minWorkers: 1,
  },
});
