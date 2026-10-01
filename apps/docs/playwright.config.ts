import { createPlaywrightConfig } from "./test/playwright-config"

export default createPlaywrightConfig(
  process.env.PLAYWRIGHT_PORT ?? "3100",
  import.meta.dirname,
)
