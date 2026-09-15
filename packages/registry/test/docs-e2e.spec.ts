import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"name": "button"', '"parts"'],
  contentType: "json",
  pagePath: "/components/accordion",
  path: "/r/docs/button.json",
  source: "docs.ts",
})
