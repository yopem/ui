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

- Do not add code comments.
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

Use `--radius` (12px by default) for standard buttons, inputs, cards, dialogs, menus, sidebars, and app surfaces. Use `--radius-sm` (8px by default) for compact details. Other radius tokens are explicit overrides. Use xstyle to change corners. Use controlXstyle for Input and Textarea wrappers. Keep functional circles, compact indicators, and edge-attached corners intact.

For the docs layout, use a 14rem sidebar with compact neutral rows. Use
`--background` for the header, sidebar, and main area in both themes. Keep the
header and sidebar borderless. Use a borderless InputGroup for search. On the
home showcase, use square muted preview panels with a thin `--card-border`.
Center each preview on both axes. Put captions and neutral arrows below the
panels. Do not alternate card fills or add decorative shadows.

## Design system foundations

- Use neutral light and dark surfaces. Use semantic color pairs for text and
  surfaces: background/foreground, primary, secondary, muted, accent, card, and
  popover. Use destructive, success, warning, and info tokens for status.
  Use neutral inverse primary actions.
  Keep links and hover surfaces neutral, including on hover. Use `--ring` for focus.
  Use the blue accent-solid pair for checked and selected indicators. Use blue for info status and occasional sidebar-primary actions.
  Keep the accent and sidebar-accent pairs neutral.
  Keep existing color token names. Add tokens when a new role needs them.
- Use Geist Sans for body text and headings.
  Use Geist Mono for code and mono text.
  The font tokens specify these families. Load both fonts in the application.
- Use `tokens["--spacing"]` as the spacing unit. Its default is `0.25rem`.
  Stack, VStack, and HStack use four spacing units by default.
- Use the main and compact radius defaults described above. The other radius
  tokens are available as explicit overrides.
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
  Dialog, AlertDialog, Sheet, Drawer, and Command popups accept `frameTitle` as a
  visual caption. Provide a separate accessible title or label. AlertDialog's
  close button defaults to visible and cancels; it does not confirm. `closeProps`
  configures that close control. Drawer hides its close button by default.
  CommandDialogPopup includes the Dialog close button.
  SheetPopup accepts `surfaceXstyle` for its inner surface. Mobile Sidebar uses
  this slot for one flat surface.
  Drawer uses one sidebar-colored surface for its frame, content, and footer.
  Select and Combobox use neutral hover and solid-accent selected rows.
  Steps is a static ordered process, not a navigation control.
- Use Card with CardHeader, CardPanel, and CardFooter for card content. Set
  `bordered={false}` to remove the Card border. CardFrame adds an outer frame.
- NumberField is compact by default; set `fullWidth` to fill its parent. Table
  has no body row dividers by default; set `rowBorders` to add them.
  AutocompleteInput accepts `controlXstyle` for its outer Input wrapper.
- Use existing navigation, feedback, data display, and utility components.
  Check registry metadata and component documentation before adding substitutes.

Use `--control-background` for field surfaces. Use `--overlay-shell` for the
outer Dialog, AlertDialog, Sheet, and Command frame. Use the card pair for the
inner surface and footer. Use the popover pair for floating menus, Popover,
Select, and Toast. Use `--overlay-backdrop` for overlay backdrops. Do not add
inset highlight shadows. Use `bordered={false}` on Input or InputGroup for a
borderless control. Keep the focus indicator. Field and Fieldset are borderless by
default. Use `bordered` to add a border and padding to the wrapper only.

### Color values

These are Yopem UI defaults from `tokens.stylex.ts`.
Use current token and component values when the project has overrides.
Keep the CSS color values intact.
Use semantic tokens in styles, not these literal values.

