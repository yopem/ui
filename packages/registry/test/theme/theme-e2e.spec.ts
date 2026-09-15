import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["theme.tsx", "ThemeScript"],
  contentType: "json",
  pagePath: "/docs/theming",
  path: "/r/theme.json",
  source: "theme/theme.tsx",
})
