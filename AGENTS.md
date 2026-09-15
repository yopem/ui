# AGENTS.md

Yopem UI is a Bun workspace for a source-owned StyleX React component library
and static registry. Components use React 19, Base UI, StyleX, and TypeScript.
`apps/docs` is a TanStack Start app (Vite + Nitro) that provides component
catalogs, examples, guides, search, machine-readable docs, and registry hosting.
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
bun run test             # registry, docs, and release-readiness tests
bun run test:e2e         # Playwright end-to-end tests
bun run test:a11y        # full Chromium accessibility suite
bun run build            # registry and docs production build
```

After changes, run `bun run lint && bun run fmt:check && bun run typecheck` plus
focused tests for affected behavior. Before release work, run the full gate from
`CONTRIBUTING.md`: registry build, lint, format check, typecheck, unit tests,
e2e, accessibility, and production build.

## Workspace structure

- `apps/docs/` — TanStack Start catalog and static registry host.
  - `src/catalog/` — catalog data, source loading, API rendering, search,
    navigation, code blocks, page layout, and usage examples.
  - `src/components/ui/stylex/` — catalog-facing re-exports of canonical
    registry components. Do not duplicate implementations here.
  - `src/components/examples/stylex/` — searchable StyleX examples and preview
    sources.
  - `src/routes/` — catalog, example, guide, API, SEO, and machine-readable
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
- `apps/*/test/` — each app test directory mirrors that app's `src/`.
- `packages/*/test/` — each package test directory mirrors that package's
  `src/`.
- `test/` — cross-workspace release-readiness, Playwright, and accessibility
  tests that do not map to one workspace source file.

Path aliases are `@registry/*` for registry source and `@/*` inside docs.

## Testing requirements

- Use `bun test` as the default test runner. Use Playwright only for real-browser
  interaction, end-to-end, production-build, and accessibility coverage.
- Apply these requirements to every project under `apps/*` and `packages/*`,
  including projects added later.
- Keep tests outside `src/`. Every app and package must have a sibling `test/`
  directory that mirrors its `src/` directory and file names. For example,
  `packages/registry/src/lib/stylex.ts` maps to
  `packages/registry/test/lib/stylex.test.ts`.
- Restructure all existing app and package tests that do not follow the mirrored
  layout instead of preserving a second test organization.
- Every file under any `apps/*/src/` or `packages/*/src/` directory must have a
  corresponding test file. A test may verify source contracts for files that
  cannot execute independently, but empty,
  placeholder, snapshot-only, and import-only tests do not satisfy this rule.
- Tests must cover realistic failure opportunities, not only required happy
  paths. Cover public behavior, variants, boundaries, invalid input, error and
  disabled states, keyboard and pointer interaction, state transitions,
  accessibility semantics, consumer overrides, and regressions relevant to the
  source under test.
- Every component under `packages/registry/src/components/ui/` must have real
  Playwright interaction coverage and automated accessibility coverage in a
  production build. Exercise rendered components through user-visible behavior;
  do not replace browser coverage with source inspection or mocked DOM tests.
- Component browser tests must cover each supported state and variant, keyboard
  navigation, focus management, pointer interaction, disabled behavior,
  accessible names and roles, and open/close or selection behavior where
  applicable. Run an accessibility scan for every rendered state that can
  expose different markup.
- When source behavior changes, update its mirrored Bun test and relevant
  Playwright and accessibility tests in the same change.
- Before completing component work, run focused Bun and Playwright tests, the
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

For component work:

1. Update canonical source in `packages/registry/src/components/ui/`.
2. Update metadata in `packages/registry/src/items/`, including files,
   dependencies, registry dependencies, docs, and exports.
3. Update `docs-notes.ts` and `apps/docs/src/catalog/usage.ts` when public API,
   defaults, or usage changes.
4. Add or update catalog re-exports and StyleX examples under
   `apps/docs/src/components/`.
5. Run `bun run registry:build`.
6. Run focused registry, docs, interaction, and accessibility tests as needed,
   then required checks.
