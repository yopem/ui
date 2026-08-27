# Yopem UI implementation plan

## Agreed scope

- Product: Yopem UI, public MIT project.
- CLI package: `@yopem/ui`, invoked with `npx @yopem/ui`.
- Registry: `https://ui.yopem.com`.
- Distribution: source files copied into consumer projects.
- No shadcn dependency and no importable component package.
- Public v1 includes all 54 components and all 508 demos.
- Development lands in reviewed phases, starting with Button end to end.

## Current baseline

- 54 Tailwind/Base UI components, 7,703 lines.
- 508 demos, 25,097 lines.
- No StyleX components or compiler packages installed.
- Target StyleX version: `0.19.x`.

## Repository layout

```text
apps/
  docs/
    src/
      components/demos/{tailwind,stylex}/
      routes/components/
      routes/__test/
    public/{r,schema}/          # generated

packages/
  cli/                          # published as @yopem/ui
    src/commands/
    src/adapters/
    src/core/
    tests/

  registry/                     # private canonical source
    src/components/ui/
    src/hooks/
    src/lib/
    src/styles/
    src/theme/
    src/items/
    src/schema.ts
    src/build.ts
    dist/{r,schema}/

fixtures/
  vite/
  next-app/
  next-pages/
  tanstack-start/
  workspace/

.github/workflows/
  ci.yml
  release.yml
```

Root uses Bun workspaces. Existing app moves to `apps/docs`.

## Registry contract

Serve:

```text
/r/registry.json
/r/button.json
/r/0.1.0/button.json
/schema/registry.json
/schema/registry-item.json
/schema/config.json
```

Item fields:

- `schemaVersion`
- `registryVersion`
- `name`, `type`, `title`, `description`, `categories`
- `dependencies`, `devDependencies`, `peerDependencies`
- `registryDependencies`
- `files[]`
  - `path`
  - `target`
  - `type`
  - `content`
  - SHA-256 `integrity`
- structured documentation metadata

Use shadcn-style targets such as `@ui/`, `@lib/`, `@hooks/`, and `@styles/`.
Registry build rewrites internal `@registry/*` imports into placeholders. CLI
rewrites placeholders using consumer aliases.

Do not allow remote scripts or executable registry metadata.

## Consumer files

`init` installs:

```text
ui.json
ui-lock.json
src/styles/yopem/
  tokens.stylex.ts
  markers.stylex.ts
  themes.ts
  root.ts
  styles.css
src/components/
  theme-provider.tsx
src/lib/
  stylex.ts
```

`styles.css` owns:

- reset and font globals
- `@stylex` directive for Next.js
- narrowly scoped `[data-slot]` compatibility selectors
- unsupported arbitrary-descendant, autofill, and scrollbar rules

StyleX owns tokens, themes, component declarations, states, media queries, and
keyframes.

`ui-lock.json` records registry version, dependency ownership, source integrity,
target path, and installed-file hash.

## CLI

Public package: `@yopem/ui`. Binary: `yopem-ui`. Node 22 ESM.

Commands:

```text
init
add <items...> | --all
list
search [query]
diff [items...]
update [items...] | --all
remove <items...>
doctor
```

Core behavior:

- Use native `fetch`, `crypto`, `fs`, `readline/promises`, and `util.parseArgs`.
- Use Zod for trust-boundary validation.
- Use `jsonc-parser` for config edits.
- Add a unified-diff package only if native output proves inadequate.
- Detect workspace, framework, aliases, lockfile, and package manager.
- Resolve registry dependencies topologically and reject cycles.
- Plan every write before applying it.
- Write through temporary files and update lockfile last.
- Preserve changed files unless user explicitly chooses overwrite.
- `update` prompts per modified file. No automatic merge.
- `remove` prompts before cascading through dependents.
- Remove a package dependency only when lock proves Yopem added it and no
  installed item still needs it.
- Keep `doctor` read-only.
- Unknown config shapes fail with exact patch instructions.

## Framework adapters

### Vite

- Add `@stylexjs/unplugin` before React plugin.
- Import generated `styles.css`.
- Install early theme initializer and provider.
- Use `runtimeInjection: false` and CSS layers.

### TanStack Start

- Add StyleX before TanStack Start and React plugins.
- Link generated CSS through root route.
- Apply theme marker and classes on `<html>`.
- Render pre-hydration theme script.
- Verify SSR and client CSS extraction.

### Next.js App Router

- Create or safely update Babel and PostCSS configs.
- Import `styles.css` in `app/layout.tsx`.
- Apply root marker and theme classes.
- Add theme script and hydration-warning handling.

### Next.js Pages Router

- Configure Babel and PostCSS identically.
- Import styles and provider through `_app.tsx`.
- Apply root attributes and script through `_document.tsx`.

Only recognized templates get automatic edits. Everything else receives patch
output.

## Component conversion rules

For every component:

1. Preserve exports, props, Base UI behavior, aliases, `render`, portal props,
   `"use client"`, and `data-slot`.
