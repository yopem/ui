import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"files"', '"target"'],
  contentType: "json",
  pagePath: "/components/button",
  path: "/r/button.json",
  source: "items/types.ts",
})
