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
3. Add registry metadata and a curated component preview.
4. Add unsupported descendant selectors only to scoped compatibility CSS.
5. Run all checks before opening a pull request.

```sh
bun run registry:build
bun run lint
bun run fmt:check
bun run typecheck
bun run test
bun run test:a11y
bun run build
```

Install Chromium once with `bunx playwright install chromium`.

Automated checks do not constitute VoiceOver or NVDA certification.

## Releases

For changes to `@yopem-ui/cli` or `@yopem-ui/oxlint-plugin`, run
`bunx changeset` and commit the generated changeset with your pull request. The
registry is private and is not published to npm. After merge, the release
workflow opens a version pull request; merging it publishes changed packages to
npm.

Pull requests also receive preview packages from pkg.pr.new.
