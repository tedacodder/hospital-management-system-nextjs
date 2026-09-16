import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// Node environment, not jsdom: these tests exercise lib/ business logic
// (validation, scheduling, billing, rate limiting), not rendered components.
// tsconfigPaths resolves the "@/" alias the same way Next.js does.
//
// "@prisma/client" is aliased to a local shim (tests/mocks/prisma-client.ts)
// so the suite runs whether or not `prisma generate` has been run — see that
// file for why.
export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@prisma/client": path.resolve(__dirname, "tests/mocks/prisma-client.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
});
