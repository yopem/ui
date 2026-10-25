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
bun run test:editor-callout-clipboard
bun run test:a11y        # docs and registry accessibility tests
bun test ./tests/cli      # CLI tests without browsers
bun run build            # registry and docs production build
```

The clipboard command writes its browser report to
`test-results/editor-callout-clipboard/`.

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
  - `/editor` lists public editor React parts. Register each shipped part in
    `src/catalog/editor-parts.ts`. Add its focused live example under
    `src/catalog/editor-previews/`. Set the correct install item and consumer
    import. The inventory supplies navigation, search, Markdown, and sitemap
    entries. `/api/editor.json` publishes this inventory. Add new feature parts
    in their implementation scope. Do not register UI that does not exist.
  - `src/routes/` — catalog, guide, API, SEO, and machine-readable
    routes. Run `bun run generate-routes` after route changes; never edit
    `routeTree.gen.ts`.
  - `src/styles.css` — docs application global styles only.
- `packages/editor/` — canonical Lexical editor source and editor utilities.
  Reuse registry UI controls and semantic StyleX tokens. Do not add Tailwind.
  Publish editor source through the registry so the CLI can copy it.
  Keep all editor tests under root `tests/`, not inside this package.
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

Canonical sources live under `packages/registry/src/` and `packages/editor/src/`.
Keep editor code in the editor package. Never hand-edit
`packages/registry/dist/`, `apps/docs/public/r/`,
`apps/docs/public/schema/`, `packages/registry/src/docs.generated.json`, or
TanStack-generated route files. `bun run registry:build` regenerates registry
artifacts; docs dev, registry build, and registry typecheck regenerate API data.

## Dependency versions

Use caret ranges for dependency versions. Preserve `workspace:` and `catalog:`
references, including peer references. Keep npm aliases and use inner caret ranges.
Use a catalog only for dependencies used in at least two package manifests.
Keep single-manifest dependencies in that manifest. Do not change package versions
or `packageManager` values to caret ranges. Do not update resolved versions for
policy-only changes.

## Code comments

Do not add code comments or JSDoc. Preserve existing comments.

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
- Use Codeblock intentionally for code displays. Its code pane accepts keyboard
  focus for horizontal scrolling. Its div wrapper, toolbar, and internal pre
  mean it cannot blindly replace a native pre or its ref/events.
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
- Use Editor for rich-text entry. Keep editor behavior and utilities in
  `packages/editor`. Keep reusable UI primitives in the registry UI directory.
  Expose small composable editor parts and a ready-to-use preset. Keep provider,
  editable surface, toolbar, and feature controls separate. Document each public
  part. Make CLI source dependencies match those parts. Keep consumer skills
  aligned with both preset use and custom composition.
  Use Lexical document state, not Slate state. Do not imply Plate plugin or
  document compatibility. Keep editor styles in StyleX. Preserve native editing,
  selection, clipboard, history, keyboard input, and accessible control names.
  Reject empty rich clipboard insertions without removing selected content.
  Discard saved link and table selections after document content changes. Use
  EditorTableMenu for table actions. Register EditorTablePresentationExtension
  for bounded geometry and persisted cell borders. Compose EditorTableDimensions,
  EditorTableCellPresentation, and EditorTableResizeControls inside EditorRoot.
  Use EditorTableBackgroundControls and EditorTableBorderControls separately when needed.
  Border controls support logical edges and inside, outside, all, none, and reset actions.
  Shared merged edges are indivisible. Mirror updates across the complete shared edge.
  Configure `disableMerge:true` at mount time to block house merge actions.
  Existing spans remain. Explicit splitting stays available. Native host mutations bypass this policy.
  Row resizing stores native row minimum height. Content can increase visible height.
  Keep `data-editor-row-height` in exported HTML to preserve finite native heights.
  Keep table scrolling bounded in both directions and keyboard-accessible.
  Keep table validation pure and shared with import paths. Reject invalid table
  updates without removing existing content. Preserve native table clipboard,
  merged spans, resize cancellation, history, and right-to-left keyboard behavior.
  Render checklist items as native list items with separate checkbox controls.
  Keep native list semantics, keyboard input, history, and read-only behavior.
  Keep the
  `editor-content` slot. Base CSS resets Lexical's native text wrappers only;
  StyleX supplies the text theme.
- Compose editor style controls inside EditorRoot and EditorToolbar. Keep
  EditorBlockPresentationExtension in a stable mount-time extension array,
  including read-only roots. Use EditorIndentButton for block indentation and
  EditorFirstLineIndentControl for first-line indentation. Use font color,
  background, family, size, weight, line-height, alignment, and clear controls
  instead of custom formatting handlers. Saved selections expire after content
  changes. Keep native host-event cancellation and history behavior intact.
  Pure block-presentation helpers must remain independent of React. Validate
  lineHeight (unitless 1 through 4) and textIndent (0 through 160px or 10em/rem).
  Keep these values in JSON NodeState and native HTML conversion hooks. Preserve
  converter priority, child callbacks, and export slots. Keep host HTML
  sanitization. Clear formatting must keep content, links, list nesting, table
  structure, and unrelated NodeState.
- Use the optional `editor-code` item for native code editing. Register
  `EditorCodeExtension` when you create `EditorRoot`. Keep `EditorContent` as the
  editable surface. Do not replace native code nodes with Codeblock. Put
  `EditorCodeLanguage`, `EditorCodeCopyButton`, `EditorCodeToggle`, and
  `EditorCodeStatus` inside `EditorCodeToolbar`. Select one code block before
  using its controls. Copy can run read-only; mutation cannot. Line numbers and
  wrapping turn each other off. Lexical JSON preserves these view choices.
  Keep native code keyboard behavior and serializers. Discard saved code
  targets after host document changes. Base editor-code does not require
  Prettier. Supply an explicit EditorCodeFormatter for formatting controls.
  Install editor-code-format only for the optional prettierEditorCodeFormatter.
  The repository uses Oxfmt. Formatting parsers support fewer languages than
  syntax colors. Cancellation cannot stop synchronous parser work.
- Keep editor authentication helpers in `packages/editor/src/server` and out of
  the browser entry. The `editor-auth` registry item copies them to the consumer
  library directory. Support existing OpenAuth and Better Auth services. Do not
  create a second account system. Require an explicit OpenAuth audience and a
  separate document policy. Keep origin and CSRF checks in host server routes.
  Do not treat a valid token or an admin role as document access. Never put
  tokens in query strings, WebSocket URLs, or logs. Forward verified
  `credentialExpiresAt` in Unix epoch milliseconds. Reject supplied expired
  metadata before and after document policy checks. Better Auth verification
  must not refresh sessions. Collaboration tickets must require verified expiry.

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

## Editor document storage

Use the separate `editor-store` server library for D1 or PostgreSQL snapshots.
Apply one copied SQL migration before use. Supply existing authentication,
complete Lexical validation, and host document policies, including deletion.
Keep snapshots within 1 MiB, 131072 JSON values, and 64 nested objects or arrays.
Use exact trusted origins and host CSRF verification for HTTP writes.
Keep operation IDs, preconditions, provider, and user ID unchanged on uncertain retries.
HTTP callbacks receive cancellation through `Request.signal`. Storage checks
deadlines before driver calls. PostgreSQL checks remaining time before each statement.
Synchronous work cannot be stopped.
Do not add accounts, ACL tables, or implicit document grants.
See https://ui.yopem.com/docs/editor-store for protocol and deployment limits.

## Optional editor collaboration

Install `editor-collaboration` for browser source and
`editor-collaboration-server` for generic server source. Import browser parts
from `@/components/editor/collaboration` and generic helpers from
`@/lib/editor-collaboration`. Keep server imports out of browser bundles.

Install only the required runtime item: `editor-collaboration-worker` for
Durable Objects, `editor-collaboration-bun` for Bun, or
`editor-collaboration-node` for Node. Import from
`@/lib/editor-collaboration/collaboration-do`,
`@/lib/editor-collaboration/collaboration-bun`, and
`@/lib/editor-collaboration/collaboration-node` only in their matching runtime.
Never export native entries from browser or generic server barrels.

Reuse host authentication and require verified `credentialExpiresAt`, an exact
HTTPS origin, CSRF checks, literal-true document policies, real SQL
transactions, and a schema-complete initializer. Bind the Node `node:http`
server privately behind a trusted HTTPS/WSS proxy. Bun can use host TLS.

Keep binary document frames and bounded text readiness, delivery, and ACK
controls for the custom `editor-v1` protocol. Ordinary WebSocket send completion
does not confirm durable delivery. Recheck each recipient. Rechecks do not make
revocation atomic with database writes. Keep history bounded to 256 updates and
1 MiB; no automatic compaction is supplied. Do not replay uncertain offline
drafts automatically. These source contracts do not establish runtime or
deployment validation.

## Optional editor blocks

Register `EditorBlocksExtension` for native callouts and toggles.
Compose focused block controls inside `EditorToolbar`.
Keep server imports on `@/components/editor/blocks-model`.
Validate block metadata and structure before document replacement.
Read-only disclosure must not change saved state or history.

Keep rich toggle titles outside the native summary control.
Keep title links usable when closed.
Keep the native details body, empty disclosure control, and content slot together.


## Optional editor review

Install `editor-review` separately from `editor`.
Use `EditorReviewPreset` for a complete editor or compose review parts inside `EditorRoot`.
Keep one review controller and extension per root in a stable mount-time array.
Supply a verified viewer and a synchronous host policy for every action.
Allow an action only when current policy returns literal `true`.
Serialized author IDs do not grant access. Recheck every action on the server.
`visible=false` hides review UI. It does not redact or delete review state.
Review state uses root NodeState `yopemReview` and text NodeState `yopemSuggestion`.
Use `parseReviewDocument` at IO boundaries. Register `MarkNode` in every reader that loads review state.
Untrusted input loses review metadata. Trust it only after host verification.
Review suggestions are inline only. Text diffs support one paragraph, 2048 graphemes, and 4096 UTF-16 units.
Paste inserts plain text only. Rich HTML paste is rejected. Pasted review metadata is not preserved.
The separate `editor-document` readers do not import review formats.
See https://ui.yopem.com/components/editor-review for API and limits.

## Editor AI proposals

Install optional `editor-ai` server source separately from `editor` client source.
Import server helpers from `@/lib/editor-ai`. Never import them into browser code.
Compose `EditorAiRoot`, `EditorAiTrigger`, and `EditorAiPanel` inside `EditorRoot`.
Supply an explicit same-origin endpoint, documentId, and current host authentication and CSRF headers.
Without configuration, AI controls render nothing. No default endpoint or model exists.
Review progressive untrusted plain text. Approval requires explicit completion and clean EOF.
Content, format, style, non-null selection, and read-only changes invalidate proposals.
A null selection retains the saved target for dialog use.
Remount EditorAiRoot when host code discards the saved target.
Approval makes one local history update. Authorize document writes separately.
Supply existing OpenAuth or Better Auth, verified expiry, exact HTTPS Origin, CSRF verification, and durable host quota.
Require literal true from the document policy for `ai:invoke`. This permission never grants `document:write`.
Keep provider credentials and model selection on the server. Never retry paid requests automatically.
Keep tokens out of browser storage, URLs, and logs. Cancellation does not prove that billing stops.
See https://ui.yopem.com/docs/editor-ai for provider schema and deployment limits.

## Optional editor typeahead

Install `editor-typeahead` separately. Import optional parts from the copied editor `typeahead-index` module.
Create one stable controller per root. Keep its extension and custom command arrays stable at mount time.
Render `EditorTypeahead` inside that root. Compose `EditorEmojiMenu` inside EditorToolbar for search.
Supply a bounded, abort-aware host mention loader. Missing loaders disable mentions.
The controller registers `MentionNode` only when `mentions.load` is set.
Keep mention options fixed for each root.
Register `MentionNode` in every document reader. Use the pure `mention-codec` helpers for IO validation.
Serialized identities do not grant access. Register Markdown conversion explicitly and keep host HTML sanitization.
Use the full English emojibase-data inventory or validated host emoji graphemes. Search returns at most 50 results per page.
Use category and page controls to browse the inventory. Validate host inventories with `parseEditorEmojiInventory`.
Pass `controller.emojiHistory` to the picker to share bounded memory usage counts. No automatic storage is included.
See https://ui.yopem.com/components/editor-typeahead for public contracts and limits.

Use EditorInlineCombobox with Input, Content, List, Item, Empty, Status, Group, GroupLabel, and Row parts.
EditorInlineComboboxInput renders EditorContent. Do not add a second query input.
Keep every current item in controller order. Read state with useEditorInlineCombobox.
Compose EditorEmojiPopover, EditorEmojiToolbarButton, EditorEmojiPopoverContent, and EditorEmojiPicker inside EditorToolbar.
EditorEmojiPicker is the panel. EditorEmojiMenu is the complete toolbar preset.
Compose EditorEmojiSearch, EditorEmojiCategory, EditorEmojiList, EditorEmojiItem, EditorEmojiEmpty, EditorEmojiPrevious, EditorEmojiNext, and EditorEmojiClearHistory.
Read picker state with useEditorEmojiPicker. Keep inventory, filter, and history stable until unmount.
Keep inline and emoji options at least 44px high for coarse pointers.
EditorTypeahead renders the editable surface and suggestions. Do not add EditorContent beside this preset.

## Editor examples

Keep core example compositions in `apps/docs/src/catalog/editor-examples/`.
Publish the gallery at `/editor/examples` with complete consumer source.
Keep its JSON inventory, Markdown, search, navigation, and sitemap entries aligned.
State each example's limits. Do not call the house preset the full Plate EditorKit.
Do not mark a mapped public workflow complete before its behavior is checked.

## Optional editor media

Install `editor-media` separately. Import optional parts from the copied `media` module.
Register `MediaExtension` in a stable extensions array.
Compose `MediaInsertControl` inside `EditorToolbar`.
`MediaContent` renders validated media without `EditorRoot`.
Use HTTPS URLs without credentials and exact supported embed hosts.
Keep native audio, video, file, and iframe controls usable in read-only roots.
Supply bounded, abort-aware host uploads with server authorization and validation.
Private assets require explicit same-origin delivery integration. Never put tokens in media URLs.
Register `MediaNode` in every reader. Preserve native tagged figure HTML.
Registered media supports validated JSON, canonical tagged HTML, and Markdown HTML fallback.
Conversion rejects relative URLs, URL credentials, queries, and fragments.
Private delivery still requires host authorization and a trusted URL resolver.

## Optional editor footnotes and contents

Install `editor-footnotes` and `editor-toc` separately.
Register their extensions in stable root extension arrays.
Compose focused controls inside `EditorToolbar`.
`EditorFootnoteTypeahead` owns the editable surface. Do not add adjacent `EditorContent`.
Preserve repeated references, unresolved references, and duplicate definitions.
Renumber a selected duplicate explicitly. Do not silently rewrite identifiers.
Table-of-contents links target headings in the current editor only.
`editorTocSlashCommand` is an optional host slash action. Base contents controls do not require typeahead.
Register feature nodes in every reader and validate complete documents at IO boundaries.
Generic document converters do not yet support footnote or table-of-contents nodes.
Reject unsupported content without removing the current document.

## Optional editor columns and dates

Install `editor-columns` and `editor-date` separately from the core editor.
Register `EditorColumnsExtension` and `EditorDateExtension` in stable root extension arrays.
Compose `EditorColumnsControls` and `EditorDateControls` inside `EditorToolbar`.
Use focused column insert, layout, resize, move, and remove controls when needed.
Columns contain two through four native rich-text containers. Nested column groups are not supported.
Use the house Slider for resize controls. Remove deletes the group and its content.
Use the house Calendar for date insertion and native date editing.
`EditorDateNode` renders `EditorDateInline` with its current date and node key.
Store validated YYYY-MM-DD dates without timestamp conversion. Convert local dates with `editorDateFromLocalDate`.
Keep pure codecs in `columns-model` and `date-model`. These models do not import React or Lexical.
Copy all feature helpers and keep core selection helpers. Shared packages must export feature and model subpaths.
Keep generic document converters unsupported for these nodes until deliberate codec integration. Never flatten them silently.
Feature validators check their own contracts. Supply complete host document validation at IO boundaries.

## Optional editor math

Install `editor-math` for inline and block TeX equations.
Register `EditorMathExtension` in a stable extensions array.
Compose `EditorMathControls` inside `EditorToolbar`.
Use `EditorMathControl kind="inline"` or `kind="block"` to insert an equation.
Omit `kind` to edit one selected equation.
Use `EditorMathPreview` for the current expression.
Select equations with pointer input or keyboard focus.
Apply changes, cancel changes, or delete the selected equation.
Host document changes expire saved targets. Read-only roots cannot change equations.

```sh
bunx --bun @yopem-ui/cli add editor-math
npx @yopem-ui/cli add editor-math
pnpm dlx @yopem-ui/cli add editor-math
yarn dlx @yopem-ui/cli add editor-math
```

KaTeX renders native MathML. No stylesheet, font, CDN, or service import is required.
Browser MathML support controls visual output. Keep a visible error for invalid TeX.
Trust features and user macros are not supported. TeX has a 4096-character limit.
Use `math-model` for pure JSON, HTML attribute, and Markdown fragment codecs.
Use `math-node` for native Lexical JSON and HTML conversion.
Import `renderEditorMath` from `math-render` for server-safe MathML output.
Check its `ok` field before using the returned HTML.
JSON uses type `editor-math`, version `1`, kind `inline` or `block`, and `tex`.
HTML uses `span` for inline math and `div` for block math.
Both elements require `data-editor-math` and `data-editor-tex`. Exported text contains TeX, not rendered HTML.
Sanitize host HTML before import. Validate metadata before replacing document content.
These fragment codecs do not parse complete documents or Plate state.

## Optional editor document I/O

Install `editor-document` separately for JSON, HTML, Markdown, streaming, and static output.
It depends on `editor` and `editor-blocks`. Base editor installs do not include document codecs.
Import helpers from `@/components/editor/document` and DocumentStatic from `@/components/editor/document/static`.
DocumentStatic needs no EditorRoot. Keep every copied helper, including `document/state.ts` and canonical presentation codecs.
Keep `@types/hast` as a direct consumer dependency.
Register EditorDocumentClipboardExtension at root creation in a stable extensions array.
Call registerDocumentPaste after creation. Keep its cleanup in the host lifecycle.
Opt in with `{ markdown: true }` for validated Markdown fragments at the native caret.
Lexical JSON and HTML keep priority. Default plain-text paste stays native.
Reject empty or unsupported fragments without removing selected content.
Register EditorBlocksExtension for live callout and toggle imports.
Invalid, stale, cancelled, and read-only imports keep current content. Streams commit once after EOF.
Register math and mention nodes before importing their representations.
Markdown supports TeX delimiters with canonical HTML fallback when required for fidelity.
Static and standalone HTML use native MathML.
Mentions use the validated identity codec.
Saved mention identities do not grant access.
Media JSON and canonical tagged figure HTML preserve native media metadata.
Markdown uses canonical HTML for media. Register MediaExtension for live rendering.
Use MediaNode in headless readers. Reject media URL credentials, queries, and fragments.
Review formats fail closed before document replacement.
Keep native clipboard priorities, host vetoes, and host HTML sanitization.
Host MIME handlers that consume data must validate their own output.

## Editor private assets

Use the separate `editor-assets` server library with D1 or PostgreSQL and private R2 or S3.
Apply matching dialect migrations 0001, 0002, and 0003 in order.
Keep authentication, verified expiry, document and asset policy, exact origins, and CSRF checks in the host.
Reuse factory instances. Supply quotas, bounded structural decoders, security scanners, and recurring cleanup with complete inventory cycles.
Do not treat fixture validators or signatures as production scanners.
Asset repositories do not receive request cancellation. PostgreSQL timeouts are per statement, not cumulative; pool waits need host limits.
D1 batches and R2 binding calls cannot be interrupted through this API. S3 fetches receive cancellation signals.
Keep immutable attempts, fences, terminal probes, and permanent lifetime reservations.
Resolve private relative asset routes against an explicit trusted HTTPS same-origin delivery origin.
Validate the exact document and asset route. Native media requires existing same-origin cookie authentication.
Never put tokens in URLs, return bucket keys, or use public bucket fallbacks.
Keep provider credentials and server imports out of browser entries. This item adds no media UI nodes or accounts.
See https://ui.yopem.com/docs/editor-assets for migration, callback, delivery, and deployment limits.

## Optional whole-block selection

Install `editor-block-selection` separately.
Create one stable controller with `createEditorBlockSelection`.
Compose `EditorBlockSelection` inside `EditorRoot`.
Use the gutter and actions for keyboard selection and movement.
Use drag handles for pointer movement. Keep keyboard movement available.
Require synchronous literal `true` from `authorizeCut` before native cut.
Preserve native MIME handlers and higher-priority host cancellation.
Require literal `true` from custom document validation.
Content, selection, and read-only changes expire saved operations.
Authorize persisted document writes separately.


## Optional editor CSV

Install `editor-csv` for bounded native CSV clipboard imports.
Register `EditorCsvExtension` in a stable root extension array.
Use the pure `csv-model` entry for parsing without an editor.
Native Lexical JSON and HTML keep clipboard priority.
Keep HIGH and CRITICAL host paste policies intact.
Set `pasteTsv:false` on `EditorTablePresentationExtension` when CSV handles tab-containing fields.
HTML table validation stays active.
Reject invalid quotes, unequal row widths, and inputs above 1 MiB or 50 by 50 cells before mutation.
Plain-text detection requires a comma and multiple lines. Explicit `text/csv` also supports one row.
CSV data remains text. Do not evaluate formulas or render field HTML.

## Optional editor search

Install `editor-search` separately. Compose `EditorSearchRoot` inside `EditorRoot`.
Place `EditorContent` inside `EditorSearchViewport`. Use the input, previous, next, and status parts.
Search uses transient overlays and native selection. It does not replace or persist text.
Queries use at most 64 Unicode code points. Results contain at most 200 within-TextNode matches.
Matches do not cross styled TextNode boundaries. Scanning depends on document size.
Use the pure `search-model` module outside React. Keep native input cancellation and read-only navigation.


## Optional editor floating toolbar

Install `editor-floating-toolbar` separately.
Compose `EditorFloatingToolbar` inside EditorRoot beside EditorContent.
Use existing editor controls as children. Select native text to open it.
Press Alt+F10 to focus its first enabled button. Escape returns keyboard focus.
Keep the saved-range guard. Content changes and read-only transitions invalidate targets.
Native focus, nested popups, pointer geometry, RTL, and cleanup require runtime checks.


## Optional native editing rules

Install `editor-editing-rules` separately. Create its extension once per root.
Use Mod+Enter for an exit paragraph. Add Shift to insert before the root block.
Single-paragraph modes keep Enter and modifier shortcuts within one paragraph.
They apply only to one paragraph. They do not validate or flatten arbitrary documents.
Plain text has a 1 MiB limit. Converted block text has a 2501-line limit.
Reject rich, non-text, oversized, and converted-empty paste without removing selected content.
Preserve higher-priority host handlers, IME, native Tab, and read-only behavior.


## Optional selected block placeholders

Install `editor-block-placeholder` separately. Mount one `EditorBlockPlaceholder` beside `EditorContent` inside `EditorRoot`.
Keep labels fixed until unmount. Keys use native node types or heading tags `h1` through `h6`.
Hints apply only to focused, editable, empty top-level elements. Empty labels disable a hint.
Keep hint text outside document nodes and serializers. Clear owned DOM hints on blur, read-only changes, layer removal, and root cleanup.
A separate live status supplies the label. Preserve native caret, selection, history, and host classes.


## Optional editor input shortcuts

Install `editor-autoformat` separately. Register `EditorAutoformatExtension` in a stable root extensions array.
It adds checklist, nested quote, horizontal-rule, and fixed smart text substitutions without repeating base Markdown transformers.
Keep code literal, native history, host input policies, and composition behavior.
Fraction shortcuts require a word boundary. Line-start quote prefixes stay available.
Native clipboard, IME, overlapping substitutions, and inline-code history remain unverified.


Native document readers also support plain `horizontalrule` nodes and semantic `hr` HTML.
Register `HorizontalRuleExtension` before live rule imports.
Rules require block containers. Reject unrelated rule metadata or presentation instead of discarding it.
DocumentStatic renders rules through the house Separator. Rule conversion workflows remain runtime-unverified.


## Optional editor block behavior

Install `editor-block-behavior` separately. Register `EditorBlockBehaviorExtension` in a stable root extension array.
Collapsed heading Enter makes the new half a paragraph. Converted nodes retain serialized NodeState.
The command uses LOW priority. Higher-priority host policies can preempt it.
Other blocks, composition, read-only roots, and expanded selections keep native handlers.
This is not the Plate rule runtime. Native boundary, metadata, and history checks remain deferred.


## Optional editor labels

Install `editor-labels` separately. Create a stable `createEditorLabelsExtension(options)` per root.
Use `EditorLabelsPicker` for the preset or compose `EditorLabelsOption` inside `CheckboxGroup`.
Options admit one through 64 unique bounded strings. Tokens admit at most ten labels.
Apply application minimum counts in the host form. Replace only a label-only paragraph.
Register `EditorLabelNode` in each reader. Use `labels-model` for pure validation.
Malformed node metadata rejects. Unknown, duplicate, and excess valid tokens become text.
Label identities do not grant access. Generic document conversion remains unsupported.
Native clipboard, normalization, history, read-only, and accessibility checks are deferred.

## Optional editor Word clipboard

Install `editor-word-clipboard` separately for bounded Office HTML fragments.
Register `EditorWordClipboardExtension` in a stable root extensions array.
Call `registerDocumentPaste` and `registerWordClipboardPaste` after creation.
Keep both cleanup functions in the host lifecycle.
Import helpers from `@/components/editor/word-clipboard` and pure codecs from `@/components/editor/word-clipboard-model`.
Keep native JSON and host MIME priority. Invalid or stale input must not remove selected content.
Images reject by default. Supply a stable synchronous trusted-media resolver and register `MediaExtension` for resolved images.
Never fetch untrusted pasted file or network image URLs automatically.
Promises and thenables reject. Host callback side effects cannot be rolled back.
The bounded subset does not preserve full Word layout. Native capture and runtime acceptance remain deferred.

## Optional editor DOCX

Install `editor-docx` separately for bounded semantic Word file conversion.
Import portable functions from `@/components/editor/docx`.
Import client controls from `@/components/editor/docx-controls`.
Compose `EditorDocxImportControl`, `EditorDocxExportControl`, or `EditorDocxControls` inside `EditorRoot`.
Keep the base editor independent of DOCX code.
Imports validate archive, XML, document structure, and target registration before replacement.
Read-only and stale targets reject imports. Read-only export remains available.
Supply an AbortSignal for host cancellation. Synchronous parsing cannot be stopped.
Keep independent 1 MiB archive and decoded-data limits, bounded entries, and XML limits.
Unsupported content rejects. Do not promise complete Word layout, image, macro, header, or footer support.
Native deflate decompression is required for compressed archives.
Word file conversion does not implement the separate pinned Word clipboard workflow.
Runtime, real-file fidelity, and security fixture checks remain deferred.

## Optional editor list presentation

Install `editor-list-presentation` separately.
Register `EditorListPresentationExtension` in a stable extensions array.
Compose marker and signed-start controls inside `EditorToolbar`.
Markers apply to one list. Nested lists keep their own markers.
Checklists do not use custom markers.
Starts accept signed 32-bit integers, including zero. Invalid drafts do not change saved content.
Keep `yopemListMarker` NodeState, `data-editor-list-marker`, and native `ol` start attributes.
Compose host HTML hooks with `createEditorListPresentationHTMLConfig`.
Keep pure codecs in `list-presentation-model`.

Optional `editor-document` retains validated list markers and signed starts in JSON, HTML, Markdown, and static output.
Markdown uses canonical HTML when native Markdown cannot retain list presentation.

## Optional editable cards

Install `editor-editable-card` separately. Register `EditorEditableCardExtension` in a stable root extensions array.
Compose `EditorEditableCardInsertButton` inside `EditorToolbar`.
Keep native browser Tab order through form controls and the nested editor.
The nested editor has independent state and history. Local fields and notes are transient.
JSON stores only type and version. Removal, import, and undo restoration reset local values.
Outer read-only state disables local controls. Generic document conversion does not support cards.

## Optional inline Copilot

Install `editor-copilot` separately. Render `EditorCopilot` inside `EditorRoot` with a stable explicit configuration.
Supply a same-origin endpoint, document ID, and current host authentication and CSRF headers.
Use Control+Space at a paragraph end. Tab accepts completed text. Mod+Right accepts one grapheme. Escape cancels.
Require explicit completion and clean EOF before acceptance. Invalidate stale document, selection, style, composition, and read-only targets.
Automatic requests require host permission and user opt-in. They can incur charges.
Keep host document policy, quota, provider credentials, and model selection on the server.
Cancellation does not prove that billing stops. No default endpoint or model exists.

## Optional block context actions

Install `editor-block-menu` separately. Create one stable `createEditorBlockMenu` controller per root.
Register its extension at root creation. Wrap `EditorContent` with `EditorBlockMenu` inside that root.
Right-click a block or press Shift+F10. Keep native selection, clipboard policies, history, and host event cancellation.
Configured `authorizeAction` must return literal `true`. Stale or pending document targets reject actions.
Supply explicit `onAskAI` and `onCodeDrawing` callbacks when needed. These callbacks do not grant document access.
Supply `onAddComment` with an `authorizeAction` policy for the Add comment action.
The policy must return literal `true`. The callback owns review UI, focus, and storage.
The controller passes frozen block context. It does not restore the captured selection for this action.
No default service is supplied. The gallery omits unconfigured host actions and earns no full block-menu equivalence credit.

## Optional editor diagrams

Install `editor-diagram` for native diagram code and composed controls.
Register `EditorDiagramExtension` in a stable root extensions array.
Compose `EditorDiagramRoot` inside `EditorRoot`. Supply explicit renderers.
Use its Toolbar, InsertButton, KindSelect, ViewModeSelect, RenderButton,
DownloadButton, DeleteButton, Status, and Preview parts.

Native JSON and marked code HTML keep diagram metadata.
Generic document conversion rejects this metadata.
Keep source visible until the matching sanitized SVG image loads.
Per-node previews keep independent selection paths. Only SVG download is supplied.

Install optional engine adapters separately: `editor-diagram-mermaid`,
`editor-diagram-plantuml`, `editor-diagram-graphviz`, or `editor-diagram-flowchart`.
Import SDK adapters only from browser-only entries. Do not import them into SSR routes.
Source filters are supported subsets, not SDK sandboxes.
Use `renderEditorDiagram` for direct calls. It bounds and sanitizes returned SVG.
Cancellation cannot stop synchronous engine work or all queued operations.
Validate the chosen SDK, CSP, workers, WebAssembly, and lifecycle before deployment.
Mermaid requires Node 22.12 or later for its tooling.

Host endpoints need current authentication, document authorization, exact Origin,
CSRF verification, and execution limits. No default endpoint or renderer exists.
Never put credentials in diagram URLs. Configure headers explicitly.


## Optional AI command menu

Install `editor-ai-menu` for configured commands and bounded local chat.
Compose EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, and EditorAiMenuPanel inside configured EditorAiRoot.
EditorAiMenuContent owns the editable surface. Do not add EditorContent beside it.
Supply an explicit same-origin host endpoint, document ID, and current authentication and CSRF headers.
Only explicit user requests start inference. Approve cleanly completed plain text explicitly.
Review comments require the current review controller and literal-true host policy.
Twelve truncated chat messages stay in memory across closes until the menu root unmounts.
Remount on document or viewer changes. No server chat storage is supplied.
Null selection retains the dialog target. Remount EditorAiRoot to discard it.
Rich Markdown approval, selected-text context overrides, and shadow-root insert-below are not supplied.

## Native editor cursor paint

Install optional `editor-cursor-overlay` for native drop carets and retained text-range paint.
Compose `EditorCursorOverlay` beside `EditorContent` inside `EditorRoot`.
Keep drag, drop, selection, and host-event handling native.
The overlay uses the root owner document and saves no document state.
Document changes and read-only transitions clear the paint.
Its store connects listeners on first subscription and removes them after final unsubscribe.
Toolbar paint is not AI authorization, proposal approval, or remote collaboration presence.

## Optional native drawing scenes

Install `editor-drawing` separately from the base editor.
Register `EditorDrawingExtension` in a stable root extensions array.
Import pure scene validation from `@/components/editor/drawing-model`.
Load `drawing-browser` and the Excalidraw stylesheet only inside a framework browser boundary.
Register one runtime per root and keep its cleanup in the host lifecycle.

Self-host the installed SDK fonts beneath an approved same-origin asset directory.
Preserve the SDK and font notices. Restrict font resources through the host CSP.
A missing local font can trigger an SDK fallback-host request without an appropriate CSP.
Concurrent runtimes must share one asset path. Owned cleanup restores the previous global asset path.

Keep scenes within 512 KiB and 2000 supported native elements.
Reject files, images, link targets, custom metadata, and unsupported element types.
Validate draft output before replacing the saved drawing node.
Validate and sanitize SVG output before download.
Generic document conversion does not support drawing nodes.

Current SDK and transitive dependency advisories remain unresolved.
Do not claim production safety from source checks.
Browser, SSR, CSP, fonts, clipboard, SVG, history, and accessibility acceptance remain deferred.
