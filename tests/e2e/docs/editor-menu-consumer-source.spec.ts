import { expect, test } from "@playwright/test"

const blockMenu = {
  name: "EditorBlockMenu",
  requiredImports: [
    'from "@/components/editor"',
    'from "@/components/editor/block-menu-index"',
    'from "@/components/ui/stack"',
  ],
  requiredIdentifiers: [
    "createEditorBlockMenu",
    "EditorBlockMenu",
    "EditorContent",
    "EditorHistoryButton",
  ],
  forbiddenImports: [
    "@/catalog/",
    "@registry/",
    "@workspace/",
    "@yopem-ui/",
    "@/components/editor/ai-",
    "@/components/editor/document",
    "@/components/editor/review",
    "@/components/editor/diagram",
  ],
}

const aiMenu = {
  requiredImports: [
    'from "@/components/editor"',
    'from "@/components/editor/ai-client"',
    'from "@/components/editor/ai-menu"',
    'from "@/components/editor/ai-menu-preview"',
    'from "@/components/ui/form"',
  ],
  requiredIdentifiers: [
    "validateEditorAiConfig",
    "EditorAiRoot",
    "EditorAiMenuRoot",
    "EditorAiMenuTrigger",
    "EditorAiMenuContent",
    "EditorAiMenuPanel",
    "EditorAiInlinePreview",
  ],
  forbiddenImports: [
    "@/catalog/",
    "@registry/",
    "@workspace/",
    "@yopem-ui/",
    "@/components/editor/document",
  ],
}

const aiMenuParts = [
  { slug: "ai-menu-root", name: "EditorAiMenuRoot" },
  { slug: "ai-menu-trigger", name: "EditorAiMenuTrigger" },
  { slug: "ai-menu-content", name: "EditorAiMenuContent" },
  { slug: "ai-menu-panel", name: "EditorAiMenuPanel" },
  { slug: "ai-inline-preview", name: "EditorAiInlinePreview" },
]

const sourceContracts = [
  {
    ...blockMenu,
    route: "/editor/block-menu",
    copyName: "Copy EditorBlockMenu usage",
    artifact: "block-menu-part-consumer-source.tsx",
  },
  ...aiMenuParts.map((part) => ({
    ...aiMenu,
    name: part.name,
    route: `/editor/${part.slug}`,
    copyName: `Copy ${part.name} usage`,
    artifact: `${part.slug}-part-consumer-source.tsx`,
  })),
  {
    ...blockMenu,
    route: "/components/editor-block-menu",
    copyName: /Copy .* source$/u,
    artifact: "block-menu-component-consumer-source.tsx",
  },
  {
    ...aiMenu,
    name: "EditorAiMenu",
    route: "/components/editor-ai-menu",
    copyName: /Copy .* source$/u,
    artifact: "ai-menu-component-consumer-source.tsx",
  },
]

for (const contract of sourceContracts) {
  test(`${contract.name} copies its complete consumer composition`, async ({
    page,
    context,
  }, testInfo) => {
    await page.goto(contract.route)
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: new URL(page.url()).origin,
    })

    const copy = page.getByRole("button", {
      name: contract.copyName,
      exact: true,
    })

    await expect(copy).toBeEnabled()

    const code = page.getByTestId("copyable-code").filter({ has: copy })

    const expand = code.getByRole("button", {
      name: "View code",
      exact: true,
    })

    if (await expand.count()) await expand.click()

    const displayed = (await code.locator("code").innerText()).trimEnd()
    const sentinel = "Clipboard sentinel"

    await page.evaluate(
      (value) => navigator.clipboard.writeText(value),
      sentinel,
    )
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(sentinel)
    await copy.click()
    await expect
      .poll(async () =>
        (await page.evaluate(() => navigator.clipboard.readText())).trimEnd(),
      )
      .toBe(displayed)

    const copied = (
      await page.evaluate(() => navigator.clipboard.readText())
    ).trimEnd()

    expect(copied).toContain('"use client"')

    for (const importPath of contract.requiredImports)
      expect(copied).toContain(importPath)

    for (const identifier of contract.requiredIdentifiers)
      expect(copied).toContain(identifier)

    for (const importPath of contract.forbiddenImports)
      expect(copied).not.toContain(importPath)

    await testInfo.attach(contract.artifact, {
      body: copied,
      contentType: "text/plain",
    })
  })
}
