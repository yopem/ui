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
bun run test             # CLI and Oxlint Bun tests from tests/
bun run test:e2e          # docs and registry Playwright tests
bun run test:a11y        # docs and registry accessibility tests
bun test ./tests/cli      # CLI tests without browsers
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
- `tests/cli/` — CLI tests using `bun:test`, without browser fixtures.
- `tests/oxlint-plugin/` — lint rule tests using `bun:test`.
- `tests/e2e/docs/` — documentation navigation, HTTP, and accessibility checks.
- `tests/e2e/registry/` — component interactions, previews, and accessibility checks.
- Tests and runner dependencies belong to the repository root.
  `playwright.config.ts` provides one browser runner and one docs server.
  `tests/tsconfig.json` checks all test files.
- Browser tests use the built docs fixture on port `3100`.
  Do not change ports to bypass an occupied server.

Path aliases are `@registry/*` for registry source and `@/*` inside docs.

## Testing requirements

- Test observable behavior and public contracts, not documentation wording.
  Do not assert full sentences, descriptions, warnings, or lists of prose fragments.
  Wording changes must not require test changes unless wording is the requested contract.
- Assert exact text only for stable identifiers, commands, URLs, required legal text,
  or accessible names used to operate the interface.
  For documentation, check response status, content type, valid links, and usable examples.
- Keep each contract in one owning test. Do not repeat content checks across HTML,
  Markdown, and llms.txt when one contract test covers the behavior.
  Do not lock tests to exact snippet counts, declaration syntax, or cosmetic CSS values.
- Use public inventories to check published resources. Check structured fields,
  dependencies, and consumer imports instead of full generated-file equality.
- Do not test implementation source with string searches when rendered output or
  user interaction can verify the same contract. Test copy controls through clipboard output.
  Keep security and accessibility checks.
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

## Documentation writing

- Consumer projects can use Bun, npm, pnpm, or Yarn 2 and later.
- Put package-manager commands in shell code blocks, not inline text or lists.
  Use the existing package-manager switcher. Keep CLI examples usable with all
  four package managers. Save the selected manager in browser storage.
  Keep the switcher usable when browser storage is unavailable.
- Keep package-manager support explicit in machine-readable documentation.
  The `/llms.txt` route uses `apps/docs/src/lib/plain-text.ts`.
- Use ASD-STE100 Simplified Technical English for all documentation.
- Use short sentences, active voice, and one topic per paragraph.
- Keep procedural sentences to 20 words or fewer. Keep descriptive sentences
  to 25 words or fewer.
- Give one instruction per sentence. Use the imperative form for instructions.
- Use approved words with their approved meanings and parts of speech.
  Use consistent technical nouns and technical verbs for software terms.
- Preserve technical meaning, code examples, commands, API names, links, and
  accessibility requirements. Do not apply simplified prose rules to code.
- Apply these rules to guides, README files, component descriptions, usage
  notes, API documentation, and documentation generator templates.
- Update generated documentation through its source text and generator.
  Never edit generated files directly. Do not rewrite generated changelogs.
- Do not claim full ASD-STE100 compliance without checking the writing rules
  and controlled dictionary.

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
  Use `Box render={<section />}` for semantic landmarks, inline spans, and generic preformatted
  content. Do not replace semantic elements with an unqualified div.
- Choose Flex for custom direction/alignment; Stack or VStack for columns with
  four spacing units; HStack for rows with centered cross-axis alignment and four
  spacing units; Grid for columns/rows; Center for centering on both axes.
- Use Container for a centered fluid page wrapper up to 90rem (`fluid` for full
  width), AbsoluteCenter within a positioned parent, Bleed to extend into inline
  padding, Float over a parent's corner, and Wrap for wrapping rows. Customize
  layout through `xstyle`, not native wrappers with duplicated layout styles.
- Use AspectRatio for a div with CSS `aspectRatio`. Its optional numeric `ratio` defaults to `16 / 9`.
  Nonpositive and nonfinite ratios use the default. It does not clip or automatically size children.
- Use List for unordered lists and `List render={<ol />}` for ordered lists through Base UI `useRender`.
  Put native `start` and `reversed` attributes on the rendered ol.
  Use ListItem for li elements. Both exports come from the `list` module.
