// These notes describe Yopem's composition choices, not only the upstream types.
const usageNoteValues = {
  "editor-list-presentation": [
    "Register EditorListPresentationExtension in a stable root extensions array.",
    "Compose marker and signed-start controls inside EditorToolbar. Saved selections expire after document changes.",
    "Markers affect one native list. Nested lists keep their own markers. Checklists do not use custom markers.",
    "Keep yopemListMarker NodeState, data-editor-list-marker, and native ol start attributes in compatible readers.",
  ],
  "editor-editable-card": [
    "Register one stable EditorEditableCardExtension per root. Compose EditorEditableCardInsertButton inside EditorToolbar.",
    "Cards use native inputs, radio controls, and a separate nested editor. Browser Tab order remains native.",
    "JSON stores only type and version. Local fields and nested content are transient. Removal, import, and undo restoration reset them.",
    "Outer read-only state disables local controls. Generic document conversion does not support card nodes. Runtime checks remain pending.",
  ],
  "editor-docx": [
    "Install this optional item for bounded native Word document conversion.",
    "Compose EditorDocxImportControl, EditorDocxExportControl, or EditorDocxControls inside EditorRoot. Keep portable functions separate from client controls.",
    "Files have independent 1 MiB archive and decoded-data limits. Archives have at most 128 entries. XML has bounded depth and node counts.",
    "Imports validate before replacing current content. Supply an AbortSignal for host cancellation. Read-only or stale targets reject imports.",
    "This implementation supports a semantic subset, not complete Word layout. Unsupported images, macros, headers, footers, and other content reject. Runtime and real-file fidelity checks remain pending.",
    "Native deflate decompression must be available. Cancellation cannot stop synchronous parsing already in progress.",
  ],
  "editor-block-selection": [
    "Create one stable controller. Render EditorBlockSelection inside EditorRoot. Select and move top-level blocks with the gutter, drag handles, or keyboard actions.",
    "Native cut requires synchronous literal-true host approval. Preserve native MIME export and higher-priority host cancellation. Document validation must also return literal true.",
    "Content, selection, and read-only changes expire saved operations. Keep host authorization for persisted writes. Validate custom document schemas before local mutations.",
  ],
  "editor-block-placeholder": [
    "Mount one EditorBlockPlaceholder beside EditorContent inside EditorRoot. Labels are fixed until unmount; remount to replace them.",
    "Only focused, editable, empty top-level elements receive hints. Heading keys use h1 through h6. Other keys use native node type names. Empty labels disable a hint.",
    "Labels have a 64-entry limit, 64-character keys, and 512-character values. Placeholder text stays outside native nodes and exported content. A separate live status announces its label.",
    "Blur, read-only transitions, layer removal, and root cleanup clear owned DOM hints. Native focus, history, serialization, screen-reader and visual behavior remain runtime-unverified.",
  ],
  "editor-block-behavior": [
    "Register EditorBlockBehaviorExtension once in the stable root extensions array. A collapsed heading Enter makes the new half a paragraph. Converted paragraphs retain serialized node state.",
    "The handler uses LOW priority. Higher-priority host handlers can preempt it. Read-only, composition, expanded selections, and other block types retain native handlers.",
    "This is not a replacement rule engine. Native nested quote, list, code, link, void, history, and arrow-affinity behavior remain runtime-unverified.",
  ],
  "editor-labels": [
    "Create a stable labels extension with one through 64 unique bounded options. Label editors admit up to ten tokens. Apply the host minimum count separately.",
    "Replace only a label-only paragraph. Existing unrelated content makes replacement fail without removal. Unknown, duplicate, and excess valid tokens become text; malformed token metadata rejects.",
    "Use EditorLabelsPicker as the checkbox preset. Compose EditorLabelsOption inside CheckboxGroup for custom options. Register EditorLabelNode in every reader. Pure codecs do not validate complete documents or grant access.",
    "Generic document conversion does not support label tokens. Native clipboard, normalization, history, read-only behavior, and reader validation remain runtime-unverified.",
  ],
  "editor-autoformat": [
    "Register EditorAutoformatExtension in the stable root extension array. It adds non-base transformers without duplicating the base Markdown registration.",
    "Type [ ] plus Space for a checklist, two through six > prefixes plus Space for nested quotes, and --- plus Enter for a horizontal rule. Text rules include smart quotes, arrows, comparisons, legal symbols, fractions, and Unicode script characters.",
    "Fraction shortcuts require a word boundary. Guillemet shortcuts require preceding text or whitespace to retain line-start nested quote syntax. Code retains literal text. Overlapping input rules, IME, history, clipboard, and readonly behavior remain runtime-unverified.",
  ],
  "editor-editing-rules": [
    "Create the extension once per root. Preserve higher-priority host keyboard and clipboard handlers. Tab behavior remains native.",
    "Exit-break requires a collapsed editable range. Single-paragraph modes keep Enter and modifier shortcuts within that paragraph. Other document shapes keep native behavior without flattening.",
    "Plain text is limited to 1 MiB and converted block text to 2501 lines. Rich, non-text, oversized and converted-empty paste preserves selected content. Single-line mode removes new pasted line breaks, not existing content.",
    "This extension is not a complete document validator. Native paste, history, IME, nested boundaries, read-only behavior and accessibility still need deferred runtime checks.",
  ],
  "editor-floating-toolbar": [
    "Install editor-floating-toolbar separately. Compose EditorFloatingToolbar inside EditorRoot beside EditorContent. Use existing editor controls as children.",
    "Select text to open the non-modal toolbar. Press Alt+F10 to focus the first enabled control. Escape returns keyboard focus to the editor.",
    "Document changes, collapsed ranges, and read-only transitions invalidate the target. Native focus, nested popups, pointer selection, collision geometry, and cleanup require deferred runtime validation.",
  ],
  "editor-search": [
    "Install editor-search separately. Compose its root inside EditorRoot and place EditorContent inside EditorSearchViewport.",
    "Queries use at most 64 Unicode code points. Search returns at most 200 overlapping matches within individual TextNodes. Matches do not cross styled node boundaries.",
    "Search uses transient range overlays. It does not replace text or change saved content. Use the pure search-model module outside React. Document-size scanning, focus, read-only navigation, and geometry still need runtime validation.",
  ],
  "editor-csv": [
    "Register EditorCsvExtension in a stable root extension array. Native Lexical JSON and HTML keep clipboard priority. HIGH and CRITICAL host handlers keep control.",
    "Use pasteTsv:false on EditorTablePresentationExtension when CSV owns tab-containing input. This keeps native table geometry and HTML validation active.",
    "CSV input is limited to 1 MiB, 50 rows, 50 columns, and 2500 cells. Reject malformed quotes and unequal row widths before document replacement.",
  ],
  "editor-toc": [
    "Register EditorTocExtension in a stable root extension array. Compose controls inside EditorToolbar. Entries follow current document headings.",
    "Navigation stays within the current editor. Register EditorTocNode in host readers. Generic editor-document conversion does not support table-of-contents nodes.",
  ],
  "editor-footnotes": [
    "Register EditorFootnoteExtension in a stable root extension array. Keep rich definitions and references in the native document. Compose controls inside EditorToolbar.",
    "The optional typeahead owns the editable surface. Keep its controller stable until unmount. Do not add EditorContent beside EditorFootnoteTypeahead.",
    "Register footnote nodes in every host reader. Validate complete documents before replacement. Generic editor-document conversion does not support footnotes.",
  ],
  "editor-media": [
    "Register MediaExtension in a stable extensions array. Compose MediaInsertControl inside EditorToolbar. MediaContent can render validated media without EditorRoot.",
    "Use HTTPS URLs without credentials. Provide image alt text and media captions. Provider embeds use exact supported hosts and canonical URLs.",
    "Supply a bounded, abort-aware host upload callback. Uploads require host authorization and validation. This item does not configure private asset delivery.",
    "Register MediaNode in every document reader. Document conversion preserves canonical media metadata and tagged figure HTML. Media conversion rejects URL queries and fragments.",
  ],
  "editor-columns": [
    "Register EditorColumnsExtension in a stable extensions array. Compose the preset or focused controls inside EditorToolbar. Layouts contain two through four rich-text columns. Nested column groups are rejected; nested rich blocks remain native.",
    "Resize adjacent columns with the house Slider. Keep native selection, history, cancellation, and read-only behavior. Import pure validation and fragment codecs from columns-model.",
    "Generic editor-document converters do not support columns. Do not flatten column content during conversion. Validate complete host documents before replacement.",
  ],
  "editor-date": [
    "Register EditorDateExtension in a stable extensions array. Compose EditorDateControls or EditorDateInsertControl inside EditorToolbar. EditorDateNode renders EditorDateInline for calendar editing.",
    "Store YYYY-MM-DD calendar dates, not timestamps. Use date-model for pure validation and calendar conversion. Do not use UTC conversion for local calendar dates.",
    "Generic editor-document converters do not support date nodes. Do not flatten date content during conversion. Validate host HTML before native import.",
  ],
  "editor-code-format": [
    "Install this item only for the optional Prettier adapter. Base editor-code does not require Prettier. Repository formatting still uses Oxfmt.",
    "Pass prettierEditorCodeFormatter through the formatter prop. Supported formatting parsers are a subset of the syntax inventory. Cancellation cannot stop synchronous parsing.",
  ],
  "editor-document": [
    "Plain horizontalrule JSON, hr HTML, and Markdown thematic breaks are supported by reader source. Register HorizontalRuleExtension for live imports. Rules require block containers; unsupported rule presentation rejects instead of being discarded. DocumentStatic uses the house Separator. Runtime validation remains deferred.",
    "Use registerDocumentPaste with { markdown: true } only for opt-in validated Markdown fragments at the native caret. Lexical JSON and HTML retain priority. Default text/plain paste stays native. Empty or unsupported fragments keep selected content.",
    "Register EditorDocumentClipboardExtension at root creation in a stable extensions array. Call registerDocumentPaste after creation and keep its cleanup in the host lifecycle. Duplicate registrations fail.",
    "Use the document subpath for validated JSON, HTML, and Markdown. Import DocumentStatic from document/static separately.",
    "Custom headless editors use documentNodes. Imports verify the parsed target before replacing the document.",
    "Links retain safe relations and use _self or _blank targets. The codec rejects opener relations.",
    "Standalone color variables require mounted theme context and an opaque host surface. Partially transparent surfaces and context-relative color variables fail. Fonts use local fallbacks.",
    "Document limits are independent: 1 MiB UTF-8, depth 64, 65,536 structures, 50 rows, 50 columns, and 2,500 table slots.",
    "Preserve row-height metadata and supported NodeState. Streams commit only at EOF; failed or stale imports keep current content.",
    "Register math, mention, and media nodes before import. Media Markdown uses canonical tagged HTML. Review formats remain unsupported and fail before replacement.",
    "These formats require canonical codecs and registered readers. Plain text and ordinary strikethrough do not carry these semantics.",
    "Persisted code-view booleans require JSON; HTML and Markdown report diagnostics.",
    "Markdown uses HTML fallback to retain whitespace. Use JSON for native text with carriage returns or invalid HTML characters. JSON escapes retain these values in metadata.",
    "Install editor-document separately. It includes editor and editor-blocks without a circular dependency.",
    "Register EditorBlocksExtension for live callouts and toggles. Keep canonical appearance, icon, summary, body, and open state.",
    "Empty fragments yield every 256 frames. Supply cancellation for unbounded producers; no chunk or deadline limit applies.",
    "Canonical table and block validators keep separate 10000-node budgets. Storage separately counts up to 131072 JSON values.",
  ],
  "editor-typeahead": [
    "Use EditorInlineCombobox with Input, Content, List, Item, Empty, Status, Group, GroupLabel, and Row parts. EditorInlineComboboxInput renders EditorContent. Do not add a second query input. Keep every current item in controller order. Read state with useEditorInlineCombobox. Compose EditorEmojiPopover, EditorEmojiToolbarButton, EditorEmojiPopoverContent, and EditorEmojiPicker inside EditorToolbar. EditorEmojiPicker is the panel. EditorEmojiMenu is the complete toolbar preset. Compose EditorEmojiSearch, EditorEmojiCategory, EditorEmojiList, EditorEmojiItem, EditorEmojiEmpty, EditorEmojiPrevious, EditorEmojiNext, and EditorEmojiClearHistory. Read picker state with useEditorEmojiPicker. Keep inventory, filter, and history stable until unmount. ",
    "Keep one stable controller and mount-time extension array per root. EditorTypeahead renders the editable surface and suggestions. Do not add EditorContent beside this preset. Compose EditorEmojiMenu inside EditorToolbar.",
    "Supply a bounded, abort-aware host mention loader. Missing loaders disable mention queries. Identities do not grant access.",
    "Register MentionNode in every reader. Use pure mention-codec helpers for IO. Register Markdown conversion explicitly and keep HTML sanitization.",
    "Emoji search uses the complete published English emojibase-data inventory and skin variants. Hosts can supply validated single-grapheme inventories.",
  ],
  editor: [
    "Compose EditorAiRoot, EditorAiTrigger, and EditorAiPanel inside EditorRoot. Supply explicit same-origin endpoint, documentId, and host headers. Review untrusted text before approval. Stale or failed proposals cannot apply.",
    "Use public style controls inside EditorRoot and EditorToolbar. Register EditorBlockPresentationExtension in a stable mount-time array, including read-only roots.",
    "Use EditorIndentButton for block indentation and EditorFirstLineIndentControl for first-line indentation. Line height accepts unitless 1 through 4. First-line indent accepts nonnegative values through 160px or 10em/rem.",
    "Import pure codecs from @/components/editor/block-presentation. Pass the editorBlockPresentation NodeState payload to parseEditorBlockPresentation. JSON and HTML preserve validated block styles. Keep host HTML sanitization.",
    "Clear formatting keeps content, links, list nesting, table structure, and unrelated NodeState. Saved style selections expire after content changes.",
    "Use Editor for the preset. Compose EditorRoot, EditorToolbar, EditorContent, and individual controls for custom interfaces. Import all parts from @/components/editor. Each root keeps separate state and history.",
    "Import Editor from @/components/editor. Keep all editor files together. Generic UI components stay in components/ui.",
    "Use ariaLabel for an accessible name. Use initialState for initial Lexical JSON and onChange for content updates. Remount to load another document.",
    "Set editable to false for read-only content. Validate saved JSON before storage or publication. Keep Lexical packages on one compatible version.",
    "Use xstyle, className, refs, and native attributes on Editor and EditorRoot. Link controls discard saved ranges after document content changes.",
    "Use EditorTableMenu for row, column, header, merge, and split actions. Register EditorTablePresentationExtension for bounded tables and persisted cell presentation. Add EditorTableDimensions, EditorTableCellPresentation, and EditorTableResizeControls inside EditorRoot. Use EditorTableBackgroundControls and EditorTableBorderControls separately when needed. Border controls support logical edges and rectangle actions. Shared merged edges are indivisible. Row resizing stores minimum height. Content can make rows taller.",
    "Set disableMerge:true at mount time to block house merge actions. Existing spans remain. Explicit splitting stays available. Native host mutations bypass this policy.",
    "Validate external table JSON and HTML before conversion. Tables support 50 rows, 50 columns, and 2500 covered cells across the document. Invalid updates preserve existing content. Saved table selections become invalid after document changes.",
    "The base editor provides core editing, not full Plate feature parity. Keep collaboration, media uploads, review, and document conversion in separate optional integrations. Install editor-document for supported conversion.",
  ],
  "editor-math": [
    "Register EditorMathExtension before insertion. Native MathML requires no CSS or font assets. Import pure codecs from math-model. Validate host HTML before import. TeX is bounded to 4096 characters; trust features and macros are not supported.",
  ],
  "editor-blocks": [
    "Register EditorBlocksExtension in a stable extensions array. Compose focused controls inside EditorToolbar. Import server-safe models from @/components/editor/blocks-model. Validate JSON and HTML before document replacement. Read-only disclosure changes local visibility only.",
  ],
  "editor-code": [
    "Add EditorCodeExtension to EditorRoot extensions. Import optional code parts from @/components/editor/code. Keep EditorContent as the native editable surface.",
    "Use EditorCode for the toolbar preset. Compose EditorCodeLanguage, EditorCodeFormatButton, EditorCodeCopyButton, EditorCodeToggle, and EditorCodeStatus inside EditorCodeToolbar.",
    "Formatting needs an explicit EditorCodeFormatter. Unconfigured controls render nothing. Install editor-code-format only for the optional Prettier adapter. Stale, cancelled, and read-only results cannot replace code.",
    "Select one code block before using its controls. Document changes without an active code selection clear the target. Controls never restore saved ranges.",
    "Language choices use installed Prism grammars. Unknown imported languages remain unchanged. Unspecified code has no syntax colors.",
    "Line numbers and wrapping are separate view choices. Each choice turns the other off. Lexical JSON stores both choices; HTML and Markdown keep native code output.",
    "Tab indents code. Shift+Tab removes indentation. Outdent also removes up to two leading spaces. Native Enter keeps indentation; two empty final lines permit an exit on the next Enter. Escape has no code-specific action.",
    "Copy uses the host clipboard. EditorCodeStatus reports success or an error. Copy remains available in read-only mode. Mutation controls require an editable editor.",
  ],
  "editor-collaboration": [
    "Connect Lexical/Yjs editing to configured host services. Keep one stable controller and extension per root.",
    "Supply same-origin ticket and secure socket routes. Authentication does not grant document access.",
    "Connection state and host read-only state both control editing. Discarded local drafts require explicit host action.",
    "Use the custom editor-v1 transport. This protocol is not compatible with y-websocket.",
  ],
  "editor-collaboration-server": [
    "Import generic server helpers from @/lib/editor-collaboration. Supply existing authentication and separate document policies.",
    "Apply the PostgreSQL snapshot, collaboration, and runtime migrations in order. Supply a disposable schema-complete initializer.",
    "Require verified expiry, exact HTTPS origins, CSRF checks, and literal true from document policies.",
    "Retain generation and receipt records. Host transaction fences must control immediate revocation. History has fixed bounds without compaction.",
  ],
  "editor-collaboration-worker": [
    "Install this item separately for Durable Objects. Import the Worker adapter only in Worker server code.",
    "Apply the D1 snapshot and canonical-guard migrations. Route each document to one stable Durable Object name.",
    "Persist updates before delivery. Supply complete document validation, host authorization, and decoder execution limits.",
    "Online reset and generation replacement are not supported. Use a separate offline migration process.",
  ],
  "editor-collaboration-bun": [
    "Import the Bun adapter from @/lib/editor-collaboration/collaboration-bun. Supply configured server options and trusted HTTPS termination.",
    "Keep this entry outside browser and generic server bundles. Native disconnect and backpressure behavior require runtime checks.",
  ],
  "editor-collaboration-node": [
    "Import the Node adapter from @/lib/editor-collaboration/collaboration-node. Keep its listener private behind a trusted TLS proxy.",
    "Supply existing authentication, exact origins, CSRF verification, and document policies. Keep tokens outside socket URLs and logs.",
  ],
  "editor-store": [
    "Import server helpers from @/lib/editor-store. Apply one copied SQL migration for D1 or PostgreSQL.",
    "Supply existing authentication, separate document policies, complete Lexical validation, exact origins, and host CSRF verification. No account or ACL service is included.",
    "Use exact ETags and stable operation IDs. Retry uncertain writes with identical inputs. Receipts can return historical results.",
    "Keep generation records, receipts, and tombstones. Supply host quotas and backups. PGlite tests do not prove PostgreSQL TCP or Hyperdrive behavior.",
  ],
  "editor-ai": [
    "Keep this entry server-only. Supply a host-selected model and credentials. AI invocation never grants document write access.",
    "Require existing authentication, a literal-true document policy, exact HTTPS Origin, CSRF verification, verified credential expiry, and durable quota reservation. Never retry paid requests automatically.",
  ],
  "editor-assets": [
    "Import @/lib/editor-assets on the server only. Apply matching dialect migrations in order.",
    "Supply existing authentication, verified expiry, document and asset policy, CSRF, exact origins, quotas, bounded scanners, and scheduled cleanup.",
    "Resolve private relative routes against a trusted HTTPS same-origin delivery origin. Native media needs existing cookie authentication. Never put tokens in URLs.",
    "Keep terminal probes and lifetime reservations. Fixture validators do not prove production scanning. See /docs/editor-assets.",
  ],
  "editor-review": [
    "Install editor-review separately. Use EditorReviewPreset for a complete editor. For custom composition, create one controller per root and add its extension to the stable root extension list.",
    "Place EditorReviewProvider inside EditorRoot. EditorReviewRichComposer creates its own root. EditorReviewRichContent renders validated content without an EditorRoot.",
    "Set viewer from verified host identity. Serialized author IDs are attribution only and do not grant access. Check each action and target on the server.",
    "Host can is synchronous. Allow an action only when policy returns literal true. visible=false hides review UI; it does not redact or delete state.",
    "Review data uses root NodeState yopemReview and text NodeState yopemSuggestion. Use parseReviewDocument at IO boundaries. Register MarkNode in every reader that loads review state.",
    "Untrusted JSON with trusted=false loses review metadata and MarkNode wrappers but keeps ordinary text and unrelated NodeState. Set trusted=true only after host verification.",
    "Suggestions cover inline text. The diff control changes one paragraph, up to 2048 graphemes and 4096 UTF-16 units. Structural changes are unsupported.",
    "Paste inserts plain text only. Rich HTML paste is rejected. Pasted review metadata is not preserved. editor-document does not read review formats.",
  ],
  "editor-auth": [
    "Import server helpers from @/lib/editor-auth. Keep them outside browser components. Use an existing OpenAuth or Better Auth service.",
    "Use createOpenAuthAuthentication with an explicit audience. The default issuer is https://auth.yopem.com. Identity uses properties.id, not the mutable subject hash.",
    "Pass the existing session getter to createBetterAuthAuthentication. The adapter disables cookie caching. The host controls session storage and cookie refresh.",
    "Call authorizeEditorRequest with a separate document policy. Only an explicit true result grants access. Check route origins and CSRF tokens separately.",
    "JWT verification does not guarantee immediate revocation. These helpers do not deploy AI, upload, persistence, or collaboration services.",
  ],
  "use-event-callback": [
    "The returned function keeps its identity. It calls the latest committed callback. Arguments, return values, promises, and errors do not change.",
    "Use it only for event handlers and effect callbacks. Do not call it during render. A call before the first commit throws an error. Insertion effects publish updates. Aborted renders do not replace the committed callback.",
  ],
  "use-media-query": [
    "Pass a named breakpoint, max-md, a range such as sm:max-lg, or a raw CSS media query. Named breakpoint widths in pixels: sm=640, md=800, lg=1024, xl=1280, 2xl=1536, 3xl=1600, and 4xl=2000.",
    "Object queries accept min, max, and pointer (coarse or fine). Minimum widths are inclusive. Maximum widths are exclusive. Server snapshots return false. matchMedia change listeners update the client. They unsubscribe when the component unmounts or the query changes.",
  ],
  base: [
    "Rounded surfaces use md (12px). Use xstyle to change corner radii. Use controlXstyle for Input and Textarea wrappers. Circular indicators keep their shape.",
    "Copy the base files. Configure StyleX in your bundler. Import styles/styles.css once. Native StyleX tokens provide light defaults. You do not need a provider, script, or font package.",
    "Change tokens in tokens.stylex.ts. Create complete light and dark themes in that file. The optional theme item saves light, dark, and system preferences. styles.css contains reset, reduced-motion policy, and required upstream viewport rules. It does not contain theme values.",
    "The documentation copies components into src/components/ui and uses the standard @/* alias for src. Keep this alias in TypeScript, your bundler, and StyleX.",
    "Create local styles with stylex.create. Apply them through xstyle after component defaults and variants. Use className for external CSS integration.",
  ],
  theme: [
    "Install base first. Copy the two optional theme runtime files and their use-event-callback hook dependency. Pass the same configuration to ThemeProvider, ThemeScript, and getRootThemeProps.",
    "Create custom themes with StyleX in tokens.stylex.ts. Call createThemeConfig in your existing root layout. You do not need another configuration file. Use the same storageKey and defaultTheme in the provider and initial-paint script.",
    'ThemeScript must run before the first paint. Its data-cfasync="false" attribute prevents Cloudflare Rocket Loader from deferring theme selection.',
  ],
  spinner: [
    "Use Spinner beside a loading label or inside a pending action.",
    "Keep a text status available to assistive technology. A spinner alone does not explain what is loading.",
  ],
  button: [
    'Use Button for an action. Set type="submit" inside a form when it should submit.',
    "loading displays Spinner and disables the native button. Use an accessible label for icon-only sizes. Use render with a link for navigation. Custom elements must block disabled interaction themselves. An anchor does not honor the disabled attribute.",
  ],
  alert: [
    "Compose AlertTitle and AlertDescription inside Alert. Add AlertAction when the message needs a nearby action.",
    'Choose variant to communicate status, but include the status in text too. The root uses role="alert", so reserve it for messages that should be announced.',
  ],
  avatar: [
    "Place AvatarImage and AvatarFallback inside Avatar.",
    "Give the image useful alt text. The fallback can show initials when the image cannot load.",
  ],
  badge: [
    "Use Badge for short status text or a count.",
    "variant controls color and size controls spacing. Use render to change the element when the badge is also a link.",
  ],
  breadcrumb: [
    "Compose BreadcrumbList with BreadcrumbItem, BreadcrumbLink and BreadcrumbSeparator inside Breadcrumb.",
    "Use BreadcrumbPage for the current page. BreadcrumbEllipsis indicates hidden ancestor pages. Provide an interactive control if users must open those pages.",
  ],
  card: [
    "Compose CardHeader, CardTitle, CardDescription, CardPanel and CardFooter inside Card.",
    "CardContent is an alias for CardPanel. Use separator on CardHeader or CardFooter to add a divider and matching spacing. CardFrame parts add an outer frame.",
  ],
  empty: [
    "Use EmptyHeader with EmptyMedia, EmptyTitle and EmptyDescription, followed by EmptyContent for recovery actions.",
    'Explain why the view is empty and offer a next step. EmptyMedia variant="icon" adds a container for an icon.',
  ],
  frame: [
    "Use Frame to group FramePanel sections with a shared FrameHeader and FrameFooter.",
    "FrameTitle and FrameDescription label the group. Keep interactive controls inside the panels rather than making the entire frame clickable.",
  ],
  "aspect-ratio": [
    "AspectRatio renders a full-width div with native CSS aspect-ratio. The default ratio is 16/9. Nonpositive and nonfinite ratios use the default. Content is not clipped. Use xstyle to override the ratio or width.",
  ],
  list: [
    "List renders ul by default. Use render={<ol />} for an ordered list. Compose ListItem children inside either list. Native ordered-list attributes include start, reversed, and type. ListItem supports value. Native attributes, events, refs, className, and xstyle remain available.",
    "List supplies markers, zero margins, and six spacing units of inline-start padding. ListItem adds no visual defaults. Use xstyle to change list spacing or markers.",
  ],
  strong: [
    "Strong renders native strong text for semantic importance. It inherits surrounding typography and color, with weight 600. Use xstyle to override these defaults.",
  ],
  figcaption: [
    "Place Figcaption first or last inside a native figure. It uses the muted foreground and sans font tokens, 0.875rem text, 1.5 line height, and zero margins. Use xstyle to override these defaults.",
  ],
  box: [
    "Start with Box for generic containers. It renders a div by default. The global reset sets border-box sizing and zero minimum inline size. It adds no padding, border, or background. Use an element or callback with the Base UI render prop for composition. Put element-specific attributes, handlers, and refs on the rendered element.",
    "Use xstyle for StyleX overrides and className for external CSS integration. Native attributes and refs follow the selected tag, including input size, image dimensions, and meta content.",
  ],
  flex: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Flex renders a div with display:flex. Customize direction, alignment, and gap with xstyle.",
  ],
  vstack: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "VStack renders a div with centered items, column direction, and a default gap of four spacing units. Override through xstyle.",
  ],
  hstack: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "HStack renders a div with centered items, row direction, and a default gap of four spacing units. Override through xstyle.",
  ],
  stack: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Stack renders a div with column direction and a default gap of four spacing units. Override through xstyle.",
  ],
  grid: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Grid renders a div with display:grid. Set columns and gaps through xstyle.",
  ],
  center: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Center renders a div with flex layout centered on both axes. Override through xstyle.",
  ],
  container: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Container centers page content. It sets a 90rem maximum inline size and four spacing units of horizontal padding. Use fluid to remove the width limit. Use xstyle to change maximum width and padding.",
  ],
  "absolute-center": [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Position an ancestor before placing AbsoluteCenter inside it. Set axis to horizontal or vertical to center along one dimension only.",
  ],
  bleed: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Place Bleed inside a padded region to extend content to its inline edges. Use Container instead of Bleed for a page-width wrapper.",
  ],
  float: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Position the parent. Use Float to place a badge or action over one corner. Keep interactive content accessible from the keyboard.",
  ],
  wrap: [
    "The global reset sets border-box sizing and zero minimum inline size. Consumer xstyle overrides these defaults.",
    "Wrap uses flex rows that wrap automatically. Set gap through xstyle rather than adding spacing to every child.",
  ],
  link: [
    'Link renders a native anchor with href, events, ref, and keyboard behavior. With TanStack Router, use render={<RouterLink to="/path" />}. With Next.js, use render={<NextLink href="/path" />}. The framework then handles navigation. Both router components must render an anchor.',
  ],
  text: [
    "Text renders a native p with the sans font token and foreground color token. It uses 1rem text, normal weight, 1.5 line height, and zero margins. Use xstyle to override these defaults.",
  ],
  blockquote: [
    "Blockquote uses the sans font token and 1rem text. It keeps its muted color, italic style, border, and spacing. Use Blockquote for quoted passages, not for indentation. Supply a citation in surrounding content when needed.",
  ],
  em: [
    "Em inherits font size, font family, weight, and line height. It adds semantic stress emphasis. Use it for meaning rather than visual italics alone.",
  ],
  highlight: [
    "Highlight inherits surrounding typography and uses the foreground color token. It marks matching text segments. Keep the original text readable when there are no matches.",
  ],
  mark: [
    "Mark inherits surrounding typography and uses accent color tokens. It highlights text relevant to the current context. It does not replace an accessible status message.",
  ],
  prose: [
    "Prose uses the sans font token, foreground color token, 1rem text, and 1.7 line height. It supplies a readable width for long-form content. Compose semantic headings, paragraphs and lists inside it.",
  ],
  codeblock: [
    "Codeblock preserves code whitespace and allows horizontal scrolling. Its code pane accepts keyboard focus. Supply a language label outside the block when context is not obvious.",
  ],
  heading: [
    "Heading renders h2 by default. It uses the heading font token and foreground color token. Default sizes are h1 2.25rem, h2 1.5rem, h3 1.25rem, h4 1.125rem, h5 1rem, and h6 0.875rem. Other defaults are weight 600, 1.25 line height, -0.025em letter spacing, and zero margins. Use render={<h1 />} through render={<h6 />} to select semantic levels. The Base UI render prop also supports callbacks and custom components. Sizes follow the rendered native heading tag, including callbacks and custom components. Other rendered tags use the h2 size. Use xstyle to override the size.",
  ],
  checkmark: [
    "Checkmark is decorative and hidden from assistive technology. Include text that communicates success or selection beside it.",
  ],
  clipboard: [
    "Supply the value to copy. The button reports success or failure to assistive technology and never submits its parent form by default.",
  ],
  marquee: [
    "Marquee provides a pause control and stops animating with reduced motion. Do not put essential controls in moving content.",
  ],
  "native-select": [
    "Use NativeSelect with a visible label and native option elements. Choose it when custom popup behavior is unnecessary.",
  ],
  rating: [
    "Rating uses Base UI radio controls with arrow-key selection. Supply an accessible group label and use value or defaultValue with onValueChange.",
  ],
  stat: [
    "Compose StatLabel, StatValue and optional StatDescription inside Stat. The definition list keeps values paired with their labels.",
  ],
  steps: [
    "Compose StepsItem inside Steps in process order. Set status=current for the active item; the current step is exposed with aria-current=step.",
  ],
  group: [
    "Wrap adjacent controls in Group. Apply groupItemStyles.item through xstyle on each direct control. For Input and Textarea wrappers, use controlXstyle instead. GroupText and GroupSeparator apply joining styles themselves.",
    "orientation switches between horizontal and vertical layouts. ButtonGroup, ButtonGroupText and ButtonGroupSeparator are aliases.",
  ],
  kbd: [
    "Use Kbd for one key and KbdGroup for a shortcut sequence.",
    "This component only displays keys. Register the keyboard shortcut separately. Use the modifier names for the target platform.",
  ],
  separator: [
    'Place Separator between related sections. Set orientation="vertical" for side-by-side content.',
    "Use decorative when the separator should not appear in the accessibility tree.",
  ],
  skeleton: [
    "Size Skeleton to match the content being loaded.",
    "Keep the loading status outside the placeholder. Replace the skeleton with content when loading completes.",
  ],
  table: [
    "Compose TableCaption, TableHeader, TableBody and TableFooter with TableRow, TableHead and TableCell.",
    "Use scope on header cells to identify row or column headers. Table provides an overflow wrapper. variant selects the presentation. It does not control sorting or pagination.",
  ],
  input: [
    "Pair Input with a label using Field or matching id and htmlFor.",
    "The default uses Base UI Input. nativeInput selects a plain input. A numeric size controls native input width. String sizes control visual size. unstyled removes only the outer wrapper styles. The inner input keeps its styles. A string className applies to the wrapper. A className callback receives the Base UI input state.",
  ],
  textarea: [
    "Pair Textarea with a visible label and use rows to set the initial height.",
    "Textarea renders Base UI Field.Control as a textarea. unstyled removes only the outer wrapper styles. It keeps the textarea styles. String sizes select visual size. The control accepts numeric size, but this does not set rows. Use rows explicitly. className styles the outer wrapper.",
  ],
  label: [
    "Use Label with htmlFor matching the control's id.",
    "For Base UI validation and description associations, use FieldLabel within Field instead.",
  ],
  field: [
    "Wrap FieldLabel, a control, FieldDescription and FieldError in Field.",
    "Field connects validation state and accessible descriptions. FieldControl provides the underlying control integration. FieldValidity provides render access to validation results. FieldItem arranges a control and its label.",
  ],
  fieldset: [
    "Group related controls inside Fieldset with FieldsetLegend as their shared label.",
    "Each control still needs its own label. Use this for a set of radio buttons or related contact fields.",
  ],
  form: [
    "Use Form around Field components to coordinate validation and submission.",
    "Handle onSubmit for client-side work. Prevent browser navigation when necessary. errors supplies server validation errors by field name.",
  ],
  "input-group": [
    "Place InputGroupInput or InputGroupTextarea inside InputGroup. Use InputGroupAddon for icons or controls and InputGroupText for fixed text.",
    "Addon align accepts inline-start, inline-end, block-start or block-end. Addons do not replace the input's accessible label.",
  ],
  checkbox: [
    "Use Checkbox with a visible label for an independent yes-or-no choice.",
    "Use checked and onCheckedChange for controlled state, or defaultChecked for uncontrolled state. indeterminate represents a partially selected group.",
  ],
  "checkbox-group": [
    "Place Checkbox controls inside CheckboxGroup and give each checkbox a distinct value.",
    "The group value is an array. Label the set with FieldsetLegend or an accessible label. Keep individual checkbox labels.",
  ],
  "radio-group": [
    "Place Radio controls with distinct values inside RadioGroup.",
    "Use value and onValueChange for a controlled selection. RadioGroupItem is an alias for Radio. Give the group a label. Give each option a label.",
  ],
  switch: [
    "Use Switch for a setting that takes effect immediately.",
    "Pair it with a label that describes the setting, not the current state. checked and onCheckedChange control the state. defaultChecked supplies the initial state.",
  ],
  slider: [
    "Use Slider for a value within min and max. Supply an array value for multiple thumbs.",
    "The wrapper creates the track, indicator, and thumbs. Label the control. Use SliderValue to display the selected value.",
  ],
  meter: [
    "Compose MeterLabel, MeterTrack with MeterIndicator, and MeterValue inside Meter.",
    "A meter describes a measurement such as storage usage. Use Progress instead for completion of a task.",
  ],
  progress: [
    "Compose ProgressLabel, ProgressTrack with ProgressIndicator, and ProgressValue inside Progress.",
    "Use a numeric value when you know how much of the task is complete. Use null for indeterminate progress. Label the task, not only its percentage.",
  ],
  "number-field": [
    "Compose NumberFieldGroup with NumberFieldDecrement, NumberFieldInput and NumberFieldIncrement inside NumberField.",
    "Set min, max, and step to match the quantity. NumberFieldScrubArea requires a label. It supports pointer scrubbing. CursorGrowIcon is the scrub cursor graphic.",
  ],
  "otp-field": [
    "Place OTPFieldInput cells inside OTPField and use OTPFieldSeparator to split groups.",
    "Set length to the code length. Provide a label. Use onValueComplete to handle completion of all cells. Validate the code on the server.",
  ],
  toggle: [
    "Use Toggle for a pressed or unpressed action such as bold formatting.",
    "Use pressed and onPressedChange for controlled state. A toggle is not a checkbox replacement when collecting form data.",
  ],
  "toggle-group": [
    "Place ToggleGroupItem controls with distinct values inside ToggleGroup.",
    "multiple allows more than one selected item. The group supplies size and variant to its items. ToggleGroupSeparator divides adjacent sections.",
  ],
  toolbar: [
    "Compose ToolbarButton, ToolbarLink and ToolbarInput inside Toolbar. Group related actions with ToolbarGroup.",
    "Toolbar manages focus movement between controls. Set an accessible label. Use ToolbarSeparator between action groups.",
  ],
  accordion: [
    "Place AccordionItem sections inside Accordion. Each item contains AccordionTrigger followed by AccordionPanel.",
    "Give each item a stable value. multiple permits several expanded items. AccordionTrigger includes the heading wrapper and chevron. AccordionContent is an alias for AccordionPanel.",
  ],
  collapsible: [
    "Place CollapsibleTrigger and CollapsiblePanel inside Collapsible.",
    "Use open and onOpenChange for controlled expansion. Use defaultOpen for initial expansion. CollapsibleContent is an alias for CollapsiblePanel.",
  ],
  tabs: [
    "Place TabsTab controls inside TabsList and match each value with a TabsPanel inside Tabs.",
    "TabsList selects size and variant for the tab strip. TabsTrigger is an alias for TabsTab. TabsContent is an alias for TabsPanel. Use tabs to switch views, not for unrelated page navigation.",
  ],
  pagination: [
    "Compose PaginationContent with PaginationItem and PaginationLink inside Pagination.",
    "Supply href for every destination and isActive on the current page. PaginationPrevious and PaginationNext provide direction labels. Pagination does not calculate page ranges or load data.",
  ],
  "scroll-area": [
    "Wrap overflowing content in ScrollArea and give its container a bounded height or width.",
    "The wrapper includes its viewport and scrollbars. scrollFade adds edge fades. scrollbarGutter reserves scrollbar space. Use ScrollBar for custom composition with ScrollAreaPrimitive.",
  ],
  "alert-dialog": [
    "Compose AlertDialogTrigger and AlertDialogPopup inside AlertDialog, with AlertDialogTitle, AlertDialogDescription and confirmation controls in the popup.",
    "Popup includes the portal, backdrop, and viewport. Do not wrap it in a second portal. Use this dialog for decisions that require a response. Keep the cancel action easy to reach.",
  ],
  "context-menu": [
    "Place ContextMenuTrigger and ContextMenuPopup inside ContextMenu. Put ContextMenuItem or ContextMenuLinkItem controls in the popup.",
    "Use checkbox and radio parts for choices. Use ContextMenuSub for nested menus. Popup includes positioning and a portal. Use context menus in addition to visible actions, not as replacements.",
  ],
  dialog: [
    "Compose DialogTrigger and DialogPopup inside Dialog. Give the popup a DialogTitle and, when useful, DialogDescription.",
    "DialogPopup includes its portal, backdrop, viewport, and optional close button. DialogPanel provides a scrolling content region. DialogContent is an alias for DialogPopup. DialogOverlay is an alias for DialogBackdrop.",
  ],
  drawer: [
    "Compose DrawerTrigger and DrawerPopup inside Drawer, with DrawerTitle, DrawerDescription and DrawerPanel in the popup.",
    "position selects the edge and sets the default swipe direction. DrawerPopup includes the portal, backdrop, and viewport. DrawerContent is the Base UI content region. It is not an alias for DrawerPopup.",
    "DrawerMenu parts arrange actions inside a drawer. They do not turn the drawer into an anchored Menu.",
  ],
  menu: [
    "Compose MenuTrigger and MenuPopup inside Menu. Add MenuItem for actions and MenuLinkItem for links.",
    "Use MenuCheckboxItem or MenuRadioGroup and MenuRadioItem for persistent choices. MenuSub, MenuSubTrigger and MenuSubPopup form a submenu. Popup already includes its portal and positioner.",
    "DropdownMenu-prefixed exports are compatibility aliases. MenuCreateHandle connects detached triggers to a root.",
  ],
  popover: [
    "Compose PopoverTrigger and PopoverPopup inside Popover. Add PopoverTitle, PopoverDescription and PopoverClose as needed.",
    "Popup includes the portal and positioner. side, align, and offsets control placement. Use a dialog if the content must block interaction outside it.",
  ],
  "preview-card": [
    "Compose PreviewCardTrigger and PreviewCardPopup inside PreviewCard to preview a linked resource.",
    "Keep essential information available without the preview. HoverCard, HoverCardTrigger, and HoverCardContent are aliases.",
  ],
  select: [
    "Place SelectTrigger and SelectPopup inside Select. Place SelectValue inside SelectTrigger. Place SelectItem choices inside SelectPopup.",
    "Assign a value to each item. Use SelectGroup with SelectGroupLabel for sections. Popup includes its portal and positioner. alignItemWithTrigger aligns the selected item with the trigger when possible.",
    "SelectButton is a styled button without the selection trigger behavior. Use SelectTrigger for a working select.",
  ],
  sheet: [
    "Compose SheetTrigger and SheetPopup inside Sheet, with SheetTitle, SheetDescription and SheetPanel in the popup.",
    "side selects the viewport edge. SheetPopup includes the portal, backdrop, viewport, and an optional close button. Use Drawer if swipe gestures are required.",
  ],
  tooltip: [
    "Place TooltipTrigger and TooltipPopup inside Tooltip. Share timing across nearby tooltips with TooltipProvider.",
    "Tooltip content is a short description, not an interactive panel. Icon buttons still need an accessible name. TooltipPopup includes its portal and positioner.",
  ],
  autocomplete: [
    "Place AutocompleteInput and AutocompletePopup inside Autocomplete. Use AutocompleteList and AutocompleteItem for results.",
    "Autocomplete suggests text. The input does not have to equal an option. Supply items. Render matching results through the list or collection. AutocompleteEmpty handles no matches. AutocompleteStatus announces result updates.",
    "The input can include a trigger, clear button and start addon. Use Combobox when users must select values.",
  ],
  calendar: [
    'Use Calendar with mode="single", "multiple" or "range", matching selected and onSelect to that mode.',
    "The default mode is single. Days outside the current month are visible. disabled blocks dates. startMonth and endMonth limit navigation. classNames and components merge with Yopem defaults.",
    "Selection props form a union. A property can be required in one mode even when the combined table marks it optional. Read the branch signatures for the selected mode.",
  ],
  combobox: [
    "Compose ComboboxInput and ComboboxPopup with ComboboxList and ComboboxItem inside Combobox.",
    "For multiple selection, use ComboboxChips, ComboboxChip, and ComboboxChipsInput. Each chip includes a remove control. Supply items. If options are objects, supply a stable mapping from each item to its value.",
    "ComboboxEmpty handles no matches. ComboboxCollection supports grouped rendering. useComboboxFilter matches strings for the selected locale.",
  ],
  command: [
    "Compose CommandInput and CommandList with CommandItem controls inside Command. Use CommandEmpty for no matches.",
    "Command is built on Autocomplete. Group results with CommandGroup and CommandGroupLabel. CommandShortcut displays a shortcut but does not register it.",
    "For a command palette, place Command inside CommandDialogPopup under CommandDialog. The popup includes the portal, backdrop, and viewport. Supply an accessible title or aria-label.",
  ],
  sidebar: [
    "Wrap Sidebar and the main content in SidebarProvider. Place SidebarTrigger where users can reach it. Use SidebarInset for inset content.",
    "Build navigation with SidebarGroup, SidebarMenu, SidebarMenuItem, and SidebarMenuButton. Use render for links. Use isActive for the current location.",
    "collapsible selects offcanvas, icon, or none. Mobile layout uses a sheet. useSidebar provides desktop and mobile state separately. Tooltip text identifies icon-only items in the collapsed state.",
  ],
  toast: [
    'Mount ToastProvider once, then call toastManager.add({ title: "Saved" }) after an action.',
    "Use anchoredToastManager with AnchoredToastProvider for anchor-positioned notifications. Keep the matching provider mounted while sending updates or closing a toast.",
    "ToastProvider position selects the viewport corner or center edge. Use timeout to control dismissal. Include actions only if users have sufficient time to reach them.",
  ],
} satisfies Record<string, [string, ...string[]]>

