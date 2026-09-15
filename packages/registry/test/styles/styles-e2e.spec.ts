import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["@layer yopem-reset", "prefers-reduced-motion"],
  contentType: "json",
  pagePath: "/docs/installation",
  path: "/r/base.json",
  source: "styles/styles.css",
})
