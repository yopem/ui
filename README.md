# Yopem UI

Source-owned React components built with StyleX and Base UI.

## Status

Yopem UI is under active conversion from its Tailwind reference implementation.
Canonical StyleX source lives in `packages/registry`; the Tailwind tree remains
an internal parity oracle until v1.

## Commands

```sh
bun install
bun run dev
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

## Workspace

- `apps/docs` — component catalog and registry host
- `packages/registry` — canonical component source and static registry builder
- `packages/cli` — `npx @yopem/ui`
- `fixtures` — supported framework and workspace fixtures

Registry artifacts are generated under `packages/registry/dist` and copied to
`apps/docs/public/r` and `apps/docs/public/schema`.

## Self-hosting

Build and run the production server directly:

```sh
bun run build
HOST=0.0.0.0 PORT=3000 node apps/docs/.output/server/index.mjs
```

Or build the container from the repository root:

```sh
docker build -f apps/docs/Dockerfile -t yopem-ui .
docker run --rm -p 3000:3000 yopem-ui
```

Tagged releases also produce self-hosted server and immutable registry archives.

See `CONTRIBUTING.md` for contributor workflow, `NOTICE` for attribution, and
`LICENSE` for MIT terms. Implementation plan remains at `docs/yopem-ui-plan.md`.
