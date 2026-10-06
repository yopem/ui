import type { SourceItem } from "@registry/items/types"

export const foundationItems: SourceItem[] = [
  {
    categories: ["foundation"],
    dependencies: ["@stylexjs/stylex@^0.19.0", "clsx@^2.1.1"],
    description:
      "Provides native StyleX tokens, themes, reset, and component styling helpers for Yopem UI.",
    devDependencies: ["@types/react@^19.2.18"],
    docs: {
      api: [
        "lightValues",
        "darkValues",
        "tokens",
        "themeMarker",
        "lightTheme",
        "darkTheme",
        "rootStyles",
        "stylexProps",
        "mergeStylexProps",
        "StyleXStyle",
        "StyleXProps",
        "StyleXComponentProps",
      ],
      usage:
        "Copy the base files. Configure StyleX. Import styles.css. Native tokens provide light defaults without a provider or script. Add the optional theme item to switch between light, dark, and system modes. In the copied tokens.stylex.ts, use stylex.createTheme(tokens, { ...lightValues, '--primary': '...' }) for custom light themes. For dark themes, use ...darkValues. Do not apply a partial theme over darkTheme. Keep these spreads in tokens.stylex.ts. StyleX 0.19 does not expand imported constant objects.",
    },
    files: [
      {
        path: "styles/tokens.stylex.ts",
        target: "@/styles/tokens.stylex.ts",
        type: "registry:style",
      },
      {
        path: "styles/styles.css",
        target: "@/styles/styles.css",
        type: "registry:style",
      },
      {
        path: "lib/stylex.ts",
        target: "@/lib/stylex.ts",
        type: "registry:lib",
      },
    ],
    name: "base",
    peerDependencies: ["react@>=18 <20", "react-dom@>=18 <20"],
    registryDependencies: [],
    title: "Yopem base",
    type: "registry:base",
  },
  {
    categories: ["foundation"],
    dependencies: [],
    description:
      "Provides optional light, dark, and system themes with a CSP-compatible initial-paint script.",
    devDependencies: [],
    docs: {
      api: [
        "createThemeConfig",
        "getRootThemeProps",
        "ThemeScript",
        "Theme",
        "ResolvedTheme",
        "STORAGE_KEY",
        "MEDIA_QUERY",
        "themeConfig",
        "ThemeConfig",
        "themeClasses",
        "themeClassNames",
        "ThemeScriptProps",
        "ThemeProvider",
        "useTheme",
        "ThemeProviderProps",
      ],
      usage:
        "Create complete light and dark themes with StyleX in tokens.stylex.ts. Export those themes. Call createThemeConfig({ light, dark }) in your existing server-safe root layout. Pass the same serializable theme configuration to getRootThemeProps('light', themes), ThemeScript, and ThemeProvider. Use matching defaultTheme and storageKey values in the script and provider. Pass your CSP nonce to ThemeScript. Suppress hydration warnings on html. The script changes its class and data-theme before hydration. theme.tsx is server-safe. Only theme-provider.tsx is a client entry.",
    },
    files: [
      {
        path: "theme/theme.tsx",
        target: "@/theme/theme.tsx",
        type: "registry:lib",
      },
      {
        path: "theme/theme-provider.tsx",
        target: "@/theme/theme-provider.tsx",
        type: "registry:lib",
      },
    ],
    name: "theme",
    peerDependencies: ["react@>=18 <20", "react-dom@>=18 <20"],
    registryDependencies: ["base", "use-event-callback"],
    title: "Theme runtime",
    type: "registry:lib",
  },
  {
    categories: ["feedback"],
    dependencies: ["lucide-react@^1.33.0"],
    description: "Shows an accessible animated loading indicator.",
    devDependencies: [],
    docs: {
      api: ["Spinner"],
      usage: "`<Spinner />`",
    },
    files: [
      {
        path: "components/ui/spinner.tsx",
        target: "@/components/ui/spinner.tsx",
        type: "registry:ui",
      },
    ],
    name: "spinner",
    peerDependencies: ["react@>=18 <20"],
    registryDependencies: ["base"],
    title: "Spinner",
    type: "registry:ui",
  },
  {
    categories: ["actions"],
    dependencies: ["@base-ui/react@^1.7.0"],
    description:
      "Provides a button with variants, sizes, render composition, and loading state.",
    devDependencies: [],
    docs: {
      api: ["buttonVariants", "Button", "ButtonProps"],
      usage: "`<Button>Save</Button>`",
    },
    files: [
      {
        path: "components/ui/button.tsx",
        target: "@/components/ui/button.tsx",
        type: "registry:ui",
      },
    ],
    name: "button",
    peerDependencies: ["react@>=18 <20"],
    registryDependencies: ["base", "spinner"],
    title: "Button",
    type: "registry:ui",
  },
]
