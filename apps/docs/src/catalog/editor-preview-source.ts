import { rewriteImports } from "@registry/source-files"

const fixtureIdentifiers = {
  column: "editorColumnFixture",
  date: "editorDateFixture",
  footnote: "editorFootnoteFixture",
  toc: "editorTocFixture",
}

export type EditorPreviewFixture = keyof typeof fixtureIdentifiers

const previewSources = import.meta.glob<string>(
  [
    "./editor-previews/*.tsx",
    "./editor-preview-compositions/*.tsx",
    "./editor-example-compositions/{column,date,footnote,toc}.tsx",
    "./editor-example-fixtures/{column,date,footnote,toc}.ts",
  ],
  { query: "?raw", import: "default" },
)

export async function getEditorPreviewSource(
  sourcePath: string,
  family?: EditorPreviewFixture,
) {
  const load = previewSources[sourcePath]

  if (!load) throw new Error(`Missing editor preview: ${sourcePath}`)

  const source = rewriteImports(await load())

  if (!family) return source

  const identifier = fixtureIdentifiers[family]
  const fixtureImport = `import { ${identifier} } from "@/catalog/editor-example-fixtures/${family}"`

  if (!source.includes(fixtureImport)) {
    if (source.includes("@/catalog/editor-example-fixtures/"))
      throw new Error(`Missing editor fixture import: ${sourcePath}`)

    return source
  }

  const fixturePath = `./editor-example-fixtures/${family}.ts`
  const loadFixture = previewSources[fixturePath]

  if (!loadFixture) throw new Error(`Missing editor fixture: ${family}`)

  const fixture = await loadFixture()

  return source.replace(fixtureImport, fixture.replace(/^export /u, ""))
}
