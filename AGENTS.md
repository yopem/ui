# AGENTS.md

Yopem UI is a Bun workspace for a source-owned **StyleX** React component library and registry. Components use React 19, Base UI, StyleX, and TypeScript. `apps/docs` uses Fumadocs core search with a StyleX UI on TanStack Start (Vite + Nitro) for documentation and source hosting. The first release distributes components by copy/paste only.

## Commands

```sh
bun run dev             # docs app at :3100
bun run registry:build  # build registry, copy artifacts into apps/docs/public
bun run lint            # oxlint
bun run fmt             # format with oxfmt
bun run fmt:check       # verify formatting
bun run typecheck       # typecheck registry and docs
bun run test            # registry and release-readiness tests
bun run test:e2e        # Playwright end-to-end tests
bun run test:a11y       # full Chromium accessibility suite
bun run build           # registry and docs production build
```

Run `bun run lint && bun run fmt:check && bun run typecheck` after changes. Run focused test suites for affected behavior; use full release gate from `CONTRIBUTING.md` before release work.

## Workspace structure

- `apps/docs/` — TanStack Start component catalog and static registry host.
  - `src/components/ui/stylex/` — catalog-facing exports of canonical StyleX components.
  - `src/components/demos/stylex/` — StyleX component demos.
  - `src/catalog/usage.ts` — complete copyable usage examples, checked against component types.
  - `src/catalog/docs.functions.ts` — server-only source and API loading.
  - `src/routes/` — file-based routes. Run `bun run generate-routes` after route changes; never edit `routeTree.gen.ts`.
- `packages/registry/` — canonical StyleX source and registry generator.
  - `src/components/ui/` — copy/paste component source.
  - `src/items/` — registry item metadata, dependencies, files, docs.
  - `src/docs-extract.ts` — generates API data from canonical and dependency types.
  - `src/docs-notes.ts` — human-written usage notes and reviewed defaults.
  - `src/docs.generated.json` — ignored generated data; build, dev, and registry typecheck regenerate it.
  - `src/styles/tokens.stylex.ts` — native tokens, theme values, marker and root styles.
  - `src/styles/styles.css` — reset, reduced motion and unavoidable upstream viewport rules.
  - `src/theme/` — ThemeProvider, theme root, theme script.
  - `src/build.ts` — generates `dist/`, then copies artifacts to `apps/docs/public/r` and `apps/docs/public/schema`.
- `test/` — release-readiness and Playwright tests.

Keep every test outside `src/` in a `test/` directory that mirrors its
workspace's `src/` structure.

Path aliases: `@registry/*` for registry source; `@/*` within docs. Generated registry artifacts are not source of truth.

## Component conventions

- Canonical components live in `packages/registry/src/components/ui/`; preserve Base UI behavior, public exports, `className`, and `data-slot` values.
- Use `"use client"` for client components and Base UI primitives from `@base-ui/react`.
- Style with `@stylexjs/stylex`: keep styles in local `stylex.create` objects, compose with `stylex.props`, and use `stylexProps` from `@registry/lib/stylex` when merging consumer `className`.
- Use semantic variables such as `tokens["--primary"]` from `@registry/styles/tokens.stylex.ts`, not raw palette values. The same module exports `themeMarker`, themes and root styles.
- Merge consumer `xstyle` after defaults and variants. Input/Textarea expose `controlXstyle` for their outer wrappers and `xstyle` for native controls.
- Keep variants as StyleX style objects. Do not add utility classes or `cva` to canonical StyleX components.
- Docs and examples also use StyleX. No Tailwind/Fumadocs UI dependency, authored JSX `style` props, literal CSS class names, or embedded `<style>` blocks. Preserve consumer prop passthrough and upstream positioning; StyleX-generated runtime variables are allowed.
- Prefer logical CSS properties (`paddingInline`, `blockSize`, etc.) and preserve accessible states, keyboard behavior, focus styles, and coarse-pointer targets.
- Icons: `lucide-react`; use Remix Icon only where existing component already requires it.
- Style owned elements with StyleX, using explicit slot styles for consumer children. Do not restore automatic SVG/group-child CSS. Only unavoidable upstream-generated viewport selectors belong in styles.css.
- Base setup remains three files: tokens.stylex.ts, styles.css, lib/stylex.ts. Theme switching is an optional two-file addition.

## Registry workflow

For component work:

1. Update canonical StyleX source in `packages/registry/src/components/ui/`.
2. Update or add metadata in `packages/registry/src/items/`, including files, dependencies, registry dependencies, docs, and exports.
3. Add or update StyleX docs demo under `apps/docs/src/components/demos/stylex/`.
4. Run `bun run registry:build` to regenerate hosted artifacts.

Never hand-edit `packages/registry/dist/` or `apps/docs/public/r/`.
