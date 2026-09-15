import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"button"', '"input"'],
  contentType: "json",
  pagePath: "/components/input",
  path: "/r/registry.json",
  source: "items/display-form.ts",
})
