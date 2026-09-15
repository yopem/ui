import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["styles/styles.css", "lib/stylex.ts"],
  contentType: "json",
  pagePath: "/docs/installation",
  path: "/r/base.json",
  source: "items/foundation.ts",
})