export const usageNotes = new Map<string, [string, ...string[]]>(
  Object.entries(usageNoteValues),
)

const ownPropNoteValues = {
  xstyle:
    "The component applies the supplied StyleX styles after this part's defaults and variants. xstyle accepts style objects, conditional arrays, themes, and dynamic styles.",
  controlXstyle:
    "StyleX overrides and scoped themes for the decorative control wrapper. xstyle targets the native input or textarea.",
  children: "Content rendered inside this part.",
  className:
    "Additional CSS class names use the external CSS cascade. They do not always override other styles. If the type accepts a callback, that callback receives the Base UI part state.",
  render:
    "Replaces the default element with an element or render callback while merging the part's props and behavior.",
  orientation: "Chooses horizontal or vertical layout.",
  label: "Accessible label for the number field's scrub area.",
  defaultTheme:
    "Sets the initial theme preference before the provider reads a stored preference. system uses the operating system theme.",
  nonce: "Content Security Policy nonce for the inline theme script.",
  dark: "CSS class for the dark theme.",
  light: "CSS class for the light theme.",
  marker: "Theme marker class used by descendant StyleX selectors.",
  isMobile: "Whether the sidebar is using its mobile layout.",
  openMobile: "Whether the mobile sidebar sheet is open.",
  setOpen: "Updates the desktop sidebar's expanded state.",
  setOpenMobile: "Updates the mobile sidebar's open state.",
  state: "Desktop sidebar presentation: expanded or collapsed.",
  toggleSidebar:
    "Toggles the mobile sheet or desktop sidebar according to the current layout.",
  variant: "Selects the visual treatment. Allowed values depend on this part.",
  size: "Selects the control's visual size. Numeric input sizes use native width. Textarea accepts numeric size. Use rows to set its row count.",
  loading:
    "Shows a spinner and sets disabled on the rendered element. Native buttons block interaction. Custom rendered links must block disabled interaction themselves.",
  nativeInput: "Renders a native input instead of Base UI Input.",
  unstyled:
    "Does not apply control wrapper styles. It keeps control behavior. Input and Textarea keep their inner element styles.",
  isActive: "Marks this navigation item as the current item.",
  inset:
    "Adds leading space to align text with neighboring items that have indicators.",
  portalProps:
    "Props passed to the portal created by this wrapper, including its container and keepMounted option.",
  closeProps: "Props passed to the built-in close control.",
  triggerProps: "Props passed to the input's built-in trigger.",
  clearProps: "Props passed to the input's built-in clear control.",
  removeProps: "Props passed to the chip's built-in remove control.",
  showTrigger: "Shows the built-in popup trigger beside the input.",
  showClear:
    "Includes the built-in clear control. The input state controls its visibility.",
  startAddon: "Content before the editable input, such as an icon.",
  showCloseButton: "Includes a close button in the popup.",
  bottomStickOnMobile: "Aligns the popup to the bottom edge on narrow screens.",
  scrollFade: "Shows fades at the edges of scrollable content.",
  scrollable: "Wraps panel content in the scrolling area when true.",
  allowSelection: "Allows text selection in this drawer section.",
  showBar: "Shows the drawer's drag indicator.",
  position:
    "Selects the drawer edge or toast placement. See this part's allowed values.",
  side: "Selects the edge or anchored placement side. Collision handling can change anchored placement.",
  align:
    "Aligns the popup along its anchor, or positions an input addon along its group.",
  sideOffset:
    "Distance from the anchor along the placement axis, in CSS pixels, or an offset callback.",
  alignOffset:
    "Offset along the alignment axis, in CSS pixels, or an offset callback.",
  anchor:
    "Positioning anchor override. Accepts the element, ref, virtual element or callback described by the type.",
  instant: "Skips the popover transition styles when true.",
  tooltipStyle: "Uses the compact tooltip appearance for the popover.",
  alignItemWithTrigger:
    "Aligns the selected option with the trigger when the positioning conditions allow it.",
  clampContentMinWidth:
    "Limits the scroll content's minimum width to the viewport.",
  fill: "Makes the scroll area fill the available container space.",
  overscrollContain:
    "Prevents scroll chaining to ancestors at the scroll area's boundary.",
  scrollbarGutter: "Reserves space for the vertical scrollbar.",
  collapsible:
    "Chooses offcanvas hiding, icon-only collapse, or a non-collapsible sidebar.",
  tooltip:
    "Tooltip text or TooltipPopup props for a collapsed sidebar menu button.",
  showOnHover: "Shows the menu action only on hover or focus.",
  showIcon: "Adds an icon placeholder to the sidebar skeleton.",
  defaultOpen: "Initial expanded state when uncontrolled.",
  open: "Controlled expanded state.",
  onOpenChange: "Called when expanded state should change.",
}

