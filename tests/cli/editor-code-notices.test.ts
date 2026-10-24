import { sourceItems } from "@registry/items/index"
import { resolveSourcePath } from "@registry/source-path"
import { expect, test } from "bun:test"
import { readFile } from "node:fs/promises"

const licensePath = "components/editor/LICENSE.md"

test("code source distribution keeps both dependency notices", async () => {
  const item = sourceItems.find((entry) => entry.name === "editor-code")
  const file = item?.files.find((entry) => entry.path === licensePath)

  expect(file?.type).toBe("registry:lib")
  expect(file?.target).toBe("@/components/editor/LICENSE.md")

  const content = await readFile(resolveSourcePath(licensePath), "utf8")

  expect(content).toContain("Copyright (c) 2012 Lea Verou")
  expect(content).toContain("Copyright © James Long and contributors")
  expect(content).toContain(
    "The above copyright notice and this permission notice",
  )
})

test("optional formatting keeps the base notice dependency", () => {
  const item = sourceItems.find((entry) => entry.name === "editor-code-format")

  expect(item?.registryDependencies).toContain("editor-code")
})
