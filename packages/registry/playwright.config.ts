import { createPlaywrightConfig } from "@docs-test/playwright-config"

export default createPlaywrightConfig(
  process.env.REGISTRY_PLAYWRIGHT_PORT ?? "3101",
  import.meta.dirname,
)