- AspectRatio, List, ListItem, Strong, and Figcaption accept `xstyle`, `className`, native attributes, events, and refs.
- Use Text for paragraphs with token-based typography defaults and `xstyle`
  overrides. Use Heading (`h2` by default) with `render={<h1 />}` through `h6`
  for semantic levels with different default sizes.
  Use Blockquote for long quotations, Em for emphasis, Strong for importance, and Mark for marked text.
  Strong renders strong with weight 600 and inherits surrounding typography.
  Use Figcaption inside `Box render={<figure />}` for figure captions; there is no Figure primitive.
  Figcaption renders figcaption with muted text, `0.875rem` font size, and `1.5` line height.
  Choose Highlight for matching words and Prose for readable long-form content.
- Use Codeblock intentionally for code displays. Its div wrapper, toolbar, and
  internal pre mean it cannot blindly replace a native pre or its ref/events.
- Link is excluded: prefer TanStack Router Link for app navigation; native anchors
  remain valid for native navigation/downloads. Do not require registry Link or
  apply its default styling contracts to framework links.
- Native controls, tables, document metadata, SVG, custom elements, and text tags
  without an equivalent (such as inline code) remain valid. Keep
  native markup inside primitive implementations and non-DOM JSX renderers;
  exempt those files in lint configuration rather than recursive wrappers.
- The recommended `prefer-layout-primitives` rule checks supported native tags
  regardless of their props; it does not infer layout intent from CSS.
  Component selection guidance does not expand the rule's supported native tags. Use file
  overrides for intentional native boundaries. Docs migration is separate from
  enabling this rule; do not globally suppress checks to hide new violations.

Rounded components use md (12px) by default. Use xstyle to change corner radii. Use controlXstyle for Input and Textarea wrappers. Keep circular indicators and edge-attached corners intact.

## Design system foundations

- Use neutral light and dark surfaces. Use semantic color pairs for text and
  surfaces: background/foreground, primary, secondary, muted, accent, card, and
  popover. Use destructive, success, warning, and info tokens for status.
- Use Inter for body text and headings.
  Use IBM Plex Mono for code and mono text.
  The font tokens specify these families. Load both fonts in the application.
- Use `tokens["--spacing"]` as the spacing unit. Its default is `0.25rem`.
  Stack, VStack, and HStack use four spacing units by default.
- Use radius tokens. The defaults are `0.5rem` (sm), `0.75rem` (md),
  `1rem` (lg), and `1.5rem` (xl).
- Keep light and dark themes complete. Define theme values in
  `packages/registry/src/styles/tokens.stylex.ts`. Keep StyleX theme object
  spreads in that module. Keep the theme marker and root styles intact.
- Keep theme configuration identical in root props, ThemeScript, and
  ThemeProvider. Keep defaultTheme and storageKey values identical.
  Pass the CSP nonce to ThemeScript when required. Keep `theme.tsx` server-safe.
  Only `theme-provider.tsx` is a client entry. Keep ThemeScript synchronous.
  Keep its `data-cfasync="false"` attribute to prevent Rocket Loader deferral.
- Use Field, Fieldset, Form, and Label for form structure. Use the matching
  input, selection, and validation components instead of new control systems.
- Use Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, PreviewCard, Menu,
  and ContextMenu for their documented interaction patterns. Keep Base UI focus
  management, dismissal, accessible names, and keyboard behavior intact.
- Use existing navigation, feedback, data display, and utility components.
  Check registry metadata and component documentation before adding substitutes.

### Color values

These are Yopem UI defaults from `tokens.stylex.ts`.
Use current token and component values when the project has overrides.
Keep the CSS color expressions intact. Transparent colors depend on the surface below them.
Use semantic tokens in styles, not these literal values.

