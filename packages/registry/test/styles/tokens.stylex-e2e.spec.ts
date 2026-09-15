import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: [
    "styles/tokens.stylex.ts",
    "--background",
    "oklch(57.7% 0.245 27.325)",
  ],
  contentType: "json",
  pagePath: "/docs/theming",
  path: "/r/base.json",
  source: "styles/tokens.stylex.ts",
})
