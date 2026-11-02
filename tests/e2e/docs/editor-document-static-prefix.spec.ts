import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"
import { execFile } from "node:child_process"
import { readFile } from "node:fs/promises"
import { promisify } from "node:util"

const execute = promisify(execFile)

test("static document prefixes survive SSR, hydration, and native navigation @a11y", async ({
  page,
}, info) => {
  const { stdout } = await execute(
    "bun",
    [
      "run",
      "--preload",
      "./tests/stylex-preload.ts",
      "--tsconfig-override",
      "./tests/tsconfig.json",
      "./tests/fixtures/static-prefix-ssr.tsx",
    ],
    { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "production" } },
  )

  const bundlePath = info.outputPath("static-prefix-bundle.js")
  await execute(
    "bun",
    ["run", "./tests/fixtures/static-prefix-bundle.ts", bundlePath],
    { cwd: process.cwd() },
  )
  const bundle = await readFile(bundlePath, "utf8")
  await info.attach("static-prefix-ssr.html", {
    body: stdout,
    contentType: "text/html",
  })
  await page.route("**/static-prefix-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="en"><head><title>Static prefix fixture</title></head><body>${stdout}</body></html>`,
    }),
  )
  await page.route("**/static-prefix-bundle.js", (route) =>
    route.fulfill({ contentType: "text/javascript", body: bundle }),
  )
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto("/static-prefix-fixture")

  const snapshot = () =>
    page.locator("#fixture").evaluate((root) => {
      const copy = root.cloneNode(true)

      if (!(copy instanceof Element)) throw new Error("Missing fixture clone")
      copy.removeAttribute("data-hydrated")

      return copy.outerHTML
    })

  const before = await snapshot()
  await page.addScriptTag({ url: "/static-prefix-bundle.js" })
  await expect(page.locator("#fixture")).toHaveAttribute(
    "data-hydrated",
    "true",
  )
  const after = await snapshot()
  await info.attach("static-prefix-before.html", {
    body: before,
    contentType: "text/html",
  })
  await info.attach("static-prefix-after.html", {
    body: after,
    contentType: "text/html",
  })
  expect(after).toBe(before)
  expect(
    await page.locator("html").getAttribute("data-hydration-error"),
  ).toBeNull()
  expect(errors).toEqual([])

  const documents = page.getByRole("region", {
    name: /^(First|Second) document$/,
  })

  await expect(documents).toHaveCount(2)

  const relationships = await documents.evaluateAll((sections) => {
    const allIds = Array.from(
      document.querySelectorAll("[id]"),
      (node) => node.id,
    )

    return {
      unique: new Set(allIds).size === allIds.length,
      sections: sections.map((section) => {
        const attributes = [
          "aria-activedescendant",
          "aria-controls",
          "aria-describedby",
          "aria-details",
          "aria-errormessage",
          "aria-flowto",
          "aria-labelledby",
          "aria-owns",
          "headers",
          "for",
        ]

        const links = Array.from(section.querySelectorAll('[href^="#"]'))

        const references = Array.from(
          section.querySelectorAll(
            attributes.map((name) => `[${name}]`).join(","),
          ),
        ).flatMap((node) =>
          attributes.flatMap((name) =>
            (node.getAttribute(name) ?? "").split(/\s+/).filter(Boolean),
          ),
        )

        return {
          linkCount: links.length,
          valid: [
            ...links.map((link) => link.getAttribute("href")?.slice(1) ?? ""),
            ...references,
          ].every((id) => {
            const target = document.getElementById(id)

            return target !== null && section.contains(target)
          }),
          footnotes: Array.from(
            section.querySelectorAll("[data-editor-footnote-reference]"),
            (reference) => ({
              id: reference.id,
              href: reference.querySelector("a")?.getAttribute("href") ?? null,
            }),
          ),
          definitions: Array.from(
            section.querySelectorAll("[data-editor-footnote-definition]"),
            (definition) => ({
              id: definition.id,
              backlinks: Array.from(
                definition.querySelectorAll("[data-editor-footnote-backlink]"),
                (link) => [link.getAttribute("href"), link.textContent],
              ),
            }),
          ),
          names: Array.from(
            section.querySelectorAll("nav[data-editor-toc]"),
            (nav) => nav.getAttribute("aria-label"),
          ),
          mathCount: section.querySelectorAll("[data-editor-math] math").length,
        }
      }),
    }
  })

  expect(relationships.unique).toBe(true)
  expect(relationships.sections).toHaveLength(2)

  for (const [index, prefix] of ["first", "second"].entries()) {
    const section = relationships.sections[index]
    expect(section).toBeDefined()

    if (!section) throw new Error("Missing static document")
    expect(section.linkCount).toBeGreaterThan(3)
    expect(section.valid).toBe(true)
    expect(section.footnotes).toEqual([
      {
        id: `${prefix}--yopem-footnote-reference-note-1`,
        href: `#${prefix}--yopem-footnote-definition-note-1`,
      },
      {
        id: `${prefix}--yopem-footnote-reference-note-2`,
        href: `#${prefix}--yopem-footnote-definition-note-1`,
      },
      { id: `${prefix}--yopem-footnote-reference-missing-3`, href: null },
    ])

    const backlinks = [
      [`#${prefix}--yopem-footnote-reference-note-1`, "↩ 1"],
      [`#${prefix}--yopem-footnote-reference-note-2`, "↩ 2"],
    ]

    expect(section.definitions).toEqual([
      { id: `${prefix}--yopem-footnote-definition-note-1`, backlinks },
      { id: `${prefix}--yopem-footnote-definition-note-2`, backlinks },
    ])

    const label = index === 0 ? "First document" : "Second document"
    expect(section.names).toEqual([
      `${label}: Table of contents 1`,
      `${label}: Table of contents 2`,
    ])
    expect(section.mathCount).toBe(1)
  }

  const second = page.getByRole("region", { name: "Second document" })

  for (const link of await second.locator('a[href^="#"]').all()) {
    const href = await link.getAttribute("href")
    await page.evaluate(() => history.replaceState(null, "", location.pathname))
    await link.focus()
    await page.keyboard.press("Enter")
    await expect.poll(() => new URL(page.url()).hash).toBe(href)
    expect(
      await page.evaluate(
        (id) => {
          const target = document.getElementById(id)

          return (
            target !== null &&
            target === document.querySelector(":target") &&
            target.closest('section[aria-label="Second document"]') !== null
          )
        },
        href?.slice(1) ?? "",
      ),
    ).toBe(true)
  }

  const report = await new AxeBuilder({ page }).analyze()
  await info.attach("static-prefix-axe.json", {
    body: JSON.stringify(report),
    contentType: "application/json",
  })
  expect(report.violations).toEqual([])
})
