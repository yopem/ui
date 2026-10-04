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
bun run test             # CLI and Oxlint Bun suites through Turbo
bun run test:e2e          # docs and registry Playwright suites through Turbo
bun run test:a11y        # docs and registry accessibility suites through Turbo
bun test packages/cli     # CLI tests without browsers
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
- `packages/cli/test/` — CLI tests using `bun:test`, without browser fixtures.
- `packages/oxlint-plugin/test/` — lint rule tests using `bun:test`.
- `apps/docs/test/e2e/` — documentation navigation, HTTP, and accessibility
  checks. Config lives in `apps/docs/playwright.config.ts`.
- `packages/registry/test/e2e/` — component interactions, previews, and
  accessibility checks. Config lives in `packages/registry/playwright.config.ts`.
- Tests, runner dependencies, and configuration belong to their owning
  workspace. Root test scripts use Turborepo to run each phase in parallel.
- Browser suites share the built docs fixture, using fixed test ports: docs
  `3100`, registry `3101`. Do not change ports to bypass an occupied server.

Path aliases are `@registry/*` for registry source and `@/*` inside docs.

## Testing requirements

- Never write unit tests after writing implementation code. If unit tests are
  necessary, define them before implementation, not as a retrospective check.
- CLI tests use `bun:test`, not Playwright. Verify CLI integration by creating
  real projects or monorepos, running the packed CLI and Oxlint, and saving
  command output. CLI validation does not require a browser.
- For UI behavior, strongly prefer end-to-end (E2E) tests. Exercise complex
  features through real user workflows and observable outcomes rather than
  testing internal functions or mocked interactions in isolation.
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

## Design-system-first layout and typography

- In application JSX, prefer design-system primitives to native layout wrappers
  and typography tags, including unstyled wrappers, conditional branches, mapped
  children, elements with refs/events, and prop spreads. Preserve all native
  attributes, keyboard behavior, accessible semantics, and ref types.
- Start with Box (div by default, border-box sizing, minimum inline size zero).
  Use `Box as` for semantic landmarks, lists, inline spans, and generic preformatted
  content. Do not replace semantic elements with an unqualified div.
- Choose Flex for custom direction/alignment; Stack or VStack for columns with
  four spacing units; HStack for rows with centered cross-axis alignment and four
  spacing units; Grid for columns/rows; Center for centering on both axes.
- Use Container for a centered fluid page wrapper up to 90rem (`fluid` for full
  width), AbsoluteCenter within a positioned parent, Bleed to extend into inline
  padding, Float over a parent's corner, and Wrap for wrapping rows. Customize
  layout through `xstyle`, not native wrappers with duplicated layout styles.
- Use Text for paragraphs without forced visual defaults, Heading (`h2` by default)
  with `as="h1"` through `h6` for semantic levels independent of visual size,
  Blockquote for long quotations, Em for emphasis, and Mark for marked text.
  Choose Highlight for matching words and Prose for readable long-form content.
- Use Codeblock intentionally for code displays. Its div wrapper, toolbar, and
  internal pre mean it cannot blindly replace a native pre or its ref/events.
- Link is excluded: prefer TanStack Router Link for app navigation; native anchors
  remain valid for native navigation/downloads. Do not require registry Link or
  apply its default styling contracts to framework links.
- Native controls, tables, document metadata, SVG, custom elements, and text tags
  without an equivalent (such as strong and inline code) remain valid. Keep
  native markup inside primitive implementations and non-DOM JSX renderers;
  exempt those files in lint configuration rather than recursive wrappers.
- The recommended `prefer-layout-primitives` rule checks supported native tags
  regardless of their props; it does not infer layout intent from CSS. Use file
  overrides for intentional native boundaries. Docs migration is separate from
  enabling this rule; do not globally suppress checks to hide new violations.

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

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
