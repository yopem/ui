import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"schemaVersion": 1', '"items"'],
  contentType: "json",
  pagePath: "/components/button",
  path: "/r/registry.json",
  source: "build.ts",
})
