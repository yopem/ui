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
Validate saved JSON before storage or publication.
The editor provides a foundation, not full Plate feature parity.
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
Preserve the saved-range guard. Content changes and read-only transitions invalidate the target.
Install optional \`editor-editing-rules\` separately. Create one stable \`createEditorEditingRulesExtension\` per root.
Use Mod+Enter to exit the containing root block; add Shift to insert before it.
Single-paragraph modes retain one paragraph for Enter and modifier shortcuts. They do not validate arbitrary documents.
Bound plain text to 1 MiB and converted block text to 2501 lines. Rejected or converted-empty paste preserves selected content.
Keep higher-priority host handlers, IME, native Tab, and read-only behavior.
Validate external table JSON and HTML before conversion. Reject invalid updates without removing existing content.
Discard saved table selections after document content changes. Preserve resize cancellation, history, and RTL keyboard behavior.
Render checklist items as native list items with separate checkbox controls.
Keep native list semantics, keyboard input, history, and read-only behavior.
Reject empty rich clipboard insertions without removing selected content.
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
Set \`viewer\` from a verified host identity. Require synchronous \`can(action, targetId, viewer)\` and literal \`true\` for each allowed action.
Serialized author IDs are attribution only. They do not grant access. Check every action again on the server before saving.
\`visible=false\` hides review UI. It does not redact or delete review state. Review permission does not grant document writes.
Review state uses root NodeState \`yopemReview\` and text NodeState \`yopemSuggestion\`. Use \`parseReviewDocument\` at IO boundaries.
The review extension registers \`MarkNode\` in its editor. Register \`MarkNode\` in every external reader that loads review data.
Suggestions cover inline text. The diff control changes one paragraph, up to 2048 graphemes and 4096 UTF-16 units. Structural suggestions are not supported.
Paste inserts plain text only. Rich HTML paste is rejected. Pasted review metadata is not preserved. \`editor-document\` does not import review formats.
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
MediaContent renders validated media without EditorRoot. Use HTTPS URLs without credentials.
Keep native playback, file links, and iframe controls usable in read-only roots.
Supply bounded, abort-aware host uploads with server authorization and validation.
Private asset delivery needs explicit same-origin host integration. Never put tokens in media URLs.
Register MediaNode in every reader. editor-document supports validated native JSON, canonical tagged HTML, and Markdown HTML fallback.
Conversion rejects relative URLs, URL credentials, queries, and fragments. Private delivery still requires host authorization and a trusted URL resolver.

### Optional whole-block selection

Install editor-block-selection separately. Import parts from \`${imports.editor}/block-selection-index\`.
Create one stable createEditorBlockSelection controller. Compose EditorBlockSelection inside EditorRoot.
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
Compose EditorFootnoteControls or EditorTocControls inside EditorToolbar. EditorFootnoteTypeahead owns the editable surface.
Do not add adjacent EditorContent. Preserve repeated and unresolved references and duplicate definitions.
Renumber a selected duplicate explicitly. Do not silently rewrite identifiers.
Table-of-contents links target the current editor. Base controls do not require typeahead.
Register feature nodes in every reader. Validate complete host documents at IO boundaries.
Generic editor-document conversion does not yet support footnotes or table-of-contents nodes.

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
Generic document converters do not support columns or dates. Never flatten these nodes silently.
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
Keep \`@types/hast\` as a direct consumer dependency.
Register EditorDocumentClipboardExtension at root creation in a stable extensions array.
Call registerDocumentPaste after creation. Keep its cleanup in the host lifecycle.
Register EditorBlocksExtension for live callout and toggle imports.
Invalid, stale, cancelled, and read-only imports keep current content. Streams commit once after EOF.
Register math and mention nodes before importing their representations.
Markdown supports TeX delimiters with canonical HTML fallback when required for fidelity.
Static and standalone HTML use native MathML.
Mentions use the validated identity codec.
Saved mention identities do not grant access.
Media JSON and canonical tagged figure HTML preserve native media metadata.
Markdown uses canonical HTML for media. Register MediaExtension for live rendering.
Use MediaNode in headless readers. Reject media URL credentials, queries, and fragments.
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