2. Replace Tailwind strings with `stylex.create`.
3. Replace CVA with StyleX variant maps.
4. Keep callable exports such as `buttonVariants`, `badgeVariants`, and
   `toggleVariants`.
5. Infer variant unions from style-map keys.
6. Preserve `className`; shared helper combines external and generated classes.
7. Treat `className` as additive. Source editing remains reliable appearance
   customization.
8. Use theme marker plus `stylex.when.ancestor()` for dark-state differences.
9. Keep unsupported descendant behavior in scoped `styles.css`.
10. Remove `tailwind-merge` and CVA from generated consumer dependencies.
11. Fix discovered behavior or accessibility defects in both Tailwind and StyleX
    trees.

## Conversion batches

Each batch includes components, every related demo, registry metadata, docs,
interaction states, visual checks, and accessibility checks.

### Batch 1: vertical slice, 2 components

- `spinner`
- `button`

### Batch 2: display and layout, 12 components

- `alert`
- `avatar`
- `badge`
- `breadcrumb`
- `card`
- `empty`
- `frame`
- `group`
- `kbd`
- `separator`
- `skeleton`
- `table`

### Batch 3: forms and controls, 19 components

- `input`
- `textarea`
- `label`
- `field`
- `fieldset`
- `form`
- `input-group`
- `checkbox`
- `checkbox-group`
- `radio-group`
- `switch`
- `slider`
- `meter`
- `progress`
- `number-field`
- `otp-field`
- `toggle`
- `toggle-group`
- `toolbar`

### Batch 4: disclosure and navigation, 5 components

- `accordion`
- `collapsible`
- `tabs`
- `pagination`
- `scroll-area`

### Batch 5: overlays, 10 components

- `alert-dialog`
- `context-menu`
- `dialog`
- `drawer`
- `menu`
- `popover`
- `preview-card`
- `select`
- `sheet`
- `tooltip`

### Batch 6: complex components, 6 components

- `autocomplete`
- `calendar`
- `combobox`
- `command`
- `sidebar`
- `toast`

Demo codemod handles imports and proven static utility mappings only. Unknown or
relational classes stop with a report. Hand-fix exceptions. Do not build a
general Tailwind-to-StyleX compiler.

## Delivery phases

### Phase 0: monorepo move

Move current app to `apps/docs`, establish workspaces, and preserve current
Tailwind build and route behavior.

Gate:

```sh
bun run lint
bun run fmt
bun run typecheck
bun run build
```

### Phase 1: Button vertical slice

Build tokens, themes, provider, `styles.css`, registry schema/build, `spinner`,
`button`, minimal `init/add`, one live demo, and all framework fixtures.

Gate: built CLI tarball installs Button into clean projects with no Tailwind
dependency. Every fixture builds. Button screenshot matches exactly.

### Phase 2: complete CLI

Implement lockfile, lifecycle commands, conflict handling, package-manager
support, monorepo detection, adapters, and versioned registry output.

### Phases 3–7: component batches

Convert batches above. No batch completes until all corresponding demos pass.

### Phase 8: public catalog

Add:

- `/components`
- `/components/$name`
- install commands
- usage and API sections
- lazy live demos
- source viewer
- client-side catalog search

Registry metadata drives pages. Tailwind catalog remains available only through
test-gated routes.

### Phase 9: release gates

Run complete visual, interaction, fixture, type, and accessibility matrices.
Generate agent-tested WCAG report with manual screen-reader certification marked
pending.

### Phase 10: release

Add MIT license and attribution, contribution guide, tagged release workflow,
npm provenance, self-hosted deployment artifact, and immutable versioned
registry assets.

## Testing

### Visual parity

Render Tailwind and StyleX demos on isolated pages. Compare pixels directly
instead of committing screenshot baselines.

Matrix:

- desktop light
- desktop dark
- mobile light
- mobile dark
- critical open, hover, focus, selected, invalid, disabled, and loading states

Freeze animations, dates, timezone, randomness, and fonts. Any pixel difference
fails.

### Accessibility

- axe scans
- keyboard flows
- focus order and visibility
- target-size checks
- contrast checks
- 200% zoom and overflow
- forced-colors mode
- reduced-motion mode
- ARIA snapshots

Do not claim VoiceOver or NVDA certification.

### CI matrix

Avoid a full cross-product:

- Linux runs full Vite, Next App, Next Pages, and TanStack Start builds.
- Vite fixtures cover React 18 and 19.
- One fixture covers a consumer monorepo.
- npm, pnpm, Yarn, and Bun receive smoke tests.
- Linux, macOS, and Windows receive CLI smoke tests.
- Chromium visual tests run on a pinned Linux image.

## Explicitly excluded from v1

- importable component npm package
- shadcn runtime dependency
- three-way merging
- third-party registry namespaces
- Tailwind bridge in consumer output
- telemetry
- generic config rewriting
- generic Tailwind-to-StyleX compiler
- screen-reader certification

## Next implementation step

Start Phase 0, then complete the Button vertical slice before scaling conversion
work.
