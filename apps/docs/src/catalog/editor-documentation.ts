import { getDocumentation } from "./docs.functions"
import { getEditorPart } from "./editor-parts"
import { getEditorPreviewSource } from "./editor-preview-source"

export async function getEditorDocumentation(slug: string) {
  const part = getEditorPart(slug)

  if (!part) return null
  let sourcePath = `./editor-previews/${part.slug}.tsx`

  if (part.item === "editor-block-placeholder")
    sourcePath = "./editor-examples/public-placeholder.tsx"
  else if (part.name === "EditorFloatingToolbar")
    sourcePath = "./editor-examples/public-floating-toolbar.tsx"
  else if (part.item === "editor-drawing")
    sourcePath = "./editor-examples/public-drawing.tsx"
  else if (part.item === "editor-cursor-overlay")
    sourcePath = "./editor-examples/public-cursors.tsx"
  else if (part.item === "editor-media-placeholder")
    sourcePath = "./editor-previews/media-placeholder-example.tsx"
  else if (part.name === "EditorReviewModeMenu")
    sourcePath = "./editor-previews/review-mode-menu.tsx"
  else if (
    part.item === "editor-toolbar-menus" &&
    part.name !== "EditorFloatingToolbarButtons" &&
    part.name !== "EditorTurnIntoMenu"
  )
    sourcePath = "./editor-preview-compositions/toolbar-menus.tsx"
  else if (part.item === "editor-ai-menu")
    sourcePath = "./editor-preview-compositions/ai-menu.tsx"
  else if (part.item === "editor-diagram")
    sourcePath = "./editor-preview-compositions/diagram.tsx"
  else if (part.item === "editor-list-presentation")
    sourcePath = "./editor-examples/public-list-presentation.tsx"
  else if (part.item === "editor-block-menu")
    sourcePath = "./editor-preview-compositions/block-menu.tsx"
  else if (part.item === "editor-copilot")
    sourcePath = "./editor-examples/public-copilot.tsx"
  else if (part.item === "editor-editable-card")
    sourcePath = "./editor-examples/public-editable-voids.tsx"
  else if (part.item === "editor-docx")
    sourcePath = "./editor-examples/public-docx.tsx"
  else if (part.item === "editor-document-export")
    sourcePath =
      part.name === "EditorDocumentPrintControl"
        ? "./editor-preview-compositions/document-print.tsx"
        : "./editor-examples/public-document-export.tsx"
  else if (part.item === "editor-labels")
    sourcePath =
      part.name === "EditorLabelsPicker" || part.name === "EditorLabelsOption"
        ? "./editor-examples/public-labels.tsx"
        : "./editor-previews/labels-select.tsx"
  else if (part.item === "editor-search")
    sourcePath = "./editor-preview-compositions/search.tsx"
  else if (part.name.startsWith("EditorInlineCombobox"))
    sourcePath = "./editor-preview-compositions/inline-combobox.tsx"
  else if (
    [
      "MediaActions",
      "MediaEditControl",
      "MediaCaptionTextarea",
      "MediaAlignButton",
      "MediaDeleteButton",
      "MediaImageResize",
    ].includes(part.name)
  )
    sourcePath = "./editor-previews/media-actions.tsx"
  else if (part.name.startsWith("MediaPreview"))
    sourcePath = "./editor-preview-compositions/media-preview.tsx"
  else if (part.name === "MediaEmbedContent")
    sourcePath = "./editor-preview-compositions/media-embed.tsx"
  else if (part.name === "MediaInsertControl")
    sourcePath = "./editor-preview-compositions/media.tsx"
  else if (part.name === "MediaFileClipboard")
    sourcePath = "./editor-preview-compositions/media-file-clipboard.tsx"
  else if (part.name === "EditorFootnoteControls")
    sourcePath = "./editor-preview-compositions/footnotes.tsx"
  else if (part.name === "EditorTocControls")
    sourcePath = "./editor-preview-compositions/toc.tsx"
  else if (part.name.startsWith("EditorReviewStructural"))
    sourcePath = "./editor-preview-compositions/review-structural.tsx"
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
      part.item === "editor-document-export-pdf"
        ? [part.item, "editor-document-export-image"]
        : part.name === "EditorFloatingToolbarButtons"
          ? [part.item, "editor-floating-toolbar"]
          : part.item === "editor-document-export" &&
              part.name !== "EditorDocumentPrintControl"
            ? [part.item, "editor-document-export-image", "editor-math"]
            : part.name === "editorTocSlashCommand"
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
      ...(part.item === "editor-drawing"
        ? [
            "Register EditorDrawingExtension in a stable array. Load the separate browser entry and SDK stylesheet inside a framework browser boundary.",
            "Self-host SDK fonts before mounting and restrict fallback font resources through CSP. Register one runtime per root and run its cleanup.",
            "Scenes reject files, images, link targets, custom metadata and unsupported elements. Validate drafts and sanitize SVG before download.",
            "SDK dependency advisories and runtime/accessibility acceptance remain unresolved. Document readers retain validated scene metadata without SDK rendering.",
          ]
        : []),
      ...(part.item === "editor-cursor-overlay"
        ? [
            "Place EditorCursorOverlay inside EditorRoot beside the editable surface. Native drag and drop stay unchanged.",
            "Paint uses the root owner document and does not enter document state. Read-only and content changes clear it.",
            "Toolbar selection paint is not AI authorization, proposal acceptance, or remote presence.",
          ]
        : []),
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
      ...(part.name === "DocumentStatic"
        ? [
            "Optional idPrefix has 1–64 ASCII characters. Start with an ASCII letter. Use ASCII letters, digits, underscores, or non-consecutive hyphens after it. Invalid prefixes throw. Use the same stable prefix for server rendering and hydration. Use a distinct prefix for each document in one owner document. Reserve generated IDs against other host markup. Choose distinct, meaningful aria-label values for multiple documents.",
            "A prefix changes rendered IDs and fragment targets to <idPrefix>--<canonical-id>. Update deep links when opting in. Native fragment activation can change the URL and browser history. Changing a prefix changes its links. Omitting idPrefix preserves canonical IDs and existing deep links, but does not isolate multiple instances. Static prefixing does not change document data. Prefixed markup is not portable document HTML.",
          ]
        : []),
      ...(part.item === "editor-document"
        ? [
            "Import DocumentStatic from the separate document/static entry. No EditorRoot is required.",
            "Register each optional live feature node before import. Readers retain validated math, mentions, media, footnotes, contents, columns, dates, labels, drawing scenes, card nodes, and diagram metadata. Static drawing output uses metadata without SDK rendering. Transient card values are not saved. Review formats fail before replacement. Saved identities do not grant access.",
          ]
        : []),
      ...(part.item === "editor-media"
        ? [
            "Register MediaExtension in a stable root extension array. MediaInsertControl belongs inside EditorToolbar.",
            "MediaInsertControl and MediaEditControl reject literal ? and #, including empty delimiters. The insert rule applies to direct URLs and upload results. Use query-free provider URLs with this control. In URL paths, %3F and %23 are path data. Provider and iframe rules can be stricter. The pure parseProvider helper keeps its supported provider forms.",
            "MediaInsertControl requires a fresh valid range, a connected editable root, and a registered MediaNode. Content, changed non-null selection, read-only, or root changes can invalidate the target. A null selection can remain while the dialog has focus. On success, the control inserts after the ordered selection-end root child or at the exact root gap. Its insertion keeps selected content, list and table structure, and empty target blocks. It adds an empty paragraph and selects the new media node.",
            "$insertMedia uses Lexical nearest-root insertion on the current range. MediaFileClipboard restores its range and calls $insertMedia. Its drop range comes from the drop position. Clipboard completion requires an unchanged non-null range. The insert control and clipboard insertion request HISTORY_PUSH_TAG. Media action changes and removal also request it. This tag does not guarantee exact undo grouping. The standalone $insertMedia helper adds no history tag or saved-target lease. Its caller owns the update, selection, and history policy. These paths use parseMedia, not the insert control's delimiter rule. Provider-specific checks still apply. Ordinary URLs can have nonempty components that the portable reader rejects. Placement has no control preservation guarantee.",
            "Cancellation signals the host and discards stale local results. Remote cancellation is cooperative. Each mounted MediaInsertControl instance keeps its upload slot until its callback settles. Separate instances and remounts do not share that slot. The placeholder controller keeps its own busy slot until settlement. MediaFileClipboard does not retain an equivalent slot after cancellation. Calling start on the same createMediaUpload task can supersede an unsettled call. Earlier callbacks can continue. Enforce remote upload concurrency and retry policy in the host. Cancellation does not prove that remote work stopped.",
            "MediaContent and MediaPreview parts work without EditorRoot. Keep native playback and file links usable in read-only views.",
            "Compose MediaPreviewRoot, Trigger, and Dialog, or use MediaPreviewGallery. Supply unique image IDs. Zoom uses keyboard-accessible Slider and ScrollArea controls and is not saved.",
            "MediaEmbedContent needs an explicit provider or exact HTTPS-origin policy. Frames stay blocked until consent. Source, policy, and disabled changes reset consent. Frame consent does not cover images, video, audio, or caption tracks. Images can request their URLs when rendered. Native media and tracks can make network requests. Preload settings do not guarantee network privacy. Successful uploads retain the file name and URL. Media JSON and tagged HTML can include URLs, names, alt text, and captions. Account for this data in host delivery, CSP, logs, clipboard, and storage policies. DNS and redirects need host controls.",
            "Use HTTPS URLs without credentials. Host uploads require authorization and bounded validation.",
            "Mount MediaFileClipboard inside EditorRoot with a stable upload callback. It handles one file per paste or drop. Rich MIME and higher-priority host handlers stay first. Without upload it registers nothing. Callback changes cancel pending work. Host callbacks enforce size, content, authorization, and quota limits.",
            "Install editor-document separately for document IO. Both native media and the portable reader require absolute HTTPS source and track URLs without credentials. The portable reader rejects nonempty query or fragment components. It may retain canonical ordinary-media and track URLs with empty trailing ? or #, subject to all other checks.",
          ]
        : []),
      ...(part.item === "editor-columns"
        ? [
            "Register EditorColumnsExtension in a stable extensions array. Import pure codecs from @/components/editor/columns-model.",
            "Select a column before layout, resize, move, or remove actions. Remove deletes the group and its content.",
            "Document readers retain validated columns. Register feature nodes before live imports. Nested column groups are rejected.",
          ]
        : []),
      ...(part.item === "editor-date"
        ? [
            "Register EditorDateExtension in a stable extensions array. Import pure codecs from @/components/editor/date-model.",
            "EditorDateNode renders EditorDateInline with its current node key and date. Do not supply detached node keys.",
            "Store YYYY-MM-DD values without timezone conversion. Document readers retain validated dates. Register feature nodes before live imports.",
          ]
        : []),
      ...(part.item === "editor-footnotes"
        ? [
            "Install editor-footnotes separately. Import controls from @/components/editor/footnote and pure codecs from @/components/editor/footnote-model.",
            "Register EditorFootnoteExtension in a stable array. The createEditorFootnoteTypeahead controller includes this extension; do not register it twice.",
            "EditorFootnoteTypeahead renders EditorContent. Do not add another editable surface beside it.",
            "Select a definition before removal or duplicate renumbering. Backlinks navigate to native references, including in read-only roots.",
            "Document readers retain validated footnotes. Register feature nodes before live imports. Validate complete documents before replacement.",
          ]
        : []),
      ...(part.item === "editor-toc"
        ? [
            "Install editor-toc separately. Import controls from @/components/editor/toc and pure codecs from @/components/editor/toc-model.",
            "Register EditorTocExtension in a stable array. The overview follows native document headings. Select its node before removal.",
            "Slash insertion also requires editor-typeahead. Pass editorTocSlashCommand() to createEditorTypeahead and register its controller extension.",
            "Document readers retain validated TOC nodes. Register feature nodes before live imports. Validate complete documents before replacement.",
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
