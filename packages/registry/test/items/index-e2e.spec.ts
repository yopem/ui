import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"items"', '"version"'],
  contentType: "json",
  pagePath: "/components",
  path: "/r/registry.json",
  source: "items/index.ts",
})
