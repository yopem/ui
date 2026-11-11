import type { Page } from "@playwright/test"

import { expect } from "@playwright/test"

export async function openDocsPage(page: Page, path: string) {
  const response = await page.goto(path)
  await expect(
    page.getByRole("button", { name: "Search documentation", exact: true }),
  ).toBeEnabled()

  return response
}
