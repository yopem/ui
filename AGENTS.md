# AGENTS.md

Yopem UI is a Bun workspace for a source-owned StyleX React component library
and static registry. Components use React 19, Base UI, StyleX, and TypeScript.
`apps/docs` is a TanStack Start app (Vite + Nitro) that provides component
catalogs, inline previews, guides, search, machine-readable docs, and registry hosting.
The first release is copy/paste-only and does not publish an npm package.

## Commands

```sh
bun run dev             # docs app at :3100
bun run generate-routes # regenerate TanStack Router route tree
bun run registry:build  # generate docs, registry files, schemas, and public copies
bun run lint            # oxlint
bun run fmt              # format with oxfmt
bun run fmt:check        # verify formatting
bun run typecheck        # typecheck registry and docs
bun run test             # Playwright end-to-end tests
bun run test:a11y        # full Chromium accessibility suite
bun run build            # registry and docs production build
```

After changes, run `bun run lint && bun run fmt:check && bun run typecheck` plus
focused E2E tests for affected behavior. Before release work, run the full gate
from `CONTRIBUTING.md`: registry build, lint, format check, typecheck, E2E,
accessibility, and production build.

## Workspace structure

- `apps/docs/` — TanStack Start catalog and static registry host.
  - `src/catalog/` — catalog data, source loading, API rendering, search,
    navigation, code blocks, page layout, and usage snippets.
  - Catalog and preview runtime code imports components directly from
    `@registry/components/ui/*`. Public usage snippets and manual guide examples
    import copied components from `@/components/ui/*`.
  - `src/catalog/previews/` — curated live previews shown in component docs.
  - `src/routes/` — catalog, guide, API, SEO, and machine-readable
    routes. Run `bun run generate-routes` after route changes; never edit
    `routeTree.gen.ts`.
  - `src/styles.css` — docs application global styles only.
- `packages/registry/` — canonical copyable source and registry generator.
  - `src/components/ui/` — canonical component implementations.
  - `src/items/` — registry metadata, dependencies, files, docs, and exports.
  - `src/docs-extract.ts`, `src/docs.ts`, `src/docs-notes.ts` — generated API
    extraction, assembled docs, and reviewed human notes.
  - `src/source-files.ts` — rewrites internal `@registry/*` imports to consumer
    `@/*` paths.
  - `src/schema.ts` — registry and registry-item schemas.
  - `src/styles/` — tokens, themes, root styles, reset, reduced motion, and
    unavoidable upstream compatibility rules.
  - `src/theme/` — optional theme config, script, provider, and hook.
  - `src/build.ts` — writes unversioned and versioned registry items, docs, and
    JSON schemas, then copies them into the docs public directory.
- `test/e2e/` — Playwright interaction, accessibility, and production checks.

Path aliases are `@registry/*` for registry source and `@/*` inside docs.

## Testing requirements

- Never write unit tests after writing implementation code. If unit tests are
  necessary, define them before implementation, not as a retrospective check.
- Strongly prefer end-to-end (E2E) tests as the sole testing mechanism. Exercise
  complex features through real user workflows and observable outcomes rather
  than testing internal functions or mocked interactions in isolation.
- Make E2E runs reproducible: state prerequisites, use repeatable setup and
  inputs, and leave a verifiable artifact at the end (such as a test report,
  trace, screenshot, or saved output) with enough context to confirm the result
  and rerun the same scenario. Do not claim success without checking the
  artifact.
- If isolation testing is unavoidable, first enumerate the expected behavior and
  all plausible failure modes and edge cases; write the corresponding tests
  before implementation code. Do not add isolated tests afterward merely to
  mirror code already written.
- Every documented component preview must have automated accessibility
  coverage in a production build. Test interactive previews through real
  Playwright workflows, not source inspection or mocked DOM interactions.
- Cover applicable keyboard and pointer behavior, focus management, disabled
  states, accessible names and roles, and open/close or selection behavior.
  Scan rendered states that expose different accessibility markup.
- When source behavior changes, update relevant Playwright and accessibility
  tests in the same change.
- Before completing component work, run focused Playwright tests, the
  accessibility suite, and a production build. Do not claim production safety
  when any required check was skipped or failed; report exact gaps.

## Source-of-truth and generated files

Canonical sources live under `packages/registry/src/`. Never hand-edit
`packages/registry/dist/`, `apps/docs/public/r/`,
`apps/docs/public/schema/`, `packages/registry/src/docs.generated.json`, or
TanStack-generated route files. `bun run registry:build` regenerates registry
artifacts; docs dev, registry build, and registry typecheck regenerate API data.

## Component conventions

- Preserve Base UI behavior, public exports, consumer props, `className`, and
  `data-slot` values.
- Use `"use client"` for client components and Base UI primitives from
  `@base-ui/react`.
- Style with `@stylexjs/stylex`: define local `stylex.create` objects, compose
  with `stylex.props`, and use `stylexProps` from `@registry/lib/stylex` when
  merging consumer `className`.
- Merge consumer `xstyle` after defaults and variants. Input and Textarea use
  `controlXstyle` for outer wrappers and `xstyle` for native controls.
- Use semantic tokens from `@registry/styles/tokens.stylex`; avoid raw palette
  values when a token exists. Keep variants as StyleX style objects.
- Do not add utility classes, Tailwind, `cva`, authored JSX `style` props,
  literal CSS class names, embedded `<style>` blocks, or Fumadocs UI components.
- Prefer logical CSS properties and preserve keyboard behavior, focus styles,
  accessible states, reduced motion, and coarse-pointer targets.
- Use Lucide icons. Keep Remix Icon only where an existing component or docs
  feature already requires it.
- Style owned elements through explicit slots. Do not restore broad automatic
  SVG or descendant styling. Put only unavoidable upstream selectors in scoped
  compatibility CSS.
- Base installation remains `tokens.stylex.ts`, `styles.css`, and
  `lib/stylex.ts`; theme switching adds `theme.tsx` and `theme-provider.tsx`.

## Registry workflow

- Whenever adding a new registry item or rule, update its documentation,
  corresponding tests, sitemap, and `llms.txt` in the same change. Update the
  source data that generates the sitemap and `llms.txt`, not generated output.

For component work:

1. Update canonical source in `packages/registry/src/components/ui/`.
2. Update metadata in `packages/registry/src/items/`, including files,
   dependencies, registry dependencies, docs, and exports.
3. Update `docs-notes.ts` and `apps/docs/src/catalog/usage.ts` when public API,
   defaults, or usage changes.
4. Add or update catalog re-exports and the component's curated preview under
   `apps/docs/src/catalog/previews/`.
5. Run `bun run registry:build`.
6. Run focused registry, docs, interaction, and accessibility tests as needed,
   then required checks.
