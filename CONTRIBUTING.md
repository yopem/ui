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
3. Add registry metadata and a StyleX example.
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
bun run build
```

Install Chromium once with `bunx playwright install chromium`.

Automated checks do not constitute VoiceOver or NVDA certification.

## Releases

Contributors should open a pull request and must not create or push version
tags. Maintainers handle versioning and releases after changes merge.
