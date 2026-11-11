import type { Page } from "@playwright/test"

import { expect } from "@playwright/test"

export async function openPreview(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`)
  await expect(
    page.getByRole("button", { name: /^Copy .* usage$/ }).first(),
  ).toBeEnabled()

  return response
}