| Token | Light value | Dark value |
| --- | --- | --- |
| `--accent` | `#f3f4f6` | `#212121` |
| `--accent-foreground` | `#111111` | `#f5f5f5` |
| `--accent-solid` | `#2563eb` | `#2563eb` |
| `--accent-solid-foreground` | `#fff` | `#fff` |
| `--background` | `#fff` | `#090909` |
| `--border` | `#e5e7eb` | `#292929` |
| `--control-background` | `#fff` | `#181818` |
| `--overlay-backdrop` | `rgb(0 0 0 / 0.7)` | `rgb(0 0 0 / 0.7)` |
| `--overlay-shell` | `#f3f4f6` | `#090909` |
| `--destructive-hover` | `#b91c1c` | `#b91c1c` |
| `--destructive-solid-foreground` | `#fff` | `#fff` |
| `--card` | `#fff` | `#111111` |
| `--card-border` | `#e5e7eb` | `#181818` |
| `--card-foreground` | `#111111` | `#f5f5f5` |
| `--code` | `#fff` | `#111111` |
| `--code-foreground` | `#111111` | `#f5f5f5` |
| `--code-highlight` | `#f3f4f6` | `#212121` |
| `--destructive` | `#dc2626` | `#dc2626` |
| `--destructive-foreground` | `#b91c1c` | `#fca5a5` |
| `--foreground` | `#111111` | `#f5f5f5` |
| `--info` | `#2563eb` | `#60a5fa` |
| `--info-foreground` | `#1d4ed8` | `#93c5fd` |
| `--input` | `#e5e7eb` | `#212121` |
| `--muted` | `#f9fafb` | `#111111` |
| `--muted-foreground` | `#606775` | `#a3a3a3` |
| `--popover` | `#fff` | `#181818` |
| `--popover-foreground` | `#111111` | `#f5f5f5` |
| `--primary` | `#111111` | `#f5f5f5` |
| `--primary-foreground` | `#fff` | `#090909` |
| `--ring` | `#2563eb` | `#60a5fa` |
| `--secondary` | `#f3f4f6` | `#212121` |
| `--secondary-foreground` | `#111111` | `#f5f5f5` |
| `--sidebar` | `#fff` | `#090909` |
| `--sidebar-accent` | `#f3f4f6` | `#111111` |
| `--sidebar-accent-foreground` | `#111111` | `#f5f5f5` |
| `--sidebar-border` | `#e5e7eb` | `#181818` |
| `--sidebar-foreground` | `#606775` | `#a3a3a3` |
| `--sidebar-primary` | `#2563eb` | `#2563eb` |
| `--sidebar-primary-foreground` | `#fff` | `#fff` |
| `--sidebar-ring` | `#2563eb` | `#60a5fa` |
| `--success` | `#059669` | `#34d399` |
| `--success-foreground` | `#047857` | `#6ee7b7` |
| `--warning` | `#d97706` | `#fbbf24` |
| `--warning-foreground` | `#92400e` | `#fcd34d` |

### Shadow values

Use shadow tokens for subtle depth.

| Token | Light value | Dark value |
| --- | --- | --- |
| `--shadow-lg` | `0 0 30px rgb(0 0 0 / 0.04), 0 0 10px rgb(0 0 0 / 0.06)` | `0 0 30px rgb(0 0 0 / 0.2), 0 0 10px rgb(0 0 0 / 0.24)` |
| `--shadow-md` | `0 0 15px rgb(0 0 0 / 0.04), 0 0 2px rgb(0 0 0 / 0.06)` | `0 0 15px rgb(0 0 0 / 0.16), 0 0 2px rgb(0 0 0 / 0.24)` |
| `--shadow-sm` | `0 1px 2px rgb(0 0 0 / 0.05)` | `0 1px 2px rgb(0 0 0 / 0.15)` |

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
| Heading h1 | `2.25rem` (36px) | `1.25` | 400 |
| Heading h2 | `1.5rem` (24px) | `1.25` | 400 |
| Heading h3 | `1.25rem` (20px) | `1.25` | 400 |
| Heading h4 | `1.125rem` (18px) | `1.25` | 400 |
| Heading h5 | `1rem` (16px) | `1.25` | 400 |
| Heading h6 | `0.875rem` (14px) | `1.25` | 400 |

### Control sizes

The responsive breakpoint is `640px`.
Input heights exclude the wrapper's 1px borders.
The default Input is 40px high with its borders.
Icon button width equals its height.

| Component size | Height below 640px | Height at 640px and above |
| --- | --- | --- |
| Button xs / icon-xs | `2rem` (32px) | `2rem` (32px) |
| Button sm / icon-sm | `2rem` (32px) | `2rem` (32px) |
| Button default / icon | `2.5rem` (40px) | `2.5rem` (40px) |
| Button lg / icon-lg | `3rem` (48px) | `3rem` (48px) |
| Button xl / icon-xl | `3rem` (48px) | `3rem` (48px) |
| Input sm | `1.875rem` (30px) | `1.875rem` (30px) |
| Input default | `2.375rem` (38px) | `2.375rem` (38px) |
| Input lg | `2.875rem` (46px) | `2.875rem` (46px) |

Default Button and Input text uses `1rem` (16px) below 640px and `0.875rem` (14px) at 640px and above.
Button xs text uses `0.875rem` (14px) below 640px and `0.75rem` (12px) at 640px and above.
Button xl text uses `1.125rem` (18px) below 640px and `1rem` (16px) at 640px and above.
Select defaults to 40px height and 14px text. Its popup uses a soft shadow.
Selected options are blue. Unselected options have a neutral highlight.
Switch has a 37px by 18px visual track and an 8px thumb. Its checked track is
blue. Its off state uses neutral colors. Its coarse-pointer target is at least 44px.

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
| `--radius-xl` | `2rem` | 32px |
| `--radius-full` | `9999px` | 9999px |

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
