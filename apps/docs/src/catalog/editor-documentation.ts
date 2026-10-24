import { rewriteImports } from "@registry/source-files"

import { getDocumentation } from "./docs.functions"
import { getEditorPart } from "./editor-parts"

const previewSources = import.meta.glob<string>(
  ["./editor-previews/*.tsx", "./editor-preview-compositions/*.tsx"],
  { query: "?raw", import: "default" },
)

export async function getEditorDocumentation(slug: string) {
  const part = getEditorPart(slug)

  if (!part) return null
  let sourcePath = `./editor-previews/${part.slug}.tsx`

  if (part.name.startsWith("EditorInlineCombobox"))
    sourcePath = "./editor-preview-compositions/inline-combobox.tsx"
  else if (
    part.name.startsWith("EditorEmoji") &&
    part.name !== "EditorEmojiMenu"
  )
    sourcePath = "./editor-preview-compositions/emoji.tsx"

  const load = previewSources[sourcePath]

  if (!load) throw new Error(`Missing editor preview: ${part.name}`)

  const [source, data] = await Promise.all([
    load(),
    getDocumentation({ data: part.item }),
  ])

  const usage = rewriteImports(source)
  const api = data.api.filter((entry) => entry.name === part.name)

  if (api.length === 0)
    throw new Error(`Missing editor API reference: ${part.name}`)

  return {
    installNames: [part.item],
    title: part.name,
    description: part.description,
    usage,
    previewSource: usage,
    api,
    notes: [
      ...(part.name === "Editor"
        ? []
        : [
            "Place controls and EditorContent inside EditorRoot. Keep extension arrays stable when the editor mounts.",
          ]),
      ...(part.item === "editor-code"
        ? [
            "Select one code block before using code controls. Copy also works in read-only editors.",
          ]
        : []),
      ...(part.item === "editor-typeahead"
        ? [
            "Import optional parts from @/components/editor/typeahead-index. Keep one controller and its extension array stable for each root.",
            "Compose inline parts around one native editable surface. Keep candidate objects in controller order.",
            "Place EditorEmojiPicker inside EditorEmojiPopoverContent and EditorEmojiPopover. Use EditorEmojiMenu for the toolbar preset.",
            "The mention loader registers MentionNode. Other readers must register the canonical node through a Lexical extension.",
          ]
        : []),
      ...(part.item === "editor-blocks"
        ? [
            "Register EditorBlocksExtension with EditorRoot. Import server validation helpers from the separate blocks-model module.",
            "Toggle titles can contain links. The separate native disclosure control opens the body without activating title links.",
            "Read-only disclosure does not change saved document state. Block mutation controls are disabled in read-only editors.",
          ]
        : []),
      ...(part.name.startsWith("EditorTable")
        ? [
            "Select a table cell before using table controls. Keep table geometry and border validation enabled.",
          ]
        : []),
    ],
  }
}
