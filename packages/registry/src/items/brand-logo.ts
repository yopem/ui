import type { SourceItem } from "@registry/items/types"

export const brandLogoItem: SourceItem = {
  categories: [],
  dependencies: ["@stylexjs/stylex@^0.19.0"],
  description: "Shows the Yopem UI brand mark.",
  devDependencies: [],
  files: [
    {
      path: "components/ui/brand-logo.tsx",
      target: "@/components/ui/brand-logo.tsx",
      type: "registry:ui",
    },
    {
      path: "lib/brand-logo-path.ts",
      target: "@/lib/brand-logo-path.ts",
      type: "registry:lib",
    },
  ],
  name: "brand-logo",
  peerDependencies: ["react@>=19 <20"],
  registryDependencies: [],
  title: "BrandLogo",
  type: "registry:ui",
}
