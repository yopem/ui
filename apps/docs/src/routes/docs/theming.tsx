import * as stylex from "@stylexjs/stylex"
import { Link, createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"
import { getDocumentation } from "@/catalog/docs.functions"

export const Route = createFileRoute("/docs/theming")({
  loader: () => getDocumentation({ data: "theme" }),
  head: () => ({
    meta: [
      { title: "Theming · Yopem UI" },
      {
        name: "description",
        content:
          "Customize native StyleX tokens, scoped themes, component xstyle overrides, and optional light/dark mode switching.",
      },
    ],
  }),
  component: Theming,
})

const palette = `// Append to src/styles/tokens.stylex.ts.
// Reuse its existing stylex import, tokens, lightValues, and darkValues.
export const brandLight = stylex.createTheme(tokens, {
  ...lightValues,
  "--primary": "#1d4ed8",
  "--primary-foreground": "#ffffff",
  "--ring": "#2563eb",
  "--font-heading": '"App Sans", system-ui, sans-serif',
  "--radius-lg": "0.75rem",
})

export const brandDark = stylex.createTheme(tokens, {
  ...darkValues,
  "--primary": "#93c5fd",
  "--primary-foreground": "#172554",
  "--ring": "#60a5fa",
  "--font-heading": '"App Sans", system-ui, sans-serif',
  "--radius-lg": "0.75rem",
})`

const scope = `import * as stylex from "@stylexjs/stylex"
import { brandDark, tokens, rootStyles, themeMarker } from "@/styles/tokens.stylex"
import { Button } from "@/components/ui/button"

const styles = stylex.create({
  dark: { colorScheme: "dark" },
  panel: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    padding: "1.5rem",
  },
})

export function Preview() {
  return (
    <section {...stylex.props(themeMarker, brandDark, styles.panel, styles.dark)} data-theme="dark">
      <Button>Uses this section's tokens</Button>
    </section>
  )
}

export function Document({ children }: { children: React.ReactNode }) {
  return (
    <html {...stylex.props(themeMarker, brandDark, rootStyles.html, styles.dark)} data-theme="dark" lang="en">
      <body {...stylex.props(rootStyles.body)}>{children}</body>
    </html>
  )
}`

const extension = `import * as stylex from "@stylexjs/stylex"

// src/app-tokens.stylex.ts: define a separate variable group.
export const appTokens = stylex.defineVars({
  contentWidth: "72rem",
  space: "1rem",
  highlight: "#fef08a",
})

export const compact = stylex.createTheme(appTokens, {
  contentWidth: "56rem",
  space: "0.5rem",
  highlight: "#fde047",
})`

const usage = `import * as stylex from "@stylexjs/stylex"
import { tokens } from "@/styles/tokens.stylex"
import { appTokens, compact } from "./app-tokens.stylex"

const styles = stylex.create({
  panel: {
    maxInlineSize: appTokens.contentWidth,
    padding: appTokens.space,
    backgroundColor: tokens["--card"],
    color: tokens["--card-foreground"],
    borderRadius: tokens["--radius-lg"],
  },
  heading: { fontFamily: tokens["--font-heading"] },
})

export function Panel() {
  return (
    <section {...stylex.props(compact, styles.panel)}>
      <h2 {...stylex.props(styles.heading)}>Account settings</h2>
    </section>
  )
}`

const overrides = `import * as stylex from "@stylexjs/stylex"
import { Button } from "@/components/ui/button"
import { tokens } from "@/styles/tokens.stylex"

const styles = stylex.create({
  pill: { borderRadius: "999px" },
  quiet: {
    backgroundColor: { default: tokens["--muted"], ":hover": tokens["--accent"] },
    color: tokens["--muted-foreground"],
  },
  width: (width: number) => ({ inlineSize: width }),
})

export function Action({ quiet = false, width = 180 }: { quiet?: boolean; width?: number }) {
  return (
    <Button variant="outline" xstyle={[styles.pill, quiet && styles.quiet, styles.width(width)]}>
      Save changes
    </Button>
  )
}`

const rootSetup = `import "@/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { brandLight, brandDark, rootStyles } from "@/styles/tokens.stylex"
import { createThemeConfig, getRootThemeProps, ThemeScript } from "@/theme/theme"
import { ThemeProvider } from "@/theme/theme-provider"

// Keep this in your existing root layout; no extra config file needed.
const appThemes = createThemeConfig({ light: brandLight, dark: brandDark })

export function Document({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <html {...getRootThemeProps("light", appThemes)} data-theme="light" lang="en" suppressHydrationWarning>
      <head><ThemeScript themes={appThemes} nonce={nonce} /></head>
      <body {...stylex.props(rootStyles.body)}>
        <ThemeProvider themes={appThemes}>{children}</ThemeProvider>
      </body>
    </html>
  )
}`

const switcher = `"use client"

import { useTheme } from "@/theme/theme-provider"

export function ThemePicker() {
  const { theme, setTheme } = useTheme()
  return (
    <fieldset>
      <legend>Appearance</legend>
      {(["light", "dark", "system"] as const).map((value) => (
        <label key={value}>
          <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />
          {value}
        </label>
      ))}
    </fieldset>
  )
}`

function Theming() {
  const data = Route.useLoaderData()
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "Native tokens", url: "#tokens", depth: 2 },
          { title: "Create a theme", url: "#create-theme", depth: 2 },
          { title: "Global and scoped themes", url: "#scope", depth: 2 },
          { title: "App tokens", url: "#app-tokens", depth: 2 },
          { title: "Component overrides", url: "#xstyle", depth: 2 },
          { title: "Optional mode switching", url: "#runtime", depth: 2 },
          { title: "Runtime API and CSP", url: "#runtime-api", depth: 2 },
          { title: "CSS exceptions", url: "#css", depth: 2 },
        ]}
      >
        <DocsTitle>Theming</DocsTitle>
        <DocsDescription>
          Define palettes in StyleX. Apply themes to the document or a subtree,
          and use xstyle for component overrides. Mode switching is optional.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="tokens">
            Native tokens
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Follow{" "}
            <Link {...stylex.props(docsStyles.link)} to="/docs/installation">
              Installation
            </Link>{" "}
            first. All examples use the standard @ alias. Keep variable
            definitions in .stylex.ts files and compile app styles with the same
            StyleX transform.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            styles/tokens.stylex.ts exports tokens from stylex.defineVars,
            lightValues and darkValues, lightTheme and darkTheme, themeMarker,
            and rootStyles. Values are native StyleX definitions, not references
            to a separate CSS palette. Keys such as tokens["--primary"] preserve
            literal CSS variable names for existing var(--primary) consumers.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Semantic tokens cover background/foreground, card, popover, primary,
            secondary, accent, muted, destructive, info, success, warning,
            border, input, ring, code, sidebar, fonts, and radii. Read the
            copyable token source in Installation for every key and default.
            Change paired foreground/background colors together and check
            contrast in both modes.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="create-theme">
            Create a theme
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Use stylex.createTheme with the existing variable group. Append
            these definitions to the copied tokens.stylex.ts file. StyleX 0.19
            does not expand imported object spreads across modules, so keep
            lightValues and darkValues spreads in that same file. Import the
            resulting brandLight and brandDark themes elsewhere. Copy the
            complete mode values before overriding selected keys. A partial
            theme resets omitted keys to defineVars defaults, not the preceding
            theme. Combining darkTheme with a partial theme for the same group
            does not extend the dark palette.
          </p>
          <CopyableCode
            code={palette}
            title="src/styles/tokens.stylex.ts, append"
          />
          <p {...stylex.props(docsStyles.p)}>
            Colors are complete CSS color values. Radius keys are independent
            lengths: --radius does not recalculate --radius-sm, --radius-md,
            --radius-lg, or --radius-xl. Font tokens choose a font family but do
            not download fonts. Load App Sans separately or use an installed
            font; change --font-sans and --font-mono too when needed. The
            heading token only affects styles that read it.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="scope">
            Global and scoped themes
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Apply a theme with stylex.props on html for the whole app, or on a
            container for its descendants. Include themeMarker and matching
            data-theme for component ancestor conditions. Set colorScheme for
            native controls. The examples below are static and need neither
            provider nor script.
          </p>
          <CopyableCode
            code={scope}
            title="src/preview.tsx, scoped and document examples"
          />
          <p {...stylex.props(docsStyles.p)}>
            Tokens inherit; ordinary component styles do not. A themed parent
            changes token values read by children, but its padding, border
            radius, or background declaration does not override a child's own
            declarations. Use xstyle on the child for those changes. Applying a
            theme alone also does not paint a container; select backgroundColor
            and color yourself.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Portals inherit from their DOM destination, not their React parent.
            A dialog, menu, tooltip, or toast mounted outside the scoped
            container will use that destination's tokens. Put the theme on a
            shared DOM ancestor, use the component's supported portal container
            API, or apply the theme and marker at the portal destination. A
            nested ThemeProvider still targets html, not its subtree.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="app-tokens">
            App tokens
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Define a separate group for app-only values. Do not spread or mutate
            the compiled Yopem tokens object to add keys. Independent groups can
            have themes on the same element without replacing each other.
          </p>
          <CopyableCode code={extension} title="src/app-tokens.stylex.ts" />
          <CopyableCode code={usage} title="src/panel.tsx" />
          <h2 {...stylex.props(docsStyles.h2)} id="xstyle">
            Component overrides
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Styled wrappers accept xstyle, typed by StyleXProps from
            @/lib/stylex. That module also exports StyleXStyle for your own
            style props. Pass compiled stylex.create styles, arrays, conditional
            entries, or dynamic style calls. Components compose xstyle after
            defaults and variants; later entries win for conflicting
            declarations in the same condition. A base value does not erase a
            separate :hover, focus, disabled, or media-query rule. Override the
            matching condition when needed.
          </p>
          <CopyableCode code={overrides} title="src/action.tsx" />
          <p {...stylex.props(docsStyles.p)}>
            Use stylex.props for native elements and xstyle for Yopem wrappers.
            Dynamic calls retain their generated CSS variables; do not extract
            only className from them. className remains supported for
            interoperability, but concatenating generated classes is not an
            ordered StyleX override API. Preserve accessible focus and disabled
            states.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Each slot owns its override: pass xstyle to Button, CardHeader,
            DialogPopup, or the wrapper you mean to change. Input and Textarea
            target the native control with xstyle; controlXstyle styles or
            themes their decorative wrapper. Calendar targets its root, Sidebar
            its rendered container, and Toast its toast root. Unstyled providers
            and raw upstream aliases keep their upstream API and do not gain
            xstyle. For permanent behavior changes, edit the copied source.
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="runtime">
            Optional mode switching
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Static light or dark mode needs only base. Add these two runtime
            files for saved light/dark/system preferences; shared base files are
            already covered by Installation.
          </p>
          <div {...stylex.props(docsStyles.section)}>
            {data.files.map((file) =>
              file.path.startsWith("theme/") ? (
                <details {...stylex.props(docsStyles.details)} key={file.path}>
                  <summary {...stylex.props(docsStyles.summary)}>
                    <code {...stylex.props(docsStyles.inlineCode)}>
                      {file.target}
                    </code>
                  </summary>
                  <CopyableCode code={file.content} title={file.target} />
                </details>
              ) : null,
            )}
          </div>
          <p {...stylex.props(docsStyles.p)}>
            For SSR, render ThemeScript early in head before hydration. Keep
            your framework's head and script components in place, including
            TanStack Start's HeadContent and Scripts. The global CSS stays a
            side-effect import in the root route; retain cssCodeSplit: false in
            this project's Vite build.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            For a custom palette, create one serializable config in your
            existing root layout and pass it to all three runtime helpers. Do
            not leave a separate static theme class on html while the runtime
            switches another theme. To use the supplied palette, omit appThemes
            and all themes arguments.
          </p>
          <CopyableCode
            code={rootSetup}
            title="Document theme wiring, retain framework head and scripts"
          />
          <p {...stylex.props(docsStyles.p)}>
            For client-only apps, keep Installation's initial document classes
            and wrap App with ThemeProvider in the browser entry point. Without
            an early script, the saved mode applies after mounting and a light
            frame is possible. suppressHydrationWarning only covers intentional
            root attribute changes; it does not fix unrelated mismatches.
          </p>
          <CopyableCode code={switcher} title="src/theme-picker.tsx" />
          <h2 {...stylex.props(docsStyles.h2)} id="runtime-api">
            Runtime API and CSP
          </h2>
          <h3 {...stylex.props(docsStyles.h3)}>ThemeProvider and useTheme</h3>
          <p {...stylex.props(docsStyles.p)}>
            Import both from @/theme/theme-provider. ThemeProviderProps requires
            children and accepts defaultTheme = "system", storageKey =
            "yopem-ui-theme", and themes = themeConfig. Saved valid preferences
            take precedence over the default. Use setTheme to select a mode. The
            provider renders no DOM wrapper and updates
            document.documentElement, preserving unrelated classes. Use one
            provider per document; there is no forced-theme, custom-attribute,
            or subtree-target prop.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            useTheme() returns theme: "light" | "dark" | "system",
            resolvedTheme: "light" | "dark", and setTheme(nextTheme). The setter
            saves preference and updates state; it does not accept an updater
            function. Calling outside the provider throws "useTheme must be used
            within ThemeProvider". System mode subscribes to
            prefers-color-scheme changes. Its SSR snapshot is light, not server
            detection of the visitor's preference.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Blocked storage falls back to the configured default and does not
            prevent in-memory switching. The provider subscribes to storage
            events; an explicit local selection takes precedence over stored
            values in this mounted provider. Invalid stored preferences fall
            back to defaultTheme. SSR uses the configured default preference,
            then reads browser storage after hydration.
          </p>
          <h3 {...stylex.props(docsStyles.h3)}>ThemeScript and CSP</h3>
          <p {...stylex.props(docsStyles.p)}>
            Import from @/theme/theme. ThemeScriptProps accepts nonce?: string
            with no default, defaultTheme = "system", storageKey =
            "yopem-ui-theme", and themes = themeConfig. Keep defaultTheme,
            storageKey, and themes identical to the provider. The inline script
            validates saved preferences, resolves system with matchMedia, and
            applies root classes and data-theme before React mounts. It neither
            saves preference nor subscribes to changes. Blocked storage uses
            defaultTheme.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Supply a per-response nonce authorized by your CSP script-src
            header. The component neither creates nonces nor configures headers.
            It escapes serialized configuration to prevent a storage key from
            closing the script element. StyleX static CSS still needs your
            stylesheet policy; dynamic StyleX values generate runtime style
            variables, so check them against your style-src policy separately.
          </p>
          <h3 {...stylex.props(docsStyles.h3)}>
            createThemeConfig and getRootThemeProps
          </h3>
          <p {...stylex.props(docsStyles.p)}>
            Import from @/theme/theme. createThemeConfig(
            {"{ light, dark }"}) accepts two StyleX themes for the Yopem token
            group. It composes the marker, rootStyles.html, palette, and
            colorScheme through stylex.props. Its serializable ThemeConfig
            result contains light and dark root props and classes with light,
            dark, and marker arrays. Create it outside render and share it
            across server and client, including Next.js Server Component
            boundaries.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            getRootThemeProps(theme = "light", themes = themeConfig) returns
            that mode's compiled root props. Theme must be "light" or "dark",
            never "system". It does not read storage, set data-theme, or merge
            existing props. Set data-theme explicitly and preserve unrelated
            root classes. For additional root StyleX declarations, compose the
            marker, selected palette, rootStyles.html, colorScheme, and your
            styles with stylex.props as in the static example, rather than
            concatenating conflicting generated classes.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            themeConfig is the built-in config. themeClasses exposes its light,
            dark, and marker arrays; themeClassNames exposes corresponding
            strings. Mode entries include root styles, palette, marker, and
            color scheme. Never hard-code their generated values. The module
            also exports Theme, ResolvedTheme, ThemeConfig, ThemeScriptProps,
            STORAGE_KEY = "yopem-ui-theme", and MEDIA_QUERY =
            "(prefers-color-scheme: dark)".
          </p>
          <h2 {...stylex.props(docsStyles.h2)} id="css">
            CSS exceptions
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Keep styles/styles.css for reset, reduced motion, and three Base UI
            viewport rules targeting upstream-generated containers. No separate
            compatibility stylesheets or palette CSS are required. Style icons
            and other caller-owned children explicitly with StyleX or the
            component's exported slot styles. Font packages are optional; import
            your chosen font in the app entry, or use the fallback font stack.
            Colors, font stacks, radii, layout, and overrides belong in StyleX.
          </p>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
