export type Guidance = "design" | "agents" | "none"

export function isGuidance(value: string | undefined): value is Guidance {
  return value === "design" || value === "agents" || value === "none"
}

const begin = "<!-- BEGIN:yopem-ui-design -->"

const end = "<!-- END:yopem-ui-design -->"

export function designGuidance(
  content: string,
  importPrefix = "@/",
  imports = {
    components: `${importPrefix}components/ui`,
    editor: `${importPrefix}components/editor`,
    tokens: `${importPrefix}styles/tokens.stylex`,
    lib: `${importPrefix}lib/stylex`,
    css: `${importPrefix}styles/styles.css`,
  },
) {
  const block = `${begin}
## Yopem UI design system

### Source and imports

Yopem UI provides source-owned React components with TypeScript, Base UI, and StyleX.
Init installs only base files. Install each component before you use it.
Use the installed source and component documentation as the API reference.

- Import components from \`${imports.components}/<name>\`.
- Import semantic tokens from \`${imports.tokens}\`.
- Import StyleX helpers from \`${imports.lib}\`.
- Keep \`${imports.css}\` loaded at the application root.
- Keep the \`@stylex;\` directive and CSS layer order intact.
- Use named function exports for React components.
- Keep \`"use client"\` in client components.
- Preserve public exports, consumer props, refs, \`className\`, and \`data-slot\` values.

Import \`CSPProvider\` from \`@base-ui/react/csp-provider\`.
Import \`DirectionProvider\` from \`@base-ui/react/direction-provider\`.
Supply the host CSP nonce. Keep the host CSP policy intact.

### Editor source

Install the editor with the CLI before you use it:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor
npx @yopem-ui/cli add editor
pnpm dlx @yopem-ui/cli add editor
yarn dlx @yopem-ui/cli add editor
\`\`\`

Import the named \`Editor\` component from \`${imports.editor}\`.
The editor uses Lexical 0.52.0 and registry StyleX UI components.
Keep all copied editor files together. Keep generic UI components in the UI directory.
The editor directory follows \`paths.components\`, not \`paths.ui\`.
Use \`initialState\` for initial Lexical JSON and \`onChange\` for content updates.
Use \`ariaLabel\` for an accessible name. Set \`editable={false}\` for read-only content.
Use \`useEditorState().editable\` for mutation controls. It reports attached native editability.
Server markup stays read-only until the native root connects. The \`editable\` prop keeps the requested setting.
Validate saved JSON before storage or publication.
The editor provides a foundation, not full Plate feature parity.
Use Lucide icons for standard toolbar actions. Keep full accessible names and titles.
For standard editor actions, pass Button icon sizes through render. Keep current values visible in selection controls.
Set aria-pressed on ToolbarButton for controlled toggle actions. Native toggle renderers keep their own state.
Open https://ui.yopem.com/editor/examples/notion-like for the standalone Potion-style workspace.
Keep the app height within the viewport. Use separate ScrollArea viewports for navigation and document content.
Use Sheet navigation when the parent is narrow. Keep page controls outside document scrolling.
Native controls include links, demo mentions, callouts, math, contents, and URL images. Demo mention IDs grant no access.
The Table of Contents page has a separate outline and an in-document contents block.
Both show the first 500 nonempty headings in preorder.
Titles normalize whitespace and truncate to 256 UTF-16 code units.
The outline does not change saved content.
See https://ui.yopem.com/editor/examples#notion-like for its consumer source and installation commands.
Public runtime observations guide this example. The deployed Potion revision is unknown.
That example uses yopem-ui:notion-like:v1:document: keys for validated known-page JSON drafts.
Stored documents validate before the native root mounts. Rejected stored bytes stay unchanged.
Storage or validation failure pauses writes. Memory editing and active-page JSON copy remain available.
Page switches reset undo history and selection. Titles and page options stay in memory.
Browser drafts are unencrypted. Scripts on this origin can read them. Browser storage can remove drafts.
Two tabs can overwrite drafts. No conflict resolution or remote synchronization exists.
Do not treat browser drafts as private or durable storage.
Supply accounts, collaboration, and other host services separately.
Use \`Editor\` for the preset. Compose \`EditorRoot\`, \`EditorToolbar\`, and \`EditorContent\` for custom interfaces.
Import these parts from \`${imports.editor}\` after the same editor installation.
Keep \`EditorFormatButton\`, \`EditorHistoryButton\`, \`EditorBlockButton\`, \`EditorListButton\`,
\`EditorIndentButton\`, \`EditorLinkControl\`, and \`EditorTableButton\` inside their root.
Choose controls as children of \`EditorToolbar\`. Each root keeps separate document state and history.
Use \`EditorTableMenu\` for row, column, header, merge, and split actions.
Register \`EditorTablePresentationExtension\` for bounded tables and persisted cell presentation.
Compose \`EditorTableDimensions\`, \`EditorTableCellPresentation\`, and \`EditorTableResizeControls\` inside the root.
Use \`EditorTableBackgroundControls\` and \`EditorTableBorderControls\` for separate controls.
Border controls support individual and rectangle edges. Shared merged edges are indivisible.
Configure \`disableMerge:true\` at mount time to block house merge actions.
Existing spans remain. Explicit splitting stays available. Native host mutations bypass this policy.
Row resizing stores minimum height. Content can make rows taller.
Keep \`data-editor-row-height\` in exported HTML to preserve finite native heights.
Keep table scrolling bounded in both directions and keyboard-accessible.
Before loading or mutating live Lexical slots, bound occupied slots and preserve acyclic ownership.
Validate complete candidates at host boundaries. Root transforms do not validate all queued updates. Rejected updates can discard coalesced pending edits.
Do not rely on transforms for \`skipTransforms\` updates or unvalidated external state.
Install optional \`editor-csv\` for bounded CSV clipboard imports. Register \`EditorCsvExtension\` in a stable root extensions array.
Use \`pasteTsv:false\` on \`EditorTablePresentationExtension\` when CSV owns tab-containing input. HTML validation stays active.
Keep native JSON/HTML clipboard priority and HIGH/CRITICAL host paste policy. Reject malformed CSV before mutation.
CSV limits are 1 MiB, 50 rows, 50 columns, and 2500 cells. Plain text needs a comma and multiple lines; explicit \`text/csv\` also supports one row.
Install optional \`editor-search\` separately. Compose \`EditorSearchRoot\` inside \`EditorRoot\`.
Place \`EditorContent\` inside \`EditorSearchViewport\`. Compose input, previous/next, and status controls.
Search changes transient overlays and selection, not document content. It does not replace text.
Bound queries to 64 Unicode code points and results to 200 within-TextNode matches. Matches do not cross styled nodes.
Use the pure \`search-model\` module outside React. Preserve host input cancellation and read-only navigation.
Install optional \`editor-floating-toolbar\` separately. Compose \`EditorFloatingToolbar\` inside \`EditorRoot\` beside \`EditorContent\`.
Use existing controls as children. Select native text, then use Alt+F10 to focus the toolbar. Escape returns keyboard focus.
Use \`EditorLinkFloatingToolbar\` from \`${imports.editor}/floating-toolbar\` for open, edit, and remove actions at a collapsed link caret.
Expanded link text keeps the text toolbar. Preserve the saved-range guard. Content changes and read-only transitions invalidate the target.
Install optional \`editor-block-menu\` separately. Import from \`${imports.editor}/block-menu-index\`.
Create one stable controller per root. Register its extension and wrap \`EditorContent\` with \`EditorBlockMenu\`.
Compose \`EditorBlockSelection\` with a separate stable controller for gutter actions. Register both controller extensions once.
Right-click or press Shift+F10. Configured action policy must return literal true; stale targets reject.
Supply explicit Ask AI and Code Drawing callbacks. No default service is supplied.
Their second argument retains a validated target after menu close. Subscribe to its availability.
Call restoreSelection from the native control's onClick handler. Prevent default when restoration fails.
Call refresh after host policy changes. Dispose retained preparations during cleanup.
New captures, content changes, and read-only transitions invalidate them.
For Add comment, supply onAddComment and an authorizeAction policy that returns literal true.
The comment callback owns review UI, focus, and storage. The controller does not restore its captured selection for this action.
Callbacks do not grant document access. Preserve native selection, clipboard policies, history, and host event cancellation.
Install optional \`editor-diagram\` separately. Import from \`${imports.editor}/diagram\`.
Register \`EditorDiagramExtension\` once. Compose \`EditorDiagramRoot\` inside \`EditorRoot\` with explicit renderers.
Native JSON and marked code HTML keep diagram metadata. Document readers retain it without running renderers.
Set mount-time \`autoRender\` to render configured saved and read-only diagram nodes after a 500 ms source-change delay.
Automatic work allows two active renders and sixteen queued jobs. Noncooperative renderers retain their slots until settlement.
Use \`EditorDiagramDownloadButton format="png"\` for bounded owner-document PNG download; SVG remains the default. PDF is not supplied.
Install engine adapters separately: \`editor-diagram-mermaid\`, \`editor-diagram-plantuml\`, \`editor-diagram-graphviz\`, or \`editor-diagram-flowchart\`.
Import SDK adapters only from browser-only entries, never SSR routes. Use \`renderEditorDiagram\` for direct calls and SVG sanitization.
Source filters are supported subsets, not SDK sandboxes. Cancellation cannot stop synchronous SDK work or every queued operation.
Host endpoints need authentication, document permission, exact Origin, CSRF verification, and execution limits. Configure headers explicitly; never use credential URLs.
Install optional \`editor-copilot\` separately. Import \`EditorCopilot\` from \`${imports.editor}/copilot\`.
Render inside \`EditorRoot\` with a stable same-origin endpoint, document ID, and current authentication and CSRF headers.
Control+Space requests a paragraph-end completion. Tab accepts completed text; Mod+Right accepts one grapheme. Escape cancels.
Require explicit completion and clean EOF. Stale selection, content, style, composition, and read-only changes invalidate completions.
Automatic requests need host permission and user opt-in. Keep server document policy, quota, credentials, and model selection explicit.
Cancellation cannot prove that provider billing stops. No default endpoint or model exists.
Install optional \`editor-editable-card\` separately for native cards with transient local form state.
Import from \`${imports.editor}/editable-card\`. Register \`EditorEditableCardExtension\` in a stable extensions array.
Compose \`EditorEditableCardInsertButton\` inside \`EditorToolbar\`. Keep native browser Tab order.
Nested editor state and history are independent. JSON stores only the card type and version.
Removal, import, and undo restoration reset local fields and notes.
Document readers retain the saved card node, not transient form values.
Install optional \`editor-list-presentation\` separately for native list markers and signed starts.
Register \`EditorListPresentationExtension\` at root creation. Compose marker and start controls inside \`EditorToolbar\`.
Preserve \`yopemListMarker\` NodeState, \`data-editor-list-marker\`, and native ordered-list \`start\` attributes.
Checklists keep their native behavior. Custom HTML readers must compose existing converters instead of replacing them.
Optional \`editor-document\` retains validated markers and signed starts in JSON, HTML, Markdown, and static output.
Markdown uses canonical HTML when native Markdown cannot retain list presentation.
Install optional \`editor-drawing\` separately. Register \`EditorDrawingExtension\` in a stable root array.
Load \`${imports.editor}/drawing-browser\` and the SDK stylesheet inside a framework browser boundary.
Self-host SDK fonts under an approved same-origin path. Preserve SDK/font notices and restrict fallback font resources through CSP.
Register one runtime per root and run its cleanup. Concurrent runtimes must share the global asset path.
Keep scenes within 512 KiB and 2000 supported elements. Reject files, images, link targets, custom metadata, and unsupported types.
Read-only roots can open saved scenes in view mode. They cannot insert or apply drawing edits.
Download validated JSON, sanitized SVG, or bounded PNG without applying draft changes. Read-only views can export.
PNG clipboard copy requires browser support and user activation. One module-instance export uses a 30-second deadline.
PNG allows 4096 by 16384 pixels and 16777216 pixels total. Output has a 16 MiB limit.
Cancellation discards stale results but cannot interrupt synchronous SDK or native clipboard work.
Document readers retain validated scenes in JSON and canonical HTML.
Generic static output shows drawing metadata, not an SDK-rendered scene.
SDK/transitive dependency advisories and SSR/browser/accessibility acceptance remain unresolved. Do not claim production safety.
Install optional \`editor-cursor-overlay\` separately. Import \`EditorCursorOverlay\` from \`${imports.editor}/cursor-overlay\`.
Compose it beside \`EditorContent\` inside \`EditorRoot\`. Keep native drag and drop.
Paint uses the root owner document and saves no document state. Read-only transitions and document changes clear it.
The store connects listeners on first subscription and removes them after final unsubscribe or disposal.
Retained toolbar paint is not AI authorization, proposal approval, or remote collaboration presence.
Install optional \`editor-word-clipboard\` separately for bounded Office HTML fragments.
Import registration helpers from \`${imports.editor}/word-clipboard\` and pure normalization from \`${imports.editor}/word-clipboard-model\`.
Register \`EditorWordClipboardExtension\` in a stable root extensions array.
Call \`registerDocumentPaste\` and \`registerWordClipboardPaste\` after creation. Keep both cleanups in the host lifecycle.
Preserve native JSON and host MIME priority. Invalid, empty, stale, composing, and read-only imports keep current content.
Images reject by default. Supply a stable synchronous trusted-media resolver and register \`MediaExtension\` for resolved images.
Never fetch pasted file or network image URLs automatically. Promise and thenable resolver results reject.
Host callback side effects cannot be rolled back. This subset does not preserve complete Word page layout.
Install optional \`editor-docx\` separately for bounded semantic Word files.
Import portable functions from \`${imports.editor}/docx\` and client controls from \`${imports.editor}/docx-controls\`.
Compose \`EditorDocxImportControl\`, \`EditorDocxExportControl\`, or \`EditorDocxControls\` inside \`EditorRoot\`.
Validate archives and XML before document replacement. Read-only or stale targets reject imports; read-only export is supported.
Keep independent 1 MiB archive and decoded-data limits. Native deflate decompression is required for compressed files.
Unsupported content rejects. Do not promise complete Word layout, images, macros, headers, or footers.
Cancellation cannot stop synchronous parsing. Word files and Word clipboard cleanup are separate workflows.
Install optional \`editor-document-export\` separately. Compose its print, PNG, or combined controls inside \`EditorRoot\`.
Import controls from \`${imports.editor}/document-export\`. Read-only roots can export validated canonical snapshots.
Print needs no capture SDK. PNG requires an explicit \`capture\` callback.
Install \`editor-document-export-image\` only for the optional \`captureEditorDocumentImageWithHtmlToImage\` adapter.
Import the adapter from \`${imports.editor}/document-export-html-to-image\`. Preserve its dependency license notice.
Supply an abort-aware host resolver for remote images. Enforce exact origins, private asset permissions, and resource limits.
URLs with credentials, queries, or fragments reject. Supply a CSP nonce when required.
Print and PNG layouts allow 4096 by 16384 pixels and 16777216 pixels total. Image limits count every occurrence, including cached images. PNG checks validate container structure and checksums, not decoded pixels.
Export does not change selection or history. Keep one export active; cancelled work retains capacity until settlement.
Native print dialogs and synchronous browser work cannot be stopped. Verify local fonts, SVG foreignObject, CSP, and owner-document cleanup.
Install optional \`editor-labels\` separately. Import the controls and stable \`createEditorLabelsExtension\` from \`${imports.editor}/labels\`.
Use \`EditorLabelsPicker\` or compose \`EditorLabelsOption\` inside house \`CheckboxGroup\`. Admit one through 64 unique bounded options and at most ten tokens.
Use \`EditorLabelsSelect\` for filtered multiselect with removable tags. Compose \`EditorLabelsInput\`, \`EditorLabelsContent\`, and \`EditorLabelsTag\` for custom layouts.
Uncontrolled selections update the native label document with undo support. Controlled \`value\` needs \`onValueChange\`.
Disabled and read-only changes close suggestions and clear the query. Restoring editing does not open suggestions.
Commit controlled document changes through \`$replaceEditorLabels\` in the host callback. Keep \`options\` identical to the labels extension.
Apply minimum counts in the host form. Replace only label-only content. Register \`EditorLabelNode\` in each reader and use \`${imports.editor}/labels-model\` for pure validation.
Invalid node metadata rejects; unknown, duplicate, and excess valid tokens become text. Labels grant no access.
Document readers retain validated tokens. Register label nodes before live import.
Install optional \`editor-block-behavior\` separately. Import \`EditorBlockBehaviorExtension\` from \`${imports.editor}/block-behavior\`.
Keep its extensions array stable. Collapsed heading Enter makes the new half a paragraph.
Preserve higher-priority host policy, native selection, NodeState, composition, and history. Other block handlers stay native.
Install optional \`editor-autoformat\` separately. Import \`EditorAutoformatExtension\` from \`${imports.editor}/autoformat\`.
Keep it in a stable root array. It adds non-base transformers without repeating the base Markdown registration.
Configure stable element and text-match \`transformers\` with Lexical \`configExtension\`.
Host rules precede this extension's built-ins. Set \`includeBuiltInRules\` to \`false\` to disable only these built-ins.
Register transformer node dependencies at root creation. Keep trusted callbacks synchronous and regular expressions bounded.
Remount to change configuration. Custom rules are not a sandbox.
Document readers support plain horizontal rules. Register HorizontalRuleExtension before live imports. Unsupported rule presentation rejects.
Use word boundaries for fractions and retain line-start quote prefixes. Keep code literal and preserve host input, composition, clipboard, and history behavior.
Install optional \`editor-editing-rules\` separately. Create one stable \`createEditorEditingRulesExtension\` per root.
Use Mod+Enter to exit the containing root block; add Shift to insert before it.
Single-paragraph modes retain one paragraph for Enter and modifier shortcuts. They do not validate arbitrary documents.
Bound plain text to 1 MiB and converted block text to 2501 lines. Rejected or converted-empty paste preserves selected content.
Keep higher-priority host handlers, IME, native Tab, and read-only behavior.
Install optional \`editor-block-placeholder\` separately. Mount one \`EditorBlockPlaceholder\` beside \`EditorContent\` inside \`EditorRoot\`.
Keep label options fixed until unmount. Use native node type names or heading tags h1 through h6.
Show hints only for focused empty root blocks. Do not serialize placeholder text or modify native selection.
Preserve host classes and clear owned hints on blur, read-only changes, layer removal, and cleanup.
Validate external table JSON and HTML before conversion. Reject invalid updates without removing existing content.
Discard saved table selections after document content changes. Preserve resize cancellation, history, and RTL keyboard behavior.
Render checklist items as native list items with separate checkbox controls.
Keep native list semantics, keyboard input, history, and read-only behavior.
Reject empty rich clipboard insertions without removing selected content.
Core editing links plain URLs and email addresses with native AutoLinkNode.
Keep code inert. Register AutoLinkNode in custom readers of core editor JSON.
\`EditorContent\` shares the root accessible name and read-only state.
Pass additional Lexical extensions through \`extensions\` on EditorRoot or Editor.
Keep that list stable. Remount the root when the extension configuration changes.

Use \`EditorAlignmentButton\` and the font color, background, family, size, and weight controls for text presentation.
Use \`EditorLineHeightControl\` and \`EditorFirstLineIndentControl\` for block styles.
Keep \`EditorIndentButton\` for block indentation.
Register \`EditorBlockPresentationExtension\` in the stable mount-time extension list, including read-only roots.
Import pure codecs from \`${imports.editor}/block-presentation\` without loading React.
Pass only the \`editorBlockPresentation\` NodeState payload to \`parseEditorBlockPresentation\`.
Line height accepts unitless 1 through 4. First-line indent accepts 0 through 160px or 10em/rem.
Keep validated values in JSON and HTML. Preserve native HTML hooks and host sanitization.
Use \`EditorClearFormattingButton\` to clear presentation without deleting content, links, list nesting, tables, or unrelated NodeState.
Saved style selections expire after content changes. Keep controls inside their root.

### Editor code

Install optional native code editing:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-code
npx @yopem-ui/cli add editor-code
pnpm dlx @yopem-ui/cli add editor-code
yarn dlx @yopem-ui/cli add editor-code
\`\`\`

Import optional parts from \`${imports.editor}/code\`.
Register \`EditorCodeExtension\` when you create \`EditorRoot\`.
Keep \`EditorContent\` as the editable surface. Do not replace native code nodes with \`Codeblock\`.
Put \`EditorCodeLanguage\`, \`EditorCodeCopyButton\`, \`EditorCodeToggle\`, and \`EditorCodeStatus\` inside \`EditorCodeToolbar\`.
Select one code block before using its controls. Copy can run read-only; mutation cannot.
Line numbers and wrapping turn each other off. Lexical JSON preserves these choices.
Keep native code keyboard behavior and serializers. Discard targets after host document changes.
Base editor-code does not require Prettier. Supply an explicit \`EditorCodeFormatter\` for formatting controls.
Without a formatter, \`EditorCode\` does not show \`EditorCodeFormatButton\`.
Install the separate adapter only when you want Prettier formatting:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-code-format
npx @yopem-ui/cli add editor-code-format
pnpm dlx @yopem-ui/cli add editor-code-format
yarn dlx @yopem-ui/cli add editor-code-format
\`\`\`

Import \`prettierEditorCodeFormatter\` from \`${imports.editor}/code-format\`.
Pass it through the \`formatter\` prop. Syntax colors support more languages than this adapter can format.
Cancellation discards results but cannot stop synchronous parsing. The adapter does not change your repository formatter.

### Optional editor PDF export

Install optional \`editor-document-export-pdf\` separately.
Import \`EditorDocumentPDFExportControl\` from \`${imports.editor}/document-export-pdf\`.
Compose it inside \`EditorRoot\` with an explicit PNG \`capture\` callback.
Install \`editor-document-export-image\` only to use its optional \`captureEditorDocumentImageWithHtmlToImage\` adapter.
Import that adapter from \`${imports.editor}/document-export-html-to-image\`. No capture adapter is installed automatically.
The control downloads \`plate.pdf\` directly. It does not use native print.
Output contains one raster page with an opaque white JPEG image. Text is not selectable.
Keep the existing export resource policy, CSP nonce, stale-target checks, and shared operation lease.
Dimensions allow 4096 by 16384 pixels and 16777216 pixels total. Output has a 16 MiB limit.
Decoded image dimensions must match the snapshot. Cancelled work retains capacity until outstanding work settles.
Read-only roots can export without changes to saved content, selection, or history.
Synchronous browser work cannot be stopped. Browser and real PDF output checks remain unvalidated.

### Optional editor toolbar menus

Install optional \`editor-toolbar-menus\` separately. Import parts from \`${imports.editor}/toolbar-menus\`.
Compose \`EditorFixedToolbarButtons\` inside \`EditorFixedToolbar\` within \`EditorRoot\`.
Use \`EditorListToolbarButtons\` for grouped list controls.
Use grouped icon controls with full accessible names. Keep each group within its toolbar.
\`EditorInsertMenu\` adds an empty block after one current root block. It does not convert selected content.
\`EditorTurnIntoMenu\` converts native blocks. \`EditorMoreMenu\` applies strikethrough, subscript, superscript, and highlight.
Saved selections expire after document or editable-state changes. Preserve host event cancellation.
Configured \`authorizeAction\` must return literal \`true\`. It checks menu actions, not all grouped controls.
Install \`editor-floating-toolbar\` separately before composing \`EditorFloatingToolbarButtons\` inside \`EditorFloatingToolbar\`.
Optional feature nodes are not included. Native keyboard, history, focus, and accessibility checks remain unvalidated.

### Optional editor review

Install the optional \`editor-review\` item:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-review
npx @yopem-ui/cli add editor-review
pnpm dlx @yopem-ui/cli add editor-review
yarn dlx @yopem-ui/cli add editor-review
\`\`\`

Import \`EditorReviewPreset\` and \`EditorReviewHost\` from \`${imports.editor}/review\`.
The preset supplies its own root and editable surface. For custom composition, create one controller per root and add its extension to the stable root extension list.
Place \`EditorReviewProvider\` inside \`EditorRoot\`.
Import \`EditorReviewModeMenu\` from \`${imports.editor}/review\`. Keep it outside a disabled \`EditorToolbar\`.
Supply controlled \`value\`, synchronous \`canChangeMode\`, and \`onModeChange\` for Editing, Suggestion, and Viewing.
The default accessible name includes the current mode. An explicit \`aria-label\` also sets default visible text.
Keep custom child text in the accessible name.
Values are \`editing\`, \`suggestion\`, and \`viewing\`. The host owns editable state and review mode.
Keep \`onModeChange\` synchronous. Commit the controlled value only after review accepts.
Recheck host write and suggestion policies in the callback. Mode changes never grant permission.
Enable editing synchronously before \`setSuggesting\` when leaving Viewing. Restore the previous editable state if review rejects.
Set \`viewer\` from a verified host identity. Require synchronous \`can(action, targetId, viewer)\` and literal \`true\` for each allowed action.
Serialized author IDs are attribution only. They do not grant access. Check every action again on the server before saving.
\`visible=false\` hides review UI. It does not redact or delete review state. Review permission does not grant document writes.
Review state uses root NodeState \`yopemReview\`, pending tree state \`yopemReviewStructural\`, and text NodeState \`yopemSuggestion\`. Use \`parseReviewDocument\` at IO boundaries.
The review extension registers \`MarkNode\` in its editor. Register \`MarkNode\` in every external reader that loads review data.
The diff control changes one paragraph, up to 2048 graphemes and 4096 UTF-16 units.
Call \`$suggestDocumentTree\` inside an editor update for one bounded tree proposal. Resolve inline suggestions first.
Tree proposals allow 128 KiB, 1024 nodes, depth 24, and 128 changes.
Call \`decideStructural\` outside Lexical read and update contexts for current authorized decisions.
Pending edits, changed documents, and ambiguous comment anchors reject before replacement.
Use \`$suggestCompletedText\` inside an update for single-line AI output up to 16384 UTF-16 units.
Suggestion creation and acceptance are separate actions. Authorize document writes separately. Compose the structural proposal, change-list, and decision parts.
Use \`parseReviewDocument(value, trusted, true)\` for structural-review IO. Trust metadata only after host verification.
The source implementation still needs runtime validation.
Enter tracks a root paragraph split. Shift+Enter tracks a line break.
Other supported block contexts use tracked line breaks.
Resolve a pending paragraph break before splitting that paragraph again.
Call \`$suggestNativeInsertNodes\` inside a synchronous editor update for explicit insert-only operations.
Return the new inserted nodes. Use normal text descendants and snapshots within 128 KiB.
Resolve pending suggestions first. This API does not track arbitrary callbacks or text-free nodes.
Paste can retain validated same-namespace paragraph and list fragments as one authored suggestion. Accept keeps that fragment. Reject changes only that suggestion and preserves unrelated edits. Rich HTML and unsupported native fragments are rejected. Pasted review metadata is not preserved. \`editor-document\` does not import review formats.
See https://ui.yopem.com/components/editor-review for API and limits.

### Optional editor typeahead

Install the optional \`editor-typeahead\` item before use.
Import \`createEditorTypeahead\`, \`EditorTypeahead\`, and \`EditorEmojiPicker\` from \`${imports.editor}/typeahead-index\`.
Create one stable controller for each root. Keep custom command arrays stable at mount time.
Add the controller extension to the root extension list. Render suggestions inside the same root.
Supply a bounded, abort-aware mention loader. Missing loaders disable mention search.
The controller registers \`MentionNode\` only when \`mentions.load\` is set.
Keep mention options fixed for each root.
Register \`MentionNode\` in all document readers. Use \`decodeMention\` from \`${imports.editor}/mention-codec\` for identity validation.
Serialized identities do not prove account identity or grant access.
Register mention Markdown and HTML conversion explicitly. Do not discard unknown nodes.
Emoji uses the English emojibase-data inventory. Custom entries must contain one Unicode emoji grapheme.
Use category and page controls to browse the full inventory. Validate host lists with \`parseEditorEmojiInventory\`.
Pass \`controller.emojiHistory\` to the picker to share bounded memory counts. No automatic storage is included.
See https://ui.yopem.com/components/editor-typeahead for limits and IO registration.

Use EditorInlineCombobox with Input, Content, List, Item, Empty, Status, Group, GroupLabel, and Row parts.
EditorInlineComboboxInput renders EditorContent. Do not add a second query input.
Keep every current item in controller order. Read state with useEditorInlineCombobox.
Keep default option names short. Descriptions use aria-describedby outside the named option.
Keep the complete row available for pointer selection.
Compose EditorEmojiPopover, EditorEmojiToolbarButton, EditorEmojiPopoverContent, and EditorEmojiPicker inside EditorToolbar.
EditorEmojiPicker is the panel. EditorEmojiMenu is the complete toolbar preset.
Compose EditorEmojiSearch, EditorEmojiCategory, EditorEmojiList, EditorEmojiItem, EditorEmojiEmpty, EditorEmojiPrevious, EditorEmojiNext, EditorEmojiClearHistory, EditorEmojiClearSearch, and EditorEmojiPreview.
Read picker state with useEditorEmojiPicker. Keep inventory, filter, and history stable until unmount.
Keep inline and emoji options at least 44px high for coarse pointers.
EditorTypeahead renders the editable surface and suggestions. Do not add EditorContent beside this preset.

### Optional editor media

Install the optional media item with your selected package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-media
npx @yopem-ui/cli add editor-media
pnpm dlx @yopem-ui/cli add editor-media
yarn dlx @yopem-ui/cli add editor-media
\`\`\`

Import optional parts from \`${imports.editor}/media\`.
Register MediaExtension in a stable root extensions array. Compose MediaInsertControl inside EditorToolbar.
MediaInsertControl and MediaEditControl reject literal ? and #, including empty delimiters.
This insert rule applies to direct URLs and upload results. Use query-free provider URLs with this control.
In URL paths, %3F and %23 are path data. Provider and iframe rules can be stricter.
MediaInsertControl requires a fresh valid range, a connected editable root, and a registered MediaNode.
Content, changed non-null selection, read-only, or root changes can invalidate the target.
A null selection can remain while the dialog has focus.
On success, the control inserts after the ordered selection-end root child or at the exact root gap.
Its insertion keeps selected content, list and table structure, and empty target blocks.
It adds an empty paragraph and selects the new media node.
$insertMedia uses Lexical nearest-root insertion on the current range.
MediaFileClipboard restores its range and calls $insertMedia. Its drop range comes from the drop position.
Clipboard completion requires an unchanged non-null range. The insert control and clipboard insertion request HISTORY_PUSH_TAG. Media action changes and removal also request it. This tag does not guarantee exact undo grouping. The standalone $insertMedia helper adds no history tag or saved-target lease. Its caller owns the update, selection, and history policy.
These paths use parseMedia, not the insert control's delimiter rule. Provider-specific checks still apply.
Ordinary URLs can have nonempty components that the portable reader rejects. Placement has no control preservation guarantee.
Cancellation signals the host and discards stale local results. Remote cancellation is cooperative.
Each mounted MediaInsertControl instance keeps its upload slot until its callback settles. Separate instances and remounts do not share that slot. The placeholder controller keeps its own busy slot until settlement. MediaFileClipboard does not retain an equivalent slot after cancellation. Calling start on the same createMediaUpload task can supersede an unsettled call. Earlier callbacks can continue. Enforce remote upload concurrency and retry policy in the host. Cancellation does not prove that remote work stopped.
Compose selected-media controls inside MediaActions and EditorRoot. Omit nodeKey to follow one selected media node.
Keep an explicit nodeKey fixed until unmount. MediaEditControl changes the current source without another insertion.
MediaCaptionTextarea stores plain text with line breaks and a 10000-character limit. MediaImageResize supports images only.
Escape and pointer cancellation discard resize drafts. Content, target, and read-only changes expire saved edits.
Host event cancellation takes priority.
Mount MediaFileClipboard inside EditorRoot with a stable host upload callback.
It handles one file per paste or drop. Without upload, it registers nothing.
Rich MIME and higher-priority host handlers stay first. Callback changes cancel pending work.
Moving the caret cancels pending insertion.
Host callbacks enforce size, content, authorization, and quota limits.
MediaContent and image preview parts work without EditorRoot. Use absolute HTTPS source and track URLs without credentials.
Compose MediaPreviewRoot, MediaPreviewTrigger, and MediaPreviewDialog, or use MediaPreviewGallery.
Supply unique image IDs. Zoom stays local and uses house Slider and ScrollArea controls.
Use MediaEmbedContent with an explicit provider or exact HTTPS-origin policy.
Frames need user consent. Source, policy, and disabled changes discard consent.
Frame consent does not cover images, video, audio, or caption tracks. Images can request their URLs when rendered. Native media and tracks can make network requests. Preload settings do not guarantee network privacy. Successful uploads retain the file name and URL. Media JSON and tagged HTML can include URLs, names, alt text, and captions. Account for this data in host delivery, CSP, logs, clipboard, and storage policies.
Tweet embeds use the fixed platform.twitter.com endpoint. HTML exports keep inert links.
Origin validation does not check DNS or redirects. Keep these controls in the host.
Keep native playback, file links, and iframe controls usable in read-only roots.
Supply bounded, abort-aware host uploads with server authorization and validation.
Private asset delivery needs explicit same-origin host integration. Never put tokens in media URLs.
Register MediaNode in every reader. editor-document supports validated native JSON, canonical tagged HTML, and Markdown HTML fallback.
The portable reader rejects relative URLs, credentials, and nonempty query or fragment components.
It may retain canonical ordinary-media and track URLs with empty trailing ? or #, subject to all other checks.
Private delivery still requires host authorization and a trusted URL resolver.

### Optional editor media placeholders

Install optional \`editor-media-placeholder\` separately. Import parts from \`${imports.editor}/media-placeholder\`.
Create one stable \`createEditorMediaPlaceholder({ upload })\` controller per root.
Register \`MediaExtension\` and \`createMediaPlaceholderExtension(controller)\` in a stable root extensions array.
Compose \`MediaPlaceholderInsertButton\` inside \`EditorToolbar\` and \`MediaUploadNotification\` beside \`EditorContent\`.
The native node renders file, progress, typed failure, retry, cancel, and remove controls through \`MediaPlaceholderElement\`.
Each root allows at most 16 placeholders and one active upload task.
Files require 1 byte through 16 MiB and names of at most 512 characters.
Use \`controller.configure(upload)\` when host authentication or the upload callback changes.
Document, changed non-null selection, read-only, root, and host changes invalidate work.
Cancel retains the busy slot until the task settles. Cancellation does not prove that remote storage stopped.
Retry requires an explicit action. Success replaces the placeholder with validated media.
Placeholder upload results reject literal ? and #, including empty delimiters.
JSON stores only \`type: "editor-media-placeholder"\`, \`version: 1\`, and \`uploadKind\`.
Never serialize File objects or private data. Restored placeholders need a fresh file selection.
An active upload holds a File in memory. A failed upload can retain one File for explicit retry until invalidation or cleanup. The host callback receives the File and can retain or copy it, including after settlement. Successful replacement stores the file name and URL in media JSON and tagged HTML. JSON omission does not erase memory or remote copies.
Insertion, replacement, and removal each create a separate history step.
Progress, failure, retry, and cancellation add no history steps. Undo invalidates work; redo never uploads.
No automatic upload, retry, or fetch is supplied. No file-upload paste or drop handler is supplied. The extension checks clipboard node insertion for placeholder limits and valid placement.
Keep authorization, content validation, and quotas in the host. Source workflows remain runtime-unvalidated.

### Optional whole-block selection

Install editor-block-selection separately. Import parts from \`${imports.editor}/block-selection-index\`.
Create one stable createEditorBlockSelection controller. Compose EditorBlockSelection inside EditorRoot.
Keep the wrapper mounted without a gutter. Use onKeyDown for host Escape cancellation.
Forward wrapper refs and onKeyDownCapture through custom render elements.
Same-document React portals retain wrapper ownership. Keep native composition and unowned Escape behavior.
Use the gutter and actions for keyboard movement. Keep keyboard movement available beside drag handles.
Native cut requires synchronous literal true from authorizeCut. Preserve native MIME handlers and higher-priority host cancellation.
Custom document validation must return literal true. Content, selection, and read-only changes expire saved operations.
Authorize persisted document writes separately.

### Optional footnotes and table of contents

Install each item separately:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-footnotes
bunx --bun @yopem-ui/cli add editor-toc
npx @yopem-ui/cli add editor-footnotes
npx @yopem-ui/cli add editor-toc
pnpm dlx @yopem-ui/cli add editor-footnotes
pnpm dlx @yopem-ui/cli add editor-toc
yarn dlx @yopem-ui/cli add editor-footnotes
yarn dlx @yopem-ui/cli add editor-toc
\`\`\`

Import parts from \`${imports.editor}/footnote\` and \`${imports.editor}/toc\`.
Keep EditorFootnoteExtension and EditorTocExtension in stable root extension arrays.
Compose EditorFootnoteControls or EditorTocControls inside EditorToolbar.
EditorFootnoteControls wraps its actions within the available width.
Keep compact visible labels and complete accessible action names.
EditorFootnoteTypeahead owns the editable surface.
Do not add adjacent EditorContent. Preserve repeated and unresolved references and duplicate definitions.
Renumber a selected duplicate explicitly. Do not silently rewrite identifiers.
Table-of-contents links target the current editor. Base controls do not require typeahead.
Live contents and native TOC HTML show the first 500 nonempty headings in preorder.
Titles normalize whitespace and truncate to 256 UTF-16 code units.
Portable document export uses all headings and full text, subject to document limits.
It uses canonical document-scoped IDs, not live editor-scoped IDs.
Portable HTML input requires complete canonical heading links. Native TOC HTML can fail this check.
Register feature nodes in every reader. Validate complete host documents at IO boundaries.
Document readers support validated footnotes and table-of-contents nodes.
Keep canonical heading and reference IDs intact.

### Optional editor columns and dates

Install optional source with your selected package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-columns
bunx --bun @yopem-ui/cli add editor-date
npx @yopem-ui/cli add editor-columns
npx @yopem-ui/cli add editor-date
pnpm dlx @yopem-ui/cli add editor-columns
pnpm dlx @yopem-ui/cli add editor-date
yarn dlx @yopem-ui/cli add editor-columns
yarn dlx @yopem-ui/cli add editor-date
\`\`\`

Register \`EditorColumnsExtension\` from \`${imports.editor}/columns\` and \`EditorDateExtension\` from \`${imports.editor}/date\` in stable root arrays.
Compose \`EditorColumnsControls\` and \`EditorDateControls\` inside \`EditorToolbar\`.
Use focused column insert, layout, resize, move, and remove controls when needed.
Columns contain two through four native rich-text containers. Nested column groups are not supported.
Use the house Slider for resizing. Remove deletes the group and its content.
The house Calendar inserts dates and edits native date nodes through \`EditorDateInline\`.
Store validated YYYY-MM-DD strings without timezone conversion. Use \`editorDateFromLocalDate\` for local dates.
Import pure codecs from \`${imports.editor}/columns-model\` and \`${imports.editor}/date-model\`.
Keep all copied feature and core selection helpers. Shared packages must export both feature and model subpaths.
Document readers retain validated columns and dates through canonical codecs.
Register matching live nodes before import. Never flatten unknown nodes.
Supply complete host document validation; feature validators check only their own contracts.

### Optional editor math

Install optional native TeX equations:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-math
npx @yopem-ui/cli add editor-math
pnpm dlx @yopem-ui/cli add editor-math
yarn dlx @yopem-ui/cli add editor-math
\`\`\`

Register \`EditorMathExtension\` from \`${imports.editor}/math\` in a stable extension array.
Compose \`EditorMathControls\` inside \`EditorToolbar\`.
Use \`EditorMathControl\` with an explicit kind for insertion, or no kind for editing.
Use \`EditorMathPreview\` for live MathML output.
Import pure codecs from \`${imports.editor}/math-model\`.
Keep \`data-editor-math\` and \`data-editor-tex\` in native HTML exports.
Reject unsupported math before document replacement. Host changes expire saved targets.
KaTeX uses native MathML without external stylesheets, fonts, or services.
Trust features and user macros are not supported.

### Optional editor document I/O

Install \`editor-document\` separately for JSON, HTML, Markdown, streaming, and static output.
It depends on \`editor\` and \`editor-blocks\`. Base editor installs do not include document codecs.
Import helpers from \`${imports.editor}/document\` and DocumentStatic from \`${imports.editor}/document/static\`.
DocumentStatic needs no EditorRoot. Keep every copied helper, including \`document/state.ts\` and canonical presentation codecs.
Portable HTML, Markdown, standalone, download, and DOCX exports reject paragraph-owned slots.
Use JSON for these documents. Other slot ownership cases still need validation.
Optional \`idPrefix\` has 1–64 ASCII characters. Start with an ASCII letter. Use ASCII letters, digits, underscores, or non-consecutive hyphens after it.
Invalid prefixes throw. Use the same stable prefix for server rendering and hydration.
Use a distinct prefix for each document in one owner document. Reserve generated IDs against other host markup.
Choose distinct, meaningful \`aria-label\` values for multiple documents.
A prefix changes rendered IDs and fragment targets to \`<idPrefix>--<canonical-id>\`. Update deep links when opting in.
Native fragment activation can change the URL and browser history. Changing a prefix changes its links.
Omitting \`idPrefix\` preserves canonical IDs and existing deep links, but does not isolate multiple instances.
Static prefixing does not change document data. Prefixed markup is not portable document HTML.
Keep \`@types/hast\` and \`@types/mdast\` as direct consumer dependencies.
Register EditorDocumentClipboardExtension at root creation in a stable extensions array.
Call registerDocumentPaste after creation. Keep its cleanup in the host lifecycle.
Opt in with \`{ markdown: true }\` only for validated Markdown fragments at the native caret.
Keep Lexical JSON and HTML priority. Default text/plain paste stays native.
Reject empty or unsupported fragments without removing selected content.
Register EditorBlocksExtension for live callout and toggle imports.
Invalid, stale, cancelled, and read-only imports keep current content. Streams commit once after EOF.
Register math and mention nodes before importing their representations.
Markdown supports TeX delimiters with canonical HTML fallback when required for fidelity.
Static and standalone HTML use native MathML.
Mentions use the validated identity codec.
Saved mention identities do not grant access.
Media JSON and canonical tagged figure HTML preserve native media metadata.
Markdown uses canonical HTML for media. Register MediaExtension for live rendering.
Use MediaNode in headless readers. The portable reader rejects credentials and nonempty query or fragment components.
It may retain canonical ordinary-media and track URLs with empty trailing delimiters, subject to all other checks.
Register optional feature nodes in every live reader before import.
Document readers retain footnotes, contents, columns, dates, labels, drawings, editable cards, and diagram metadata.
Optional nodes use canonical HTML fallback in Markdown. Markdown footnote input is supported.
Keep copied pure models and \`document/optional-nodes.ts\` with the document helpers.
Drawings use metadata fallback. Transient card fields are not serialized.
Review formats fail closed before document replacement.
Keep native clipboard priorities, host vetoes, and host HTML sanitization.
Host MIME handlers that consume data must validate their own output.

### Optional editor blocks

Install optional callout and toggle source with the matching package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-blocks
npx @yopem-ui/cli add editor-blocks
pnpm dlx @yopem-ui/cli add editor-blocks
yarn dlx @yopem-ui/cli add editor-blocks
\`\`\`

Register \`EditorBlocksExtension\` from \`${imports.editor}/blocks\` in a stable extension array.
Compose focused callout and toggle controls inside \`EditorToolbar\`.
Import server-safe models from \`${imports.editor}/blocks-model\`.
Validate block JSON and HTML before document replacement. Reject unsupported content without changing the current document.
Read-only disclosure changes local visibility, not saved state or history.
Keep rich toggle titles outside the native summary control. Keep title links usable when closed.
Keep the native details body, empty disclosure control, and content slot together.

### Editor AI proposals

Install optional editor-ai server source separately from editor client source.
Import server helpers from \`${imports.lib.replace(/\/stylex$/, "/editor-ai")}\` on the server only.
Compose EditorAiRoot, EditorAiTrigger, and EditorAiPanel inside EditorRoot.
Install optional \`editor-ai-menu\` separately. Import from \`${imports.editor}/ai-menu\`.
Compose EditorAiMenuRoot, EditorAiMenuTrigger, EditorAiMenuContent, and EditorAiMenuPanel inside configured EditorAiRoot.
EditorAiMenuContent owns the editable surface. Do not add EditorContent beside it.
Pass \`render={<EditorTypeahead controller={controller} />}\` to compose typeahead into the same surface.
Install editor-typeahead for this composition. Keep the controller and root extensions stable.
Compose EditorAiInlinePreview from \`${imports.editor}/ai-menu-preview\` inside EditorAiRoot for bounded escaped proposal text beside the saved range.
The preview changes no document state. Keep explicit approval controls.
The menu keeps twelve truncated chat messages until its root unmounts. Remount on document or viewer changes. No server chat storage is supplied.
Comments require the current review controller and literal-true host policy. AI permission never grants review access.
Suggest change creates an inline review suggestion from completed single-line output.
It requires current suggest permission and a valid saved range.
Accept or reject the suggestion separately. Authorize document writes separately.
Selected-text context actions respect prevented host events.
Supply synchronous markdownInsertion for optional validated Markdown approval.
Install editor-document and call $insertDocumentFragment inside the supplied update.
Return literal true only after insertion succeeds. Failed insertion keeps the proposal open.
Register required nodes before rich insertion. MDX remains literal source.
Below insertion requires a supported native block container.
Runtime acceptance remains deferred.
Supply an explicit same-origin endpoint, documentId, and current authentication and CSRF headers.
Review untrusted plain text before approval. Require explicit completion and clean EOF.
Content, format, style, non-null selection, and read-only changes invalidate proposals.
A null selection retains the saved target for dialog use. Remount EditorAiRoot when host code discards the saved target.
Approval makes one local history update. Authorize document writes separately.
Supply existing authentication, verified expiry, literal-true document policy, exact HTTPS Origin, CSRF verification, and durable quota.
AI invocation never grants document write access. Keep model selection and credentials on the server.
Never retry paid requests automatically. Keep tokens out of URLs, logs, and browser storage.
See https://ui.yopem.com/docs/editor-ai for schema and deployment limits.

### Editor authentication

Install optional server helpers with the matching package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-auth
npx @yopem-ui/cli add editor-auth
pnpm dlx @yopem-ui/cli add editor-auth
yarn dlx @yopem-ui/cli add editor-auth
\`\`\`

Import these helpers from \`${imports.lib.replace(/\/stylex$/, "/editor-auth")}\` on the server only.
Select the OpenAuth or Better Auth adapter for the host application's existing service.
OpenAuth defaults to \`https://auth.yopem.com\` and requires an explicit audience.
Better Auth uses the host session getter without refreshing sessions.
Both adapters supply verified \`credentialExpiresAt\` in Unix epoch milliseconds.
Reject expired credentials. Require verified expiry for collaboration tickets.
Do not create another account system.
Require a separate document policy. Only an explicit true result grants access.
Check trusted origins and CSRF tokens in host routes. Keep tokens out of URLs and logs.
JWT verification does not guarantee immediate revocation.
These helpers do not deploy AI, upload, persistence, or collaboration services.

### Editor document storage

Install optional document storage with the matching package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-store
npx @yopem-ui/cli add editor-store
pnpm dlx @yopem-ui/cli add editor-store
yarn dlx @yopem-ui/cli add editor-store
\`\`\`

Use optional editor-store server source for D1 or PostgreSQL snapshots.
Import it from \`${imports.lib.replace(/\/stylex$/, "/editor-store")}\` on the server only.
Apply one copied SQL migration. Supply complete Lexical validation and separate document policies, including deletion.
Keep snapshots within 1 MiB, 131072 JSON values, and 64 nested objects or arrays.
Configure exact trusted origins and host CSRF verification. Never add accounts or implicit document grants.
Retry uncertain writes with identical operation IDs, preconditions, authentication provider, and user ID.
HTTP callbacks receive cancellation through \`Request.signal\`. Storage checks deadlines before driver calls.
PostgreSQL checks remaining time before each statement.
See https://ui.yopem.com/docs/editor-store for the HTTP protocol and deployment limits.

### Editor collaboration

Install browser source with the matching package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration
npx @yopem-ui/cli add editor-collaboration
pnpm dlx @yopem-ui/cli add editor-collaboration
yarn dlx @yopem-ui/cli add editor-collaboration
\`\`\`

Import browser parts from \`${imports.editor}/collaboration\`. Keep server code out of browser imports.

Install generic server source separately:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration-server
npx @yopem-ui/cli add editor-collaboration-server
pnpm dlx @yopem-ui/cli add editor-collaboration-server
yarn dlx @yopem-ui/cli add editor-collaboration-server
\`\`\`

Import generic helpers from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}\` on the server only.

Install each required runtime item separately:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration-worker
npx @yopem-ui/cli add editor-collaboration-worker
pnpm dlx @yopem-ui/cli add editor-collaboration-worker
yarn dlx @yopem-ui/cli add editor-collaboration-worker
\`\`\`

Use the Worker item only for Durable Objects. Import its room from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-do\` in Worker code only.

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration-bun
npx @yopem-ui/cli add editor-collaboration-bun
pnpm dlx @yopem-ui/cli add editor-collaboration-bun
yarn dlx @yopem-ui/cli add editor-collaboration-bun
\`\`\`

Use the Bun item only for Bun. Import \`createBunEditorCollaborationService\` from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-bun\`. Pass its \`fetch\` and \`websocket\` handlers to \`Bun.serve\` with host TLS and connection limits.

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration-node
npx @yopem-ui/cli add editor-collaboration-node
pnpm dlx @yopem-ui/cli add editor-collaboration-node
yarn dlx @yopem-ui/cli add editor-collaboration-node
\`\`\`

Use the Node item only for Node. Import \`createNodeEditorCollaborationService\` from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-node\`. Bind its \`node:http\` server privately behind a trusted HTTPS/WSS proxy.

Keep native runtime imports out of browser and generic server barrels. Reuse host authentication with verified expiry, exact HTTPS origin, CSRF checks, literal-true document policies, real SQL transactions, and a schema-complete initializer. Keep binary document frames and bounded text readiness, delivery, and ACK controls. Recipient rechecks do not make revocation atomic with database writes. History is bounded; no automatic compaction is supplied. Do not replay uncertain offline drafts. See https://ui.yopem.com/docs/editor-collaboration for protocol and deployment limits.

### Native room grants

Install the server-only source with one package manager:

\`\`\`sh
bunx --bun @yopem-ui/cli add editor-collaboration-grants
npx @yopem-ui/cli add editor-collaboration-grants
pnpm dlx @yopem-ui/cli add editor-collaboration-grants
yarn dlx @yopem-ui/cli add editor-collaboration-grants
\`\`\`

Import \`createEditorNativeGrantsHttpHandler\` and \`EditorNativeGrantsHttpOptions\` from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-native-grants\` on the server only. Import pure grant codecs from \`${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-native-model\`.

\`\`\`ts
import { createEditorNativeGrantsHttpHandler } from "${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-native-grants"
import type { EditorNativeGrantsHttpOptions } from "${imports.lib.replace(/\/stylex$/, "/editor-collaboration")}/collaboration-native-grants"
import {
  authenticateExistingRequest,
  authorizeNativeRoom,
  hostTrustedOrigin,
  provisionNativeRoomGrant,
  verifyCsrfForRequest,
} from "./native-grant-host"

const options = {
  origin: hostTrustedOrigin,
  path: "/api/editor/native-grants",
  timeoutMs: 5000,
  maxConcurrent: 8,
  authenticate: authenticateExistingRequest,
  policy: authorizeNativeRoom,
  verifyCsrf: verifyCsrfForRequest,
  provision: provisionNativeRoomGrant,
} satisfies EditorNativeGrantsHttpOptions

export const nativeGrantHandler =
  createEditorNativeGrantsHttpHandler(options)
\`\`\`

The host module is required. The snippet is an API composition shape, not a complete endpoint or a room initializer.

Use one exact trusted HTTPS origin, POST path, and matching \`Origin\` header. Require existing authentication with verified \`credentialExpiresAt\`. Require CSRF approval and literal \`true\` from the current room policy. Preserve opaque \`userId\` bytes without normalization.

The handler reads the bounded body once. It gives each callback an isolated copy of the exact bounded bytes. The provision callback receives a bounded copy of the current request, signal, and deadline. Noncooperative callbacks keep capacity until they settle.

Initialize each room once from authoritative host state. Bind every grant to the exact room, generation, permission, and identity. Keep expiry within five minutes and at or below \`maximumCredentialExpiresAt\`. Verify each Hocuspocus credential against current host state. Returned \`seeded\` metadata does not prove durable seeding or scope enforcement.

Issue peer credentials only to writers. Configure explicit trusted WSS signaling and a nine-peer limit. Native Hocuspocus and WebRTC provide no \`editor-v1\` acknowledgements, per-frame host authorization, atomic revocation, or durability proof from sync. No account, ACL, endpoint, model, or token service is included.

Use optional editor-assets server source for private R2 or S3 assets with D1 or PostgreSQL.
Import it from \`${imports.lib.replace(/\/stylex$/, "/editor-assets")}\` on the server only.
Apply matching dialect migrations 0001, 0002, and 0003 in order.
Supply existing authentication, verified expiry, document and asset policy, exact origins, CSRF, quotas, and bounded scanners.
Reuse factory instances. Schedule cleanup and complete inventory cycles. Keep lifetime reservations and terminal probes.
Asset repositories do not receive request cancellation. PostgreSQL timeouts are per statement, not cumulative; pool waits need host limits.
D1 batches and R2 binding calls cannot be interrupted through this API. S3 fetches receive cancellation signals.
Resolve private relative routes against an explicit trusted HTTPS same-origin delivery origin.
Validate the exact document and asset route. Native media requires existing same-origin cookies.
Never put tokens in URLs or use a public bucket fallback. Keep provider credentials on the host.
Fixture validators are not production scanners. This item adds no media UI nodes or accounts.
See https://ui.yopem.com/docs/editor-assets for callback and deployment limits.

### Visual foundations

Use neutral light and dark surfaces with semantic color pairs.
Use background/foreground, primary, secondary, muted, accent, card, and popover tokens.
Use destructive, success, warning, and info tokens for status.
Do not replace semantic tokens with raw palette values when a token exists.

Use Inter for body text and headings.
Use IBM Plex Mono for code and mono text.
Font tokens specify these families. Load both fonts in the application.

Use \`tokens["--spacing"]\` for spacing. Its default is \`0.25rem\`.
Stack, VStack, and HStack use four spacing units by default.
Use radius tokens: sm \`0.5rem\`, md \`0.75rem\`, lg \`1rem\`, xl \`1.5rem\`.

### Color values

These are Yopem UI defaults from \`tokens.stylex.ts\`.
Use current token and component values when the project has overrides.
Keep the CSS color expressions intact. Transparent colors depend on the surface below them.
Use semantic tokens in styles, not these literal values.

| Token | Light value | Dark value |
| --- | --- | --- |
| \`--accent\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--accent-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--background\` | \`#fff\` | \`color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff)\` |
| \`--border\` | \`color-mix(in oklab, #000 8%, transparent)\` | \`color-mix(in oklab, #fff 6%, transparent)\` |
| \`--card\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )\` |
| \`--card-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--code\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 98%, #fff )\` |
| \`--code-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--code-highlight\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--destructive\` | \`oklch(63.7% 0.237 25.331)\` | \`color-mix(in srgb, oklch(63.7% 0.237 25.331) 90%, #fff)\` |
| \`--destructive-foreground\` | \`oklch(50.5% 0.213 27.518)\` | \`oklch(70.4% 0.191 22.216)\` |
| \`--foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--info\` | \`oklch(62.3% 0.214 259.815)\` | \`oklch(62.3% 0.214 259.815)\` |
| \`--info-foreground\` | \`oklch(48.8% 0.243 264.376)\` | \`oklch(70.7% 0.165 254.624)\` |
| \`--input\` | \`color-mix(in oklab, #000 10%, transparent)\` | \`color-mix(in oklab, #fff 8%, transparent)\` |
| \`--muted\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--muted-foreground\` | \`color-mix(in srgb, oklch(55.6% 0 none) 90%, #000)\` | \`oklch(76% 0 none)\` |
| \`--popover\` | \`#fff\` | \`color-mix( in srgb, color-mix(in srgb, oklch(14.5% 0 none) 96%, #fff) 96%, #fff )\` |
| \`--popover-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--primary\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--primary-foreground\` | \`oklch(98.5% 0 none)\` | \`oklch(26.9% 0 none)\` |
| \`--ring\` | \`oklch(70.8% 0 none)\` | \`oklch(55.6% 0 none)\` |
| \`--secondary\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--secondary-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar\` | \`oklch(98.5% 0 none)\` | \`color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff)\` |
| \`--sidebar-accent\` | \`color-mix(in oklab, #000 4%, transparent)\` | \`color-mix(in oklab, #fff 4%, transparent)\` |
| \`--sidebar-accent-foreground\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar-border\` | \`color-mix(in oklab, #000 6%, transparent)\` | \`color-mix(in oklab, #fff 5%, transparent)\` |
| \`--sidebar-foreground\` | \`color-mix( in srgb, oklch(26.9% 0 none) 64%, oklch(98.5% 0 none) )\` | \`color-mix( in srgb, oklch(97% 0 none) 64%, color-mix(in srgb, oklch(14.5% 0 none) 97%, #fff) )\` |
| \`--sidebar-primary\` | \`oklch(26.9% 0 none)\` | \`oklch(97% 0 none)\` |
| \`--sidebar-primary-foreground\` | \`oklch(98.5% 0 none)\` | \`oklch(26.9% 0 none)\` |
| \`--sidebar-ring\` | \`oklch(70.8% 0 none)\` | \`oklch(70.8% 0 none)\` |
| \`--success\` | \`oklch(69.6% 0.17 162.48)\` | \`oklch(69.6% 0.17 162.48)\` |
| \`--success-foreground\` | \`oklch(50.8% 0.118 165.612)\` | \`oklch(76.5% 0.177 163.223)\` |
| \`--warning\` | \`oklch(76.9% 0.188 70.08)\` | \`oklch(76.9% 0.188 70.08)\` |
| \`--warning-foreground\` | \`oklch(55.5% 0.163 48.998)\` | \`oklch(82.8% 0.189 84.429)\` |

### Spacing values

The default spacing unit is \`0.25rem\` (4px).
These rows are spacing multipliers, not separate tokens.
Multiply the spacing token in a StyleX \`calc()\` value.
Pixel equivalents assume a 16px root font size.
Spacing-based values change when the spacing token changes.

| Units | Default value | Pixel equivalent |
| --- | --- | --- |
| 0 | \`0rem\` | 0px |
| 0.5 | \`0.125rem\` | 2px |
| 1 | \`0.25rem\` | 4px |
| 1.5 | \`0.375rem\` | 6px |
| 2 | \`0.5rem\` | 8px |
| 3 | \`0.75rem\` | 12px |
| 4 | \`1rem\` | 16px |
| 5 | \`1.25rem\` | 20px |
| 6 | \`1.5rem\` | 24px |
| 8 | \`2rem\` | 32px |
| 10 | \`2.5rem\` | 40px |
| 12 | \`3rem\` | 48px |
| 16 | \`4rem\` | 64px |
| 20 | \`5rem\` | 80px |
| 24 | \`6rem\` | 96px |
| 32 | \`8rem\` | 128px |

Stack, VStack, and HStack gaps use four units: \`1rem\` (16px) by default.

### Typography sizes

These values describe unmodified component defaults.
Heading size follows the rendered heading level. Line height values are unitless.

| Component | Font size | Line height | Font weight |
| --- | --- | --- | --- |
| Text | \`1rem\` (16px) | \`1.5\` | 400 |
| Heading h1 | \`2.25rem\` (36px) | \`1.25\` | 600 |
| Heading h2 | \`1.5rem\` (24px) | \`1.25\` | 600 |
| Heading h3 | \`1.25rem\` (20px) | \`1.25\` | 600 |
| Heading h4 | \`1.125rem\` (18px) | \`1.25\` | 600 |
| Heading h5 | \`1rem\` (16px) | \`1.25\` | 600 |
| Heading h6 | \`0.875rem\` (14px) | \`1.25\` | 600 |

### Control sizes

The responsive breakpoint is \`640px\`.
Input heights exclude the wrapper's 1px borders.
Icon button width equals its height.

| Component size | Height below 640px | Height at 640px and above |
| --- | --- | --- |
| Button xs / icon-xs | \`1.75rem\` (28px) | \`1.5rem\` (24px) |
| Button sm / icon-sm | \`2rem\` (32px) | \`1.75rem\` (28px) |
| Button default / icon | \`2.25rem\` (36px) | \`2rem\` (32px) |
| Button lg / icon-lg | \`2.5rem\` (40px) | \`2.25rem\` (36px) |
| Button xl / icon-xl | \`2.75rem\` (44px) | \`2.5rem\` (40px) |
| Input sm | \`1.875rem\` (30px) | \`1.625rem\` (26px) |
| Input default | \`2.125rem\` (34px) | \`1.875rem\` (30px) |
| Input lg | \`2.375rem\` (38px) | \`2.125rem\` (34px) |

Default Button and Input text uses \`1rem\` (16px) below 640px and \`0.875rem\` (14px) at 640px and above.
Button xs text uses \`0.875rem\` (14px) below 640px and \`0.75rem\` (12px) at 640px and above.
Button xl text uses \`1.125rem\` (18px) below 640px and \`1rem\` (16px) at 640px and above.

A ghost Button uses the accent background when its final element has \`aria-pressed="true"\`.
The \`data-pressed\` marker also applies the accent independently. Hover and \`xstyle\` can change the background.
Supply the correct \`aria-pressed\` state for toggle actions.

Rounded components use md (12px) by default. Use xstyle to change corner radii. Use controlXstyle for Input and Textarea wrappers. Keep circular indicators and edge-attached corners intact.

### Layout and radius sizes

| Setting | Default value | Pixel equivalent |
| --- | --- | --- |
| Container maximum width | \`90rem\` | 1440px |
| Container inline padding | \`1rem\` (4 spacing units) | 16px |
| Button coarse-pointer target minimum | \`2.75rem\` | 44px |
| \`--radius\` | \`0.75rem\` | 12px |
| \`--radius-sm\` | \`0.5rem\` | 8px |
| \`--radius-md\` | \`0.75rem\` | 12px |
| \`--radius-lg\` | \`1rem\` | 16px |
| \`--radius-xl\` | \`1.5rem\` | 24px |

A fluid Container uses full width without a maximum width.

### StyleX composition

- Define local styles with \`stylex.create\` from \`@stylexjs/stylex\`.
- Compose native element styles with \`stylex.props\`.
- Use \`stylexProps\` when merging consumer \`className\` in copied components.
- Keep variants as StyleX style objects.
- Pass component customization through \`xstyle\`.
- Merge consumer \`xstyle\` after defaults and variants.
- Use \`controlXstyle\` for Input and Textarea wrappers. Use \`xstyle\` for their native controls.
- Prefer logical CSS properties, such as \`paddingInline\` and \`inlineSize\`.
- Do not add Tailwind, utility classes, \`cva\`, literal CSS class names, or authored JSX \`style\` props.
- Do not add embedded style blocks or broad SVG and descendant selectors.
- Style owned elements through explicit slots. Keep unavoidable upstream selectors in scoped compatibility CSS.
- Use Lucide icons. Keep Remix Icon only where existing code requires it.

### Layout and typography

Prefer design system primitives in application JSX, including unstyled wrappers and conditional branches.
Preserve semantic elements, native attributes, events, and ref types.

- Start with Box. Its default element is div.
- Use the Box render prop for semantic elements, such as \`render={<section />}\`.
- Use Flex for custom direction and alignment.
- Use Stack or VStack for columns. Use HStack for centered rows.
- Use Grid for columns and rows. Use Center for centering on both axes.
- Use Container for a centered fluid page up to \`90rem\`. Use \`fluid\` for full width.
- Use AbsoluteCenter inside a positioned parent.
- Use Bleed to extend into inline padding. Use Float over a parent's corner.
- Use Wrap for wrapping rows. Customize layout with \`xstyle\`.
- Use AspectRatio for a div with CSS \`aspectRatio\`. Its optional numeric \`ratio\` defaults to \`16 / 9\`.
- Nonpositive and nonfinite ratios use the default. AspectRatio does not clip or automatically size children.
- Use List for unordered lists. Use \`List render={<ol />}\` for ordered lists through Base UI \`useRender\`.
- Put native \`start\` and \`reversed\` attributes on the rendered ol.
- Use ListItem for li elements. Import List and ListItem from the same \`list\` module.
- AspectRatio, List, ListItem, Strong, and Figcaption accept \`xstyle\`, \`className\`, native attributes, events, and refs.
- Use Text for paragraphs. Use Heading for semantic headings.
- Heading defaults to h2. Use \`render={<h1 />}\` through h6 for other levels.
- Use Blockquote for quotations, Em for emphasis, Strong for importance, and Mark for marked text.
- Strong renders strong with weight 600 and inherits surrounding typography.
- Use Figcaption inside \`Box render={<figure />}\` for figure captions. There is no Figure primitive.
- Figcaption renders figcaption with muted text, \`0.875rem\` font size, and \`1.5\` line height.
- Use Highlight for matching words. Use Prose for readable long-form content.
- Use Codeblock for code displays. Its code pane accepts keyboard focus for horizontal scrolling. Its wrapper, toolbar, and internal pre cannot replace every native pre.
- Use framework links for application navigation. Native anchors remain valid for navigation and downloads.
- Keep native controls, tables, metadata, SVG, custom elements, and inline code where no equivalent applies.
- Component selection guidance does not expand the lint rule's supported native tags.
- Keep native markup inside primitive implementations. Do not wrap primitives recursively.

### Component selection

Use existing components before building substitutes. Check their documented props and slots.

- Forms: Field, Fieldset, Form, Label, Input, Textarea, InputGroup, NativeSelect, Select, Combobox, Autocomplete, NumberField, OTPField.
- Selection: Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, Toggle, ToggleGroup, Rating, Calendar.
- Actions and navigation: Button, Link, Menu, ContextMenu, Toolbar, Tabs, Breadcrumb, Pagination, Sidebar, Steps.
- Overlays: Dialog, AlertDialog, Sheet, Drawer, Popover, Tooltip, PreviewCard.
- Feedback: Alert, Toast, Badge, Progress, Meter, Spinner, Skeleton, Empty, Checkmark.
- Content: Card, Frame, Table, Avatar, Accordion, Collapsible, Separator, ScrollArea, Stat, Kbd, Clipboard, Group, Marquee.

Calendar day button labels include the visible day. Preserve consumer label and formatter overrides.
Combobox chip navigation closes open suggestions before focus moves to a chip.
If closing is cancelled, navigation does not focus a chip.
ScrollArea viewports use tabIndex=0 by default. Use viewportTabIndex={-1}
when an input owns composite keyboard navigation. ComboboxList and
AutocompleteList set this automatically. Keep standalone viewports keyboard-accessible.
Use portalProps.container for a host landmark that contains nonmodal suggestions.
Check popup position and clipping after setting the container.

### Themes and accessibility

Keep light and dark theme values complete in \`tokens.stylex.ts\`.
Keep StyleX theme object spreads in that module. Keep the theme marker and root styles intact.
Install the theme item only when theme switching is needed.
Use identical theme configuration in root props, ThemeScript, and ThemeProvider.
Use matching \`defaultTheme\` and \`storageKey\` values in the script and provider.
Pass the CSP nonce to ThemeScript when required.
Keep \`theme.tsx\` server-safe. Only \`theme-provider.tsx\` is a client entry.
Keep ThemeScript synchronous. Keep its \`data-cfasync="false"\` attribute to prevent Rocket Loader deferral.

Preserve Base UI keyboard behavior, focus management, dismissal, and disabled states.
Provide accessible names for controls. Keep visible focus styles and form labels.
Preserve reduced motion and coarse-pointer targets. Do not communicate status through color alone.
Test pointer and keyboard workflows, focus changes, and rendered accessibility states.
${end}`

  const start = content.indexOf(begin)
  const finish = content.indexOf(end)

  if (start === -1 && finish === -1) {
    const separator = content ? (content.endsWith("\n") ? "\n" : "\n\n") : ""

    return `${content}${separator}${block}\n`
  }

  if (
    start === -1 ||
    finish < start ||
    content.includes(begin, start + begin.length) ||
    content.includes(end, finish + end.length)
  ) {
    throw new Error(
      "Invalid Yopem UI guidance markers; review the selected file",
    )
  }

  return content.slice(0, start) + block + content.slice(finish + end.length)
}
