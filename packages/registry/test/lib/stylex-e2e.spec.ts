import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["lib/stylex.ts", "stylexProps"],
  contentType: "json",
  pagePath: "/examples/p-button-1",
  path: "/r/base.json",
  source: "lib/stylex.ts",
})
