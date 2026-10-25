import { editorItem } from "@registry/items/editor"
import { editorFloatingToolbarItem } from "@registry/items/editor-floating-toolbar"
import { rewriteImports } from "@registry/source-files"
import { expect, test } from "bun:test"
import { z } from "zod"

test("floating toolbar publishes its optional module and reuses base selection controls", async () => {
  expect(editorFloatingToolbarItem.files.map((file) => file.target)).toContain(
    "@/components/editor/floating-toolbar.tsx",
  )
  expect(editorFloatingToolbarItem.registryDependencies).toEqual(
    expect.arrayContaining(["editor", "popover", "toolbar"]),
  )

  for (const helper of ["root.tsx", "controls.tsx", "selection-bookmark.ts"]) {
    expect(
      editorItem.files.some(
        (file) => file.path === `components/editor/${helper}`,
      ),
    ).toBe(true)
  }

  const item = z
    .looseObject({
      name: z.string(),
      files: z.array(z.looseObject({ target: z.string() })),
    })
    .parse(
      await Bun.file(
        new URL(
          "../../packages/registry/dist/r/editor-floating-toolbar.json",
          import.meta.url,
        ),
      ).json(),
    )

  expect(item.name).toBe("editor-floating-toolbar")
  expect(item.files).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target: "@/components/editor/floating-toolbar.tsx",
      }),
    ]),
  )
})

test("floating toolbar consumer imports keep the optional subpath", () => {
  expect(
    rewriteImports(
      'import { EditorFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"',
    ),
  ).toBe(
    'import { EditorFloatingToolbar } from "@/components/editor/floating-toolbar"',
  )
})
