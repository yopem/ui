# Yopem UI

Source-owned React components built with StyleX and Base UI.

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
bun run build
```

## Workspace

- `apps/docs` — Fumadocs documentation, component previews, and source hosting
- `packages/registry` — canonical component source and static registry builder

Registry artifacts are generated under `packages/registry/dist` and copied to
`apps/docs/public/r` and `apps/docs/public/schema`. Generated API data stays out
of version control and is rebuilt from source for development and builds.

## Self-hosting

Build and run the production server directly:

```sh
bun run build
HOST=0.0.0.0 PORT=3100 node apps/docs/.output/server/index.mjs
```

Or build the container from the repository root:

```sh
docker build -f apps/docs/Dockerfile -t yopem-ui .
docker run --rm -p 3100:3100 yopem-ui
```

Tagged releases also produce self-hosted server and immutable registry archives.

See `CONTRIBUTING.md` for contributor workflow, `NOTICE` for attribution, and
`LICENSE` for MIT terms.

## TODO:

- [ ] add seo
- [ ] add dynamic og image
- [ ] add cli for installation, adding, updating componets
- [ ] add reusable hooks
