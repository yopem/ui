import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ['"description"', '"usage"'],
  contentType: "json",
  pagePath: "/components/accordion",
  path: "/r/docs.json",
  source: "docs-notes.ts",
})
