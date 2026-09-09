import * as stylex from "@stylexjs/stylex"
import { createFileRoute } from "@tanstack/react-router"

import { CopyableCode } from "@/catalog/code-block"
import { DocumentationLayout } from "@/catalog/docs-layout"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "@/catalog/docs-page"
import { docsStyles } from "@/catalog/docs-styles"

export const Route = createFileRoute("/docs/theming")({
  head: () => ({
    meta: [
      { title: "Theming · Yopem UI" },
      {
        name: "description",
        content:
          "Customize Yopem StyleX tokens, CSS colors and fonts, and configure light, dark, and system themes with the theme API.",
      },
    ],
  }),
  component: Theming,
})

const rootSetup = `import "@registry/styles/styles.css"
import * as stylex from "@stylexjs/stylex"
import { getRootThemeProps } from "@registry/theme/theme-root"
import { rootStyles } from "@registry/styles/root"
import { ThemeProvider } from "@registry/theme/theme-provider"
import { ThemeScript } from "@registry/theme/theme-script"
import type { ReactNode } from "react"

const styles = stylex.create({
  root: { scrollPaddingBlockStart: "4rem" },
})

export function Document({
  children,
  nonce,
}: {
  children: ReactNode
  nonce?: string
}) {
  const root = getRootThemeProps("light")

  return (
    <html
      {...root}
      className={[stylex.props(styles.root).className, root.className].filter(Boolean).join(" ")}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript nonce={nonce} />
      </head>
      <body {...stylex.props(rootStyles.body)}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}`

const clientSetup = `import "@registry/styles/styles.css"
import { createRoot } from "react-dom/client"
import { getRootThemeProps } from "@registry/theme/theme-root"
import { ThemeProvider } from "@registry/theme/theme-provider"
import { App } from "./app"

const root = getRootThemeProps("light")
document.documentElement.classList.add(
  ...(root.className ?? "").split(" ").filter(Boolean),
)
document.documentElement.dataset.theme = "light"

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)`

const colors = `/* Import this after @registry/styles/styles.css. */
:root,
[data-theme="light"] {
  --primary: #1d4ed8;
  --primary-foreground: #fff;
  --ring: #2563eb;
}

[data-theme="dark"] {
  --primary: #93c5fd;
  --primary-foreground: #172554;
  --ring: #60a5fa;
}

:root {
  --radius: 0.75rem;
  --radius-sm: 0.5rem;
  --radius-md: 0.625rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}`

const fonts = `/* Supply this font file in your application's public/fonts directory. */
@font-face {
  font-family: "App Sans";
  src: url("/fonts/app-sans.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

:root,
[data-theme="light"],
[data-theme="dark"] {
  --font-sans: "App Sans", system-ui, sans-serif;
  --font-heading: "App Sans", system-ui, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Consolas, monospace;
}`

const tokenUsage = `import * as stylex from "@stylexjs/stylex"
import { tokens } from "@registry/styles/tokens.stylex"

const styles = stylex.create({
  panel: {
    backgroundColor: tokens.card,
    color: tokens.cardForeground,
    borderRadius: tokens.radiusLarge,
    padding: "1rem",
  },
  heading: {
    fontFamily: tokens.fontHeading,
  },
})

export function Panel() {
  return (
    <section {...stylex.props(styles.panel)}>
      <h2 {...stylex.props(styles.heading)}>Account settings</h2>
    </section>
  )
}`

const switcher = `"use client"

import { useTheme } from "@registry/theme/theme-provider"

export function ThemePicker() {
  const { theme, setTheme } = useTheme()

  return (
    <fieldset>
      <legend>Appearance</legend>
      {(["light", "dark", "system"] as const).map((value) => (
        <label key={value}>
          <input
            type="radio"
            name="theme"
            value={value}
            checked={theme === value}
            onChange={() => setTheme(value)}
          />
          {value}
        </label>
      ))}
    </fieldset>
  )
}`

