import type { SourceItem } from "@registry/items/types"

export const foundationItems: SourceItem[] = [
  {
    categories: ["foundation"],
    dependencies: [
      "@fontsource-variable/inter@^5.3.0",
      "@stylexjs/stylex@^0.19.0",
      "clsx@^2.1.1",
    ],
    description:
      "StyleX tokens, themes, reset, and theme runtime for Yopem UI.",
    devDependencies: [],
    docs: {
      api: [
        "ThemeProvider",
        "ThemeProviderProps",
        "ThemeScript",
        "useTheme",
        "getRootThemeProps",
        "tokens",
        "themeMarker",
        "lightTheme",
        "darkTheme",
        "rootStyles",
        "themeClasses",
        "themeClassNames",
        "stylexProps",
      ],
      usage:
        "Copy the base styles, theme runtime and StyleX helper into your project. Configure StyleX in your bundler and import the base stylesheet before using components.",
    },
    files: [
      {
        path: "styles/tokens.stylex.ts",
        target: "@styles/yopem/tokens.stylex.ts",
        type: "registry:style",
      },
      {
        path: "styles/markers.stylex.ts",
        target: "@styles/yopem/markers.stylex.ts",
        type: "registry:style",
      },
      {
        path: "styles/themes.ts",
        target: "@styles/yopem/themes.ts",
        type: "registry:style",
      },
      {
        path: "styles/root.ts",
        target: "@styles/yopem/root.ts",
        type: "registry:style",
      },
      {
        path: "styles/styles.css",
        target: "@styles/yopem/styles.css",
        type: "registry:style",
      },
      {
        path: "styles/display-form-compat.css",
        target: "@styles/yopem/display-form-compat.css",
        type: "registry:style",
      },
      {
        path: "styles/remaining-compat.css",
        target: "@styles/yopem/remaining-compat.css",
        type: "registry:style",
      },
      {
        path: "theme/theme-provider.tsx",
        target: "@components/theme-provider.tsx",
        type: "registry:lib",
      },
      {
        path: "theme/theme-root.ts",
        target: "@components/theme-root.ts",
        type: "registry:lib",
      },
      {
        path: "theme/theme-script.tsx",
        target: "@components/theme-script.tsx",
        type: "registry:lib",
      },
      {
        path: "lib/stylex.ts",
        target: "@lib/stylex.ts",
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
    categories: ["feedback"],
    dependencies: ["lucide-react@^1.33.0"],
    description: "Accessible animated loading indicator.",
    devDependencies: [],
    docs: {
      api: ["Spinner"],
      usage: "`<Spinner />`",
    },
    files: [
      {
        path: "components/ui/spinner.tsx",
        target: "@ui/spinner.tsx",
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
      "Button with variants, sizes, rendering composition, and loading state.",
    devDependencies: [],
    docs: {
      api: ["Button", "ButtonProps", "buttonVariants"],
      usage: "`<Button>Save</Button>`",
    },
    files: [
      {
        path: "components/ui/button.tsx",
        target: "@ui/button.tsx",
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
