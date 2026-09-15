import { defineRegistryArtifactE2E } from "@registry/../test/registry-e2e-contract"

defineRegistryArtifactE2E({
  contains: ["@/lib/stylex", "@/styles/tokens.stylex"],
  contentType: "json",
  pagePath: "/components/button",
  path: "/r/button.json",
  source: "source-files.ts",
})
