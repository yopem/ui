---
"@yopem-ui/cli": patch
---

feat(cli): add Node.js support and improve CLI compatibility

The CLI now supports Node.js 22.20+ alongside Bun. It includes updates for
compatibility with npm, pnpm, and Yarn. Key changes:

- Updated README with usage examples for npm, pnpm, and Yarn.
- Replaced Bun-specific APIs with Node.js-compatible alternatives.
- Added `cross-spawn` and `semver` dependencies for process handling and version
  checks.
- Modified `package.json` to build and publish Node.js-compatible output.
- Introduced `build` and `prepack` scripts for Node.js builds.
- Updated `bin` and `exports` fields to use `dist` directory.
- Added `tsconfig.build.json` for TypeScript declaration generation.
- Replaced Bun's `spawn` and `semver` with `cross-spawn` and `semver` library.
- Added Node.js-specific tests in `node.test.ts` to verify CLI behavior.
- Updated CLI commands to detect and use the appropriate package manager.
- Improved error handling and compatibility for mixed environments.

These changes ensure the CLI works seamlessly across different environments.
