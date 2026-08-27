# AGENTS.md

UI lab built with **TanStack Start** (Vite + Nitro), React 19, file-based routing via TanStack Router. Package manager is **Bun**.

## Commands

```sh
bun dev                # dev server on :3000
bun run build          # production build (vite + nitro)
bun run lint           # oxlint
bun run fmt            # oxfmt
bun run generate-routes # regenerate src/routeTree.gen.ts after adding/changing routes
```

No test framework configured. Lint/format via **oxlint/oxfmt** (configs: `.oxlintrc.json`, `.oxfmtrc.json`) — not ESLint/Prettier. Run `bun run lint && bun run fmt` before finishing work.

## Structure

- `src/routes/` — file-based routes. After adding one, run `bun run generate-routes`. Never edit `routeTree.gen.ts`.
  - `/tailwind` and `/stylex` are the two component showcase routes.
- `src/components/ui/tailwind/` — UI components styled with Tailwind (the current set).
- `src/components/demos/tailwind/` — demo files named `p-{component}-{n}.tsx` (one per usage example).
- `src/lib/utils.ts` — `cn()` helper (clsx + tailwind-merge). Reuse it; don't add another.
- Path alias: `@/*` → `src/*`.

## Component conventions

Components are built on **Base UI primitives** (`@base-ui/react`) using the shadcn/new-york layout (see `components.json`; registry `@coss`). Follow the existing files in `src/components/ui/tailwind/`:

- `"use client"` at the top.
- Variants via `class-variance-authority` (`cva`), exported as `{name}Variants` alongside the component, composed through `cn()`.
- `data-slot="{name}"` attribute on each rendered element.
- Icons: lucide-react (or remixicon where already used).
- Theme tokens are CSS variables defined in `src/styles.css` (Tailwind v4 CSS-first config — there is no `tailwind.config.*`). Use semantic tokens (`bg-primary`, `text-muted-foreground`…), not raw colors.

## Styling direction: Tailwind → StyleX

Current state: all components are styled with Tailwind classes. A StyleX UI library is planned; `/stylex` route exists as its landing spot.

When asked to convert a component:

- Keep the same API, variants, and behavior; only replace styling.
- Mirror the directory split: converted components go under `src/components/ui/stylex/`, demos under `src/components/demos/stylex/` (matching the existing `tailwind/` trees).
- Convert cva variant class strings into `stylex.create` variant objects; keep exported variant names identical so demos swap by changing imports only.
- Don't delete the Tailwind version during conversion — both trees coexist until the StyleX side is complete.
