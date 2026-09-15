import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"dialog"', '"tooltip"'],
  contentType: "json",
  pagePath: "/components/dialog",
  path: "/r/registry.json",
  source: "items/remaining.ts",
})
