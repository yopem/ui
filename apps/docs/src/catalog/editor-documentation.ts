import { getDocumentation } from "./docs.functions"
import { getEditorPart } from "./editor-parts"
import { getEditorPreviewSource } from "./editor-preview-source"

export async function getEditorDocumentation(slug: string) {
  const part = getEditorPart(slug)

  if (!part) return null
  let sourcePath = `./editor-previews/${part.slug}.tsx`

  if (part.item === "editor-block-placeholder")
    sourcePath = "./editor-examples/public-placeholder.tsx"
  else if (part.item === "editor-floating-toolbar")
    sourcePath = "./editor-examples/public-floating-toolbar.tsx"
  else if (part.item === "editor-ai-menu")
    sourcePath = "./editor-examples/public-ai.tsx"
  else if (part.item === "editor-diagram")
    sourcePath = "./editor-preview-compositions/diagram.tsx"
  else if (part.item === "editor-list-presentation")
    sourcePath = "./editor-examples/public-list-presentation.tsx"
  else if (part.item === "editor-block-menu")
    sourcePath = "./editor-examples/public-block-menu.tsx"
  else if (part.item === "editor-copilot")
    sourcePath = "./editor-examples/public-copilot.tsx"
  else if (part.item === "editor-editable-card")
    sourcePath = "./editor-examples/public-editable-voids.tsx"
  else if (part.item === "editor-docx")
    sourcePath = "./editor-examples/public-docx.tsx"
  else if (part.item === "editor-labels")
    sourcePath = "./editor-examples/public-labels.tsx"
  else if (part.item === "editor-search")
    sourcePath = "./editor-preview-compositions/search.tsx"
  else if (part.name.startsWith("EditorInlineCombobox"))
    sourcePath = "./editor-preview-compositions/inline-combobox.tsx"
  else if (part.name === "MediaInsertControl")
    sourcePath = "./editor-preview-compositions/media.tsx"
  else if (part.name === "EditorFootnoteControls")
    sourcePath = "./editor-preview-compositions/footnotes.tsx"
  else if (part.name === "EditorTocControls")
    sourcePath = "./editor-preview-compositions/toc.tsx"
  else if (
    part.item === "editor-review" &&
    ![
      "EditorReviewPreset",
      "EditorReviewRichContent",
      "EditorReviewRichComposer",
    ].includes(part.name)
  )
    sourcePath = "./editor-preview-compositions/review.tsx"
  else if (
    part.name.startsWith("EditorEmoji") &&
    part.name !== "EditorEmojiMenu"
  )
    sourcePath = "./editor-preview-compositions/emoji.tsx"

  const family =
    part.item === "editor-columns"
      ? "column"
      : part.item === "editor-date"
        ? "date"
        : part.item === "editor-footnotes"
          ? "footnote"
          : part.item === "editor-toc"
            ? "toc"
            : undefined

  const [usage, data] = await Promise.all([
    getEditorPreviewSource(sourcePath, family),
    getDocumentation({ data: part.item }),
  ])

  const api = data.api.filter((entry) => entry.name === part.name)

  if (api.length === 0)
    throw new Error(`Missing editor API reference: ${part.name}`)

  return {
    installNames:
      part.name === "editorTocSlashCommand"
        ? [part.item, "editor-typeahead"]
        : [part.item],
    title: part.name,
    description: part.description,
    usage,
    previewSource: usage,
    api,
    notes: [
      ...(part.name === "Editor" ||
      part.name === "DocumentStatic" ||
      part.name === "MediaContent" ||
      part.item === "editor-review"
        ? []
        : [
            "Place controls and EditorContent inside EditorRoot. Keep extension arrays stable when the editor mounts.",
          ]),
      ...(part.item === "editor-block-placeholder"
        ? [
            "Mount one placeholder layer beside EditorContent inside EditorRoot. Keep labels fixed until unmount. Hints and the accessible status do not add document text.",
          ]
        : []),
      ...(part.name.startsWith("EditorAi")
        ? [
            "Supply a same-origin host endpoint, document ID, and session-bound CSRF headers. No default endpoint or model exists.",
            "Approve only completed plain-text proposals. Content, non-null selection, format, style, and read-only changes invalidate proposals.",
            "A null selection retains the saved target for dialog use. Remount EditorAiRoot when host code discards that target.",
            "Authorize document saves separately. AI invocation does not grant document write access.",
          ]
        : []),
      ...(part.item === "editor-ai-menu"
        ? [
            "EditorAiMenuContent owns the editable surface. Do not add EditorContent beside it.",
            "Compose all parts inside configured EditorAiRoot and EditorAiMenuRoot. Review comments require the current review controller and its policy.",
            "Twelve truncated chat messages remain in local memory until the menu root unmounts. Remount on document or viewer changes. No server chat storage is supplied.",
          ]
        : []),
      ...(part.item === "editor-review"
        ? [
            "EditorReviewPreset creates its own root and editable surface. Compose individual parts with one controller and EditorReviewProvider.",
            "EditorReviewRichComposer creates its own root. EditorReviewRichContent renders validated content without an EditorRoot.",
          ]
        : []),
      ...(part.item === "editor-document"
        ? [
            "Import DocumentStatic from the separate document/static entry. No EditorRoot is required.",
            "Register math, mention, and media nodes before import. Media uses canonical tagged HTML and Markdown fallback. Review formats fail before replacement. Saved mention identities do not grant access.",
          ]
        : []),
      ...(part.item === "editor-media"
        ? [
            "Register MediaExtension in a stable root extension array. MediaInsertControl belongs inside EditorToolbar.",
            "MediaContent renders validated parseMedia data without EditorRoot. Keep native playback and file links usable in read-only views.",
            "Use HTTPS URLs without credentials. Host uploads require authorization and bounded validation.",
            "Install editor-document separately for document IO. Preserve canonical media metadata and reject URL queries and fragments.",
          ]
        : []),
      ...(part.item === "editor-columns"
        ? [
            "Register EditorColumnsExtension in a stable extensions array. Import pure codecs from @/components/editor/columns-model.",
            "Select a column before layout, resize, move, or remove actions. Remove deletes the group and its content.",
            "Generic editor-document converters do not support columns. Keep native rich block nesting; nested column groups are rejected.",
          ]
        : []),
      ...(part.item === "editor-date"
        ? [
            "Register EditorDateExtension in a stable extensions array. Import pure codecs from @/components/editor/date-model.",
            "EditorDateNode renders EditorDateInline with its current node key and date. Do not supply detached node keys.",
            "Store YYYY-MM-DD values without timezone conversion. Generic editor-document converters do not support date nodes.",
          ]
        : []),
      ...(part.item === "editor-footnotes"
        ? [
            "Install editor-footnotes separately. Import controls from @/components/editor/footnote and pure codecs from @/components/editor/footnote-model.",
            "Register EditorFootnoteExtension in a stable array. The createEditorFootnoteTypeahead controller includes this extension; do not register it twice.",
            "EditorFootnoteTypeahead renders EditorContent. Do not add another editable surface beside it.",
            "Select a definition before removal or duplicate renumbering. Backlinks navigate to native references, including in read-only roots.",
            "Generic editor-document converters do not support footnotes. Validate complete documents before replacement.",
          ]
        : []),
      ...(part.item === "editor-toc"
        ? [
            "Install editor-toc separately. Import controls from @/components/editor/toc and pure codecs from @/components/editor/toc-model.",
            "Register EditorTocExtension in a stable array. The overview follows native document headings. Select its node before removal.",
            "Slash insertion also requires editor-typeahead. Pass editorTocSlashCommand() to createEditorTypeahead and register its controller extension.",
            "Generic editor-document converters do not support TOC nodes. Validate complete documents before replacement.",
          ]
        : []),
      ...(part.item === "editor-math"
        ? [
            "Register EditorMathExtension in a stable extension array. Import pure validation from @/components/editor/math-model. Validate complete documents before replacement.",
          ]
        : []),
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
