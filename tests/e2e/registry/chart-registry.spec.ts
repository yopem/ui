import { expect, test } from "@playwright/test"
import { registryItemSchema } from "@registry/schema"

test("chart registry item exposes consumer sources and dependencies", async ({
  request,
}) => {
  const response = await request.get("/r/chart.json")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("application/json")
  const item = registryItemSchema.parse(await response.json())
  expect(item.name).toBe("chart")
  expect(item.type).toBe("registry:ui")
  expect(
    item.dependencies.some((dependency) =>
      /^@tanstack\/charts(?:@|$)/.test(dependency),
    ),
  ).toBe(true)

  for (const dependency of [
    ...item.dependencies,
    ...item.devDependencies,
    ...item.peerDependencies,
  ])
    expect(dependency).not.toMatch(/^recharts(?:@|$)/)
  expect(item.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ target: "@/components/ui/chart.tsx" }),
    ]),
  )

  for (const file of item.files) {
    expect(file.content?.trim()).toBeTruthy()
    expect(file.content).not.toContain("@registry/")
  }
})