| Token | Light value | Dark value |
| --- | --- | --- |
| `--accent` | `color-mix(in oklab, #000 4%, transparent)` | `color-mix(in oklab, #fff 4%, transparent)` |
| `--accent-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--background` | `#fff` | `color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff)` |
| `--border` | `color-mix(in oklab, #000 8%, transparent)` | `color-mix(in oklab, #fff 6%, transparent)` |
| `--card` | `#fff` | `color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )` |
| `--card-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--code` | `#fff` | `color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )` |
| `--code-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--code-highlight` | `color-mix(in oklab, #000 4%, transparent)` | `color-mix(in oklab, #fff 4%, transparent)` |
| `--destructive` | `oklch(63.7% 0.237 25.331)` | `color-mix(in srgb, oklch(63.7% 0.237 25.331) 90%, #fff)` |
| `--destructive-foreground` | `oklch(50.5% 0.213 27.518)` | `oklch(70.4% 0.191 22.216)` |
| `--foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--info` | `oklch(62.3% 0.214 259.815)` | `oklch(62.3% 0.214 259.815)` |
| `--info-foreground` | `oklch(48.8% 0.243 264.376)` | `oklch(70.7% 0.165 254.624)` |
| `--input` | `color-mix(in oklab, #000 10%, transparent)` | `color-mix(in oklab, #fff 8%, transparent)` |
| `--muted` | `color-mix(in oklab, #000 4%, transparent)` | `color-mix(in oklab, #fff 4%, transparent)` |
| `--muted-foreground` | `color-mix(in srgb, oklch(55.6% 0 none) 90%, #000)` | `oklch(76% 0 none)` |
| `--popover` | `#fff` | `color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 96%, #fff )` |
| `--popover-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--primary` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--primary-foreground` | `oklch(98.5% 0 none)` | `oklch(26.9% 0 none)` |
| `--ring` | `oklch(70.8% 0 none)` | `oklch(55.6% 0 none)` |
| `--secondary` | `color-mix(in oklab, #000 4%, transparent)` | `color-mix(in oklab, #fff 4%, transparent)` |
| `--secondary-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--sidebar` | `oklch(98.5% 0 none)` | `color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff)` |
| `--sidebar-accent` | `color-mix(in oklab, #000 4%, transparent)` | `color-mix(in oklab, #fff 4%, transparent)` |
| `--sidebar-accent-foreground` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--sidebar-border` | `color-mix(in oklab, #000 6%, transparent)` | `color-mix(in oklab, #fff 5%, transparent)` |
| `--sidebar-foreground` | `color-mix( in srgb, oklch(26.9% 0 none) 64%, oklch(98.5% 0 none) )` | `color-mix( in srgb, oklch(97% 0 none) 64%, color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff) )` |
| `--sidebar-primary` | `oklch(26.9% 0 none)` | `oklch(97% 0 none)` |
| `--sidebar-primary-foreground` | `oklch(98.5% 0 none)` | `oklch(26.9% 0 none)` |
| `--sidebar-ring` | `oklch(70.8% 0 none)` | `oklch(70.8% 0 none)` |
| `--success` | `oklch(69.6% 0.17 162.48)` | `oklch(69.6% 0.17 162.48)` |
| `--success-foreground` | `oklch(50.8% 0.118 165.612)` | `oklch(76.5% 0.177 163.223)` |
| `--warning` | `oklch(76.9% 0.188 70.08)` | `oklch(76.9% 0.188 70.08)` |
| `--warning-foreground` | `oklch(55.5% 0.163 48.998)` | `oklch(82.8% 0.189 84.429)` |

### Spacing values

The default spacing unit is `0.25rem` (4px).
These rows are spacing multipliers, not separate tokens.
Multiply the spacing token in a StyleX `calc()` value.
Pixel equivalents assume a 16px root font size.
Spacing-based values change when the spacing token changes.

| Units | Default value | Pixel equivalent |
| --- | --- | --- |
| 0 | `0rem` | 0px |
| 0.5 | `0.125rem` | 2px |
| 1 | `0.25rem` | 4px |
| 1.5 | `0.375rem` | 6px |
| 2 | `0.5rem` | 8px |
| 3 | `0.75rem` | 12px |
| 4 | `1rem` | 16px |
| 5 | `1.25rem` | 20px |
| 6 | `1.5rem` | 24px |
| 8 | `2rem` | 32px |
| 10 | `2.5rem` | 40px |
| 12 | `3rem` | 48px |
| 16 | `4rem` | 64px |
| 20 | `5rem` | 80px |
| 24 | `6rem` | 96px |
| 32 | `8rem` | 128px |

Stack, VStack, and HStack gaps use four units: `1rem` (16px) by default.

### Typography sizes

These values describe unmodified component defaults.
Heading size follows the rendered heading level. Line height values are unitless.

| Component | Font size | Line height | Font weight |
| --- | --- | --- | --- |
| Text | `1rem` (16px) | `1.5` | 400 |
| Heading h1 | `2.25rem` (36px) | `1.25` | 600 |
| Heading h2 | `1.5rem` (24px) | `1.25` | 600 |
| Heading h3 | `1.25rem` (20px) | `1.25` | 600 |
| Heading h4 | `1.125rem` (18px) | `1.25` | 600 |
| Heading h5 | `1rem` (16px) | `1.25` | 600 |
| Heading h6 | `0.875rem` (14px) | `1.25` | 600 |

### Control sizes

The responsive breakpoint is `640px`.
Input heights exclude the wrapper's 1px borders.
Icon button width equals its height.

| Component size | Height below 640px | Height at 640px and above |
| --- | --- | --- |
| Button xs / icon-xs | `1.75rem` (28px) | `1.5rem` (24px) |
| Button sm / icon-sm | `2rem` (32px) | `1.75rem` (28px) |
| Button default / icon | `2.25rem` (36px) | `2rem` (32px) |
| Button lg / icon-lg | `2.5rem` (40px) | `2.25rem` (36px) |
| Button xl / icon-xl | `2.75rem` (44px) | `2.5rem` (40px) |
| Input sm | `1.875rem` (30px) | `1.625rem` (26px) |
| Input default | `2.125rem` (34px) | `1.875rem` (30px) |
| Input lg | `2.375rem` (38px) | `2.125rem` (34px) |

Default Button and Input text uses `1rem` (16px) below 640px and `0.875rem` (14px) at 640px and above.
Button xs text uses `0.875rem` (14px) below 640px and `0.75rem` (12px) at 640px and above.
Button xl text uses `1.125rem` (18px) below 640px and `1rem` (16px) at 640px and above.

### Layout and radius sizes

| Setting | Default value | Pixel equivalent |
| --- | --- | --- |
| Container maximum width | `90rem` | 1440px |
| Container inline padding | `1rem` (4 spacing units) | 16px |
| Button coarse-pointer target minimum | `2.75rem` | 44px |
| `--radius` | `0.75rem` | 12px |
| `--radius-sm` | `0.5rem` | 8px |
| `--radius-md` | `0.75rem` | 12px |
| `--radius-lg` | `1rem` | 16px |
| `--radius-xl` | `1.5rem` | 24px |

A fluid Container uses full width without a maximum width.

## Design system guidance maintenance

This design system is still in development. This repository keeps design
instructions in `AGENTS.md`. Do not add a root `DESIGN.md`.

- Update this file whenever you add a component or change the design system.
  Record the component's purpose and relevant composition rules.
- Update component conventions, selection rules, tokens, typography, spacing,
  themes, motion, and accessibility instructions when their contracts change.
- Keep the consumer guidance template in `packages/cli/src/guidance.ts`
  aligned with this file and canonical registry source in the same change.
- Update CLI guidance tests when generated instructions or file behavior change.
  Do not copy repository-only paths or development commands into consumer files.
- CLI `ui.json` accepts optional project-relative `paths` for `components`,
  `ui`, `hooks`, `lib`, `styles`, and `theme`. Missing keys keep default source
  directories. Init offers opt-in directory prompts. Fresh init uses `src/`
  defaults only when the target package has `src`; its theme directory is
  `themes`. Persist the detected import alias root in `sourceRoot`. Preserve
  existing tracked layouts. The `ui` directory is independent of `components`.
  Keep install destinations, copied imports, init configuration, and shared
  exports aligned.
- CLI init offers three opt-in choices: `DESIGN.md`, update `AGENTS.md`, or
  do nothing. Noninteractive init does nothing unless `--guidance` selects a file.
- Write consumer guidance in the target app directory, including shared UI setup.
  Preserve text outside the Yopem UI managed block. Do not write both files.

## Agent skills

Consumer agent skills live in `skills/yopem-ui/`, `skills/yopem-ui-cli/`, and
`skills/yopem-ui-oxlint/`. Their `SKILL.md` files are permitted tracked Markdown
files. Keep skill instructions aligned with component APIs, CLI behavior, and
Oxlint rules when those contracts change.

Keep these skills usable outside this repository. Use consumer imports and
public documentation links. Do not require repository-only aliases, paths, or
commands. Keep installation instructions in `README.md`.

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
5. Update this `AGENTS.md` and `packages/cli/src/guidance.ts` for new components
   and design system changes.
6. Run `bun run registry:build`.
7. Run focused registry, docs, interaction, and accessibility tests as needed,
   then required checks.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