export const ownPropNotes = new Map(Object.entries(ownPropNoteValues))

// Defaults delegated to a styling helper or context are not parameter initializers.
const delegatedDefaultValues = {
  Button: {
    size: '"default"',
    variant: '"default"',
    type: '"button" when render is omitted',
  },
  Badge: { size: '"default"', variant: '"default"' },
  Alert: { variant: '"default"' },
  Toggle: { size: '"default"', variant: '"default"' },
  SelectButton: { size: '"default"' },
  AutocompleteInput: { size: '"default"' },
  ComboboxInput: { size: '"default"' },
  TabsTab: { size: "Inherited from TabsList" },
  TabsTrigger: { size: "Inherited from TabsList" },
  ToggleGroupItem: {
    size: "Inherited from ToggleGroup",
    variant: "Inherited from ToggleGroup",
  },
  DrawerPopup: { position: "Inherited from Drawer" },
  DrawerSwipeArea: { position: "Inherited from Drawer" },
  DrawerBar: { position: "Inherited from Drawer" },
}

export const delegatedDefaults = new Map<string, ReadonlyMap<string, string>>(
  Object.entries(delegatedDefaultValues).map(
    ([name, defaults]) =>
      [name, new Map<string, string>(Object.entries(defaults))] satisfies [
        string,
        ReadonlyMap<string, string>,
      ],
  ),
)
