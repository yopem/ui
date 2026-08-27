# AGENTS.md

Yopem UI is a Bun workspace for a source-owned **StyleX** React component library and registry. Components use React 19, Base UI, StyleX, and TypeScript. `apps/docs` is a TanStack Start (Vite + Nitro) catalog and registry host; `packages/cli` installs registry components.

## Commands

```sh
bun run dev             # docs app at :3000
bun run registry:build  # build registry, copy artifacts into apps/docs/public
bun run lint            # oxlint
bun run fmt             # format with oxfmt
bun run fmt:check       # verify formatting
bun run typecheck       # typecheck registry, CLI, docs
bun run test            # registry and CLI tests
bun run test:e2e        # Playwright end-to-end tests
bun run test:a11y       # full Chromium accessibility suite
bun run test:fixtures   # installer fixture tests
bun run build           # registry, CLI, docs production build
```

Run `bun run lint && bun run fmt:check && bun run typecheck` after changes. Run focused test suites for affected behavior; use full release gate from `CONTRIBUTING.md` before release work.

## Workspace structure

- `apps/docs/` — TanStack Start component catalog and static registry host.
  - `src/components/ui/stylex/` — catalog-facing exports of canonical StyleX components.
  - `src/components/demos/stylex/` — StyleX component demos.
  - `src/routes/` — file-based routes. Run `bun run generate-routes` after route changes; never edit `routeTree.gen.ts`.
- `packages/registry/` — canonical StyleX source and registry generator.
  - `src/components/ui/` — installable component source.
  - `src/items/` — registry item metadata, dependencies, files, docs.
  - `src/styles/` — StyleX tokens, markers, themes, reset, compatibility CSS.
  - `src/theme/` — ThemeProvider, theme root, theme script.
  - `src/build.ts` — generates `dist/`, then copies artifacts to `apps/docs/public/r` and `apps/docs/public/schema`.
- `packages/cli/` — `npx @yopem/ui` installer.
- `fixtures/` — supported consumer-app installation fixtures.
- `tests/` — release-readiness and Playwright tests.

Path aliases: `@registry/*` for registry source; `@/*` within docs. Generated registry artifacts are not source of truth.

## Component conventions

- Canonical components live in `packages/registry/src/components/ui/`; preserve Base UI behavior, public exports, `className`, and `data-slot` values.
- Use `"use client"` for client components and Base UI primitives from `@base-ui/react`.
- Style with `@stylexjs/stylex`: keep styles in local `stylex.create` objects, compose with `stylex.props`, and use `stylexProps` from `@registry/lib/stylex` when merging consumer `className`.
- Use semantic variables from `@registry/styles/tokens.stylex.ts`, not raw palette values. Theme selectors use markers from `@registry/styles/markers.stylex.ts`.
- Keep variants as StyleX style objects. Do not add utility classes or `cva` to canonical StyleX components.
- Prefer logical CSS properties (`paddingInline`, `blockSize`, etc.) and preserve accessible states, keyboard behavior, focus styles, and coarse-pointer targets.
- Icons: `lucide-react`; use Remix Icon only where existing component already requires it.
- Unsupported descendant selectors belong only in scoped compatibility CSS under `packages/registry/src/styles/`.

## Registry workflow

For component work:

1. Update canonical StyleX source in `packages/registry/src/components/ui/`.
2. Update or add metadata in `packages/registry/src/items/`, including files, dependencies, registry dependencies, docs, and exports.
3. Add or update StyleX docs demo under `apps/docs/src/components/demos/stylex/`.
4. Run `bun run registry:build` to regenerate hosted artifacts.

Never hand-edit `packages/registry/dist/` or `apps/docs/public/r/`.
