# Contributing to Yopem UI

## Setup

```sh
bun install
bun run dev
```

External contributors should fork the repository, create a focused branch, and
open a pull request against `main`. Use issue templates for reproducible bugs
and concrete feature proposals.

## Component changes

1. Preserve Base UI behavior, exports, `className`, and `data-slot` values.
2. Keep canonical source in `packages/registry/src/components/ui`.
3. Add registry metadata and a StyleX demo.
4. Add unsupported descendant selectors only to scoped compatibility CSS.
5. Run all checks before opening a pull request.

```sh
bun run registry:build
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run test:e2e
bun run test:a11y
bun run test:fixtures
bun run test:parity
bun run build
```

Install Chromium once with `bunx playwright install chromium`. To isolate a
fixture while developing, run `FIXTURE=vite bun run test:fixtures` with any
fixture directory name.

Accessibility or behavior fixes found during conversion must also update the
Tailwind reference implementation. Automated checks do not constitute VoiceOver
or NVDA certification.

## Releases

Push tags matching the CLI version, such as `v0.1.0`. Tagged builds publish the
CLI with npm provenance and attach self-hosted application and registry
artifacts after the full release gate passes.
