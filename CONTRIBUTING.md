# Contributing to Yopem UI

## Setup

```sh
bun install
bun run dev
```

Fork the repository if you are an external contributor. Create a branch for one
change. Open a pull request against `main`. Use issue templates to report
reproducible bugs or propose specific features.

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

Automated checks do not certify VoiceOver or NVDA support.

## Releases

For changes to `@yopem-ui/cli` or `@yopem-ui/oxlint-plugin`, run
`bunx changeset`. Commit the generated changeset with your pull request. The
registry is private. The project does not publish it to npm. After merge, the
release workflow opens a version pull request. Merge that pull request to
publish changed packages to npm.

Pull requests also receive preview packages from pkg.pr.new.