function Theming() {
  return (
    <DocumentationLayout>
      <DocsPage
        toc={[
          { title: "How themes work", url: "#how-themes-work", depth: 2 },
          { title: "Set up the root", url: "#root-setup", depth: 2 },
          { title: "Customize CSS tokens", url: "#css-tokens", depth: 2 },
          { title: "Token reference", url: "#token-reference", depth: 2 },
          { title: "Custom fonts", url: "#fonts", depth: 2 },
          { title: "Use tokens in StyleX", url: "#stylex-tokens", depth: 2 },
          { title: "Choose a theme", url: "#theme-picker", depth: 2 },
          { title: "ThemeProvider", url: "#theme-provider", depth: 2 },
          { title: "ThemeScript and CSP", url: "#theme-script", depth: 2 },
          { title: "useTheme", url: "#use-theme", depth: 2 },
          { title: "getRootThemeProps", url: "#root-api", depth: 2 },
          { title: "Implementation limits", url: "#caveats", depth: 2 },
        ]}
      >
        <DocsTitle>Theming</DocsTitle>
        <DocsDescription>
          Change colors, fonts, and corner radii in CSS. Use the theme helpers
          to keep StyleX classes and the document theme in sync.
        </DocsDescription>
        <DocsBody>
          <h2 {...stylex.props(docsStyles.h2)} id="how-themes-work">
            How themes work
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Yopem components read semantic variables from{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              tokens.stylex.ts
            </code>
            . Those variables refer to CSS custom properties such as{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--background</code>
            and <code {...stylex.props(docsStyles.inlineCode)}>--primary</code>.
            The shared{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              styles/styles.css
            </code>{" "}
            defines light values on{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>:root</code> and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              [data-theme="light"]
            </code>
            , with dark overrides on{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              [data-theme="dark"]
            </code>
            .
          </p>
          <p {...stylex.props(docsStyles.p)}>
            The exported{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>lightTheme</code> and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>darkTheme</code> in
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              styles/themes.ts
            </code>{" "}
            both map StyleX tokens to those same CSS properties. The palette
            comes from CSS, not separate hard-coded palettes in the StyleX theme
            objects. Keep the shared stylesheet, including its reset and
            compatibility imports.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            The root also needs{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>themeMarker</code>{" "}
            from
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              styles/markers.stylex.ts
            </code>
            . Some components use StyleX ancestor conditions that require both
            this marker and
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              data-theme="dark"
            </code>{" "}
            on an ancestor. A dark attribute alone changes CSS variables but
            does not activate all those component styles. Use{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              getRootThemeProps
            </code>{" "}
            rather than copying generated class names.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="root-setup">
            Set up the root
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            First follow{" "}
            <a {...stylex.props(docsStyles.link)} href="/docs/installation">
              Installation
            </a>{" "}
            to copy the shared files and configure the StyleX compiler. Every
            example here resolves{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>@registry/*</code>{" "}
            directly to{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>src/yopem/*</code>
            in TypeScript, your bundler, and the StyleX transform.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            For server rendering, put the initial classes on{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>html</code>
            and render{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              ThemeScript
            </code>{" "}
            early in the head, before hydration. This document shows the theme
            wiring only. Keep your framework's head and script components, such
            as TanStack Start's{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>HeadContent</code>
            and <code {...stylex.props(docsStyles.inlineCode)}>Scripts</code>,
            in their existing positions.
          </p>
          <CopyableCode code={rootSetup} title="Document theme wiring" />
          <p {...stylex.props(docsStyles.p)}>
            Merge existing root classes with the returned{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>className</code>. Do
            not replace either set with the other. Merge body classes too if you
            apply{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              rootStyles.body
            </code>{" "}
            to an already styled body.
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              suppressHydrationWarning
            </code>{" "}
            on the root allows the intentional attribute changes made by the
            early script; it does not fix unrelated hydration errors.
          </p>
          <h3 {...stylex.props(docsStyles.h3)}>Client-only applications</h3>
          <p {...stylex.props(docsStyles.p)}>
            Run this setup in your browser entry point, not during SSR. It
            preserves existing root classes. The provider applies the saved or
            system theme after mounting, so an initial light frame is possible
            without an early theme script in your document.
          </p>
          <CopyableCode code={clientSetup} title="src/main.tsx" />

          <h2 {...stylex.props(docsStyles.h2)} id="css-tokens">
            Customize CSS tokens
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Add your overrides in a stylesheet imported after the shared CSS.
            This example uses unlayered rules, which take precedence over the
            shared{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>yopem-theme</code>{" "}
            layer. If you use layers, place your override layer after{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>yopem-theme</code>.
            Change foreground and background pairs together, then check text and
            focus contrast in both modes.
          </p>
          <CopyableCode code={colors} title="src/theme.css" />
          <p {...stylex.props(docsStyles.p)}>
            Values are complete CSS colors, not HSL channel lists. Radius tokens
            are independent lengths: changing{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--radius</code> does
            not recalculate{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--radius-sm</code>,{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--radius-md</code>,
            <code {...stylex.props(docsStyles.inlineCode)}> --radius-lg</code>,
            or <code {...stylex.props(docsStyles.inlineCode)}>--radius-xl</code>
            .
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="token-reference">
            Token reference
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            These are all semantic keys exported by{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>tokens</code>. Except
            for the radius sizes listed below, camelCase keys map to kebab-case
            CSS properties:{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              sidebarAccentForeground
            </code>{" "}
            reads
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              --sidebar-accent-foreground
            </code>
            .
          </p>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              Page:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>background</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>foreground</code>.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Containers:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>card</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                cardForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>popover</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                popoverForeground
              </code>
              .
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Emphasis:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>primary</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                primaryForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>secondary</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                secondaryForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>accent</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                accentForeground
              </code>
              .
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Muted content:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>muted</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                mutedForeground
              </code>
              .
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Controls:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>border</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>input</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>ring</code>.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Status:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>destructive</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                destructiveForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>info</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                infoForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>success</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                successForeground
              </code>
              , <code {...stylex.props(docsStyles.inlineCode)}>warning</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                warningForeground
              </code>
              .
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Code: <code {...stylex.props(docsStyles.inlineCode)}>code</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                codeForeground
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                codeHighlight
              </code>
              .
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Sidebar:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>sidebar</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarForeground
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarAccent
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarAccentForeground
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarBorder
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarPrimary
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>
                sidebarPrimaryForeground
              </code>
              ,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>sidebarRing</code>.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Fonts:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>fontSans</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>fontHeading</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>fontMono</code>.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Radii:{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>radius</code> →{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>--radius</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>radiusSmall</code>{" "}
              →{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>--radius-sm</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>radiusMedium</code>{" "}
              →{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>--radius-md</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>radiusLarge</code>{" "}
              →{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>--radius-lg</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>radiusXLarge</code>{" "}
              →{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>--radius-xl</code>.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Default radii are{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>0.625rem</code> for
            base and large,
            <code {...stylex.props(docsStyles.inlineCode)}> 0.375rem</code> for
            small, <code {...stylex.props(docsStyles.inlineCode)}>0.5rem</code>{" "}
            for medium, and
            <code {...stylex.props(docsStyles.inlineCode)}> 0.875rem</code> for
            extra large. The shared CSS also defines button shadow properties
            used directly by components; those are not exported keys of{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>tokens</code>.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="fonts">
            Custom fonts
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            The shared stylesheet imports{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              @fontsource-variable/inter
            </code>
            . Both{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--font-sans</code>{" "}
            and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>--font-heading</code>{" "}
            default to
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              "Inter Variable", "Inter", sans-serif
            </code>
            . The mono token uses a system monospace stack. Load your font, then
            override these properties in your own stylesheet. This example
            expects a variable font supporting weights 100 through 900; use the
            actual weight range of your font file.
          </p>
          <CopyableCode code={fonts} title="src/fonts.css, after shared CSS" />
          <p {...stylex.props(docsStyles.p)}>
            Setting a font token does not download a font. Overriding Inter does
            not remove its existing import either. Since you own the copied
            source, you can remove that import and its dependency if you no
            longer use it. The root styles use{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>fontSans</code>;
            headings only use
            <code {...stylex.props(docsStyles.inlineCode)}>
              fontHeading
            </code>{" "}
            where a component or your own styles selects it.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="stylex-tokens">
            Use tokens in StyleX
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import the canonical token object when writing your own components.
            Prefer semantic keys over copied palette values so your CSS
            overrides reach these components too.
          </p>
          <CopyableCode code={tokenUsage} title="src/panel.tsx" />

          <h2 {...stylex.props(docsStyles.h2)} id="theme-picker">
            Choose a theme
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Render this picker inside{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>ThemeProvider</code>.
            Light and dark select a fixed mode. System follows the browser's
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              prefers-color-scheme
            </code>{" "}
            preference, including later changes. The selected preference and the
            resolved color mode are separate values.
          </p>
          <CopyableCode code={switcher} title="src/theme-picker.tsx" />

          <h2 {...stylex.props(docsStyles.h2)} id="theme-provider">
            ThemeProvider
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import from{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              @registry/theme/theme-provider
            </code>
            . The provider accepts only{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>children</code> and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>defaultTheme</code>;
            it renders a context provider, not a DOM wrapper. Its exported props
            type is{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              ThemeProviderProps
            </code>
            .
          </p>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              <code {...stylex.props(docsStyles.inlineCode)}>
                children: React.ReactNode
              </code>{" "}
              is required.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              <code {...stylex.props(docsStyles.inlineCode)}>
                defaultTheme?: "light" | "dark" | "system"
              </code>{" "}
              defaults to{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>"system"</code>.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            At initialization, a valid saved preference in localStorage takes
            precedence over{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>defaultTheme</code>.
            Missing or invalid saved values fall back to that prop. The prop
            initializes state; changing it later does not control the current
            theme. Use{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>setTheme</code>{" "}
            instead.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            On resolved-theme changes, the provider replaces the known light and
            dark classes on{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              document.documentElement
            </code>
            , adds the marker, and sets{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>data-theme</code>.
            The selected StyleX classes also set{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>color-scheme</code>{" "}
            to light or dark. It preserves unrelated classes. The storage key is
            fixed at{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>yopem-ui-theme</code>
            . There is no storage-key prop, forced-theme prop, custom attribute
            prop, or nested theme target. Use one provider for the document.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="theme-script">
            ThemeScript and CSP
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import from{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              @registry/theme/theme-script
            </code>
            . Its only prop is{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>nonce?: string</code>
            , with no default. It returns an inline
            <code {...stylex.props(docsStyles.inlineCode)}> script</code>{" "}
            element. Supply the request's nonce when your Content Security
            Policy requires one, and authorize that same nonce in the response's{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>script-src</code>{" "}
            policy. The component does not generate a nonce or configure
            response headers.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            The script reads{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>yopem-ui-theme</code>
            , falls back to
            <code {...stylex.props(docsStyles.inlineCode)}> "system"</code> for
            a missing or empty value, and resolves system with{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              matchMedia("(prefers-color-scheme: dark)")
            </code>
            . It updates the root classes, marker,{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>data-theme</code>,
            and the StyleX classes for
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              color-scheme
            </code>{" "}
            before React mounts. It neither writes the preference nor subscribes
            to changes; the provider handles later changes.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            There is no{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>defaultTheme</code>{" "}
            prop on the script. A provider using a non-system default can
            therefore disagree with the script on a first visit with no stored
            preference. Keep the default system behavior for both, or adapt your
            copied script to match your chosen initial policy. Storage or
            browser API failures are caught silently by the script, leaving the
            existing document theme in place.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="use-theme">
            useTheme
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import from{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              @registry/theme/theme-provider
            </code>{" "}
            and call with no arguments inside a provider. It returns these three
            members:
          </p>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              <code {...stylex.props(docsStyles.inlineCode)}>
                theme: "light" | "dark" | "system"
              </code>{" "}
              is the selected preference.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              <code {...stylex.props(docsStyles.inlineCode)}>
                resolvedTheme: "light" | "dark"
              </code>{" "}
              is the color mode after resolving system preference.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              <code {...stylex.props(docsStyles.inlineCode)}>
                setTheme(theme): void
              </code>{" "}
              accepts{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>"light"</code>,{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>"dark"</code>, or{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>"system"</code>,
              writes localStorage, then updates provider state. It does not
              accept a state updater function.
            </li>
          </ul>
          <p {...stylex.props(docsStyles.p)}>
            Calling outside the provider throws
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              "useTheme must be used within ThemeProvider"
            </code>
            . The system snapshot during SSR is{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>"light"</code>; it is
            not a server-side detection of the visitor's preference. If
            server-rendered labels depend on a saved preference, defer those
            labels until mounted to avoid a mismatch with the browser's initial
            state.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="root-api">
            getRootThemeProps
          </h2>
          <p {...stylex.props(docsStyles.p)}>
            Import from{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              @registry/theme/theme-root
            </code>
            . The signature is
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              getRootThemeProps(theme?: "light" | "dark")
            </code>
            , defaulting to{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>"light"</code>. It
            returns the result of
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              stylex.props(themeMarker, selectedTheme, rootStyles.html)
            </code>
            for spreading onto your root element. It does not accept
            <code {...stylex.props(docsStyles.inlineCode)}> "system"</code>,
            read storage, set{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>data-theme</code>, or
            merge your existing props.
          </p>
          <p {...stylex.props(docsStyles.p)}>
            Set <code {...stylex.props(docsStyles.inlineCode)}>data-theme</code>{" "}
            explicitly alongside its return value. The included root styles set
            the background, foreground and sans font. The selected theme classes
            set color-scheme through StyleX, including for a static dark
            document without the script or provider.
          </p>
          <CopyableCode
            title="Static dark document, without ThemeScript or ThemeProvider"
            code={`import * as stylex from "@stylexjs/stylex"
import { rootStyles } from "@registry/styles/root"
import { getRootThemeProps } from "@registry/theme/theme-root"
import type { ReactNode } from "react"

export function Document({ children }: { children: ReactNode }) {
  return (
    <html
      {...getRootThemeProps("dark")}
      data-theme="dark"
      lang="en"
    >
      <body {...stylex.props(rootStyles.body)}>{children}</body>
    </html>
  )
}`}
          />
          <p {...stylex.props(docsStyles.p)}>
            The same module exports{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>themeClasses</code>{" "}
            with
            <code {...stylex.props(docsStyles.inlineCode)}> light</code>,{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>dark</code>, and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>marker</code> arrays
            of class names, and{" "}
            <code {...stylex.props(docsStyles.inlineCode)}>
              themeClassNames
            </code>{" "}
            with the corresponding strings. These describe the compiled themes,
            color schemes and marker, not
            <code {...stylex.props(docsStyles.inlineCode)}>
              {" "}
              rootStyles.html
            </code>
            . Use them for manual class management if needed; do not hard-code
            their generated values.
          </p>

          <h2 {...stylex.props(docsStyles.h2)} id="caveats">
            Implementation limits
          </h2>
          <ul {...stylex.props(docsStyles.ul)}>
            <li {...stylex.props(docsStyles.li)}>
              Provider storage reads and writes are not wrapped in a try/catch.
              Restricted localStorage can throw, unlike the early script. Adapt
              the copied provider if your application must tolerate blocked
              storage.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              There is no storage event listener to synchronize already-open
              tabs. The provider subscribes to system color-scheme changes, not
              external edits to localStorage.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              The script does not validate nonempty stored values as strictly as
              the provider. An invalid value selects light classes but is copied
              into the root attribute. Store only the three supported values
              through{" "}
              <code {...stylex.props(docsStyles.inlineCode)}>setTheme</code>.
            </li>
            <li {...stylex.props(docsStyles.li)}>
              Scoped CSS overrides can inherit into children, but a nested
              provider still changes the document root. Portalled content
              outside your scoped element does not inherit its variables. These
              helpers do not provide an isolated subtree theme API.
            </li>
          </ul>
        </DocsBody>
      </DocsPage>
    </DocumentationLayout>
  )
}
