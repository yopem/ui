"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Clipboard } from "@registry/components/ui/clipboard"
import { Codeblock } from "@registry/components/ui/codeblock"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@registry/components/ui/collapsible"
import { Heading } from "@registry/components/ui/heading"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { rewriteImports } from "@registry/source-files"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

import { EditorDrawingClient } from "./editor-drawing-client"
import { BasicMarksExample } from "./editor-examples/basic-marks"
import { BasicNodesExample } from "./editor-examples/basic-nodes"
import { ColumnsExample } from "./editor-examples/columns-example"
import { DateExample } from "./editor-examples/date-example"
import { DefaultEditorExample } from "./editor-examples/editor-default"
import { DisabledEditorExample } from "./editor-examples/editor-disabled"
import { FullWidthEditorExample } from "./editor-examples/editor-full-width"
import { MinimalEditorExample } from "./editor-examples/installation-next-01-editor"
import { MarksSetupExample } from "./editor-examples/installation-next-02-marks"
import { ElementsSetupExample } from "./editor-examples/installation-next-03-elements"
import { LinkExample } from "./editor-examples/link"
import { MathExample } from "./editor-examples/math-example"
import { MediaExample } from "./editor-examples/media-example"
import { PublicAiExample } from "./editor-examples/public-ai"
import { PublicAutoformatExample } from "./editor-examples/public-autoformat"
import { PublicBlockMenuExample } from "./editor-examples/public-block-menu"
import { PublicBlocksExample } from "./editor-examples/public-blocks"
import { PublicCodeExample } from "./editor-examples/public-code"
import { PublicCodeDrawingExample } from "./editor-examples/public-code-drawing"
import { PublicCollaborationExample } from "./editor-examples/public-collaboration"
import { PublicCopilotExample } from "./editor-examples/public-copilot"
import { CsvEditorExample } from "./editor-examples/public-csv"
import { PublicCursorsExample } from "./editor-examples/public-cursors"
import { PublicDemoHostExample } from "./editor-examples/public-demo-host"
import { PublicDocumentExamples } from "./editor-examples/public-document"
import { PublicDocxExample } from "./editor-examples/public-docx"
import { PublicEditableVoidsExample } from "./editor-examples/public-editable-voids"
import { PublicEditingRulesExample } from "./editor-examples/public-editing-rules"
import { PublicExternalPreviewsExample } from "./editor-examples/public-external-previews"
import { PublicFloatingToolbarExample } from "./editor-examples/public-floating-toolbar"
import { PublicFootnotesExample } from "./editor-examples/public-footnotes"
import { VersionHistoryExample } from "./editor-examples/public-history"
import {
  ControlledEditorExample,
  MultipleEditorsExample,
} from "./editor-examples/public-hosts"
import { PublicIframeExample } from "./editor-examples/public-iframe"
import { PublicLabelsExample } from "./editor-examples/public-labels"
import { PublicListPresentationExample } from "./editor-examples/public-list-presentation"
import { PublicNativeEditingExample } from "./editor-examples/public-native-editing"
import { PublicPersistedExample } from "./editor-examples/public-persisted"
import { PublicPlaceholderExample } from "./editor-examples/public-placeholder"
import { PublicPluginRulesExample } from "./editor-examples/public-plugin-rules"
import { ReadOnlyEditorExample } from "./editor-examples/public-readonly"
import { PublicReviewExample } from "./editor-examples/public-review"
import { PublicScaleExample } from "./editor-examples/public-scale"
import { PublicSearchExample } from "./editor-examples/public-search"
import { PublicSelectionExample } from "./editor-examples/public-selection"
import { PublicStylesExample } from "./editor-examples/public-styles"
import { PublicTabbableExample } from "./editor-examples/public-tabbable"
import { PublicTablesExample } from "./editor-examples/public-tables"
import { PublicTocExample } from "./editor-examples/public-toc"
import { PublicTypeaheadExample } from "./editor-examples/public-typeahead"
import { PublicWordClipboardExample } from "./editor-examples/public-word-clipboard"

const sources = import.meta.glob<string>("./editor-examples/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
})

const examples = [
  {
    slug: "public-ai",
    workflowIds: [],
    title: "Configured AI command menu",
    Component: PublicAiExample,
    items: ["editor-ai-menu"],
    description:
      "Configure an authenticated host before commands, local chat, completed text approval, or authorized review comments.",
    limits:
      "No default endpoint, model, credentials, or server chat storage exists. Twelve truncated messages stay until the root unmounts. Null selection retains the dialog target. Selected-text context menus stay native, rich Markdown approval and nested shadow-root insert-below are absent. Full mapped AI equivalence is not credited; runtime acceptance remains deferred.",
  },
  {
    slug: "public-code-drawing",
    workflowIds: [],
    title: "Configured native diagrams",
    Component: PublicCodeDrawingExample,
    items: ["editor-diagram", "editor-code", "field"],
    description:
      "Edit native diagram source and render it with an explicitly configured authenticated host endpoint.",
    limits:
      "No default endpoint or engine exists. Optional browser SDK adapters require separate installation. SVG download is supplied; PNG and PDF are absent. Generic document conversion rejects diagram metadata. Engine, SSR, CSP, and browser acceptance remain deferred; full mapped equivalence is not credited.",
  },
  {
    slug: "public-block-menu",
    workflowIds: [],
    title: "Native block context actions",
    Component: PublicBlockMenuExample,
    items: ["editor-block-menu"],
    description:
      "Right-click a block or use Shift+F10 for native clipboard, type, indentation, alignment, and history actions.",
    limits:
      "This composition does not supply Ask AI or Code Drawing host callbacks. Add Comment is absent. Full pinned block-menu equivalence is not credited. Runtime acceptance is deferred.",
  },
  {
    slug: "public-copilot",
    workflowIds: ["copilot"],
    title: "Configured inline Copilot",
    Component: PublicCopilotExample,
    items: ["editor-copilot"],
    description:
      "Configure an existing authenticated host endpoint before requesting paragraph-end completions.",
    limits:
      "No endpoint, model, credentials, or free inference is provided. Automatic requests need host and user opt-in. Provider billing may continue after cancellation. Runtime acceptance is deferred.",
  },
  {
    slug: "public-editable-voids",
    workflowIds: ["editable-voids"],
    title: "Editable native cards",
    Component: PublicEditableVoidsExample,
    items: ["editor-editable-card", "box", "button", "stack"],
    description:
      "Insert a native card with local fields and an independent nested editor.",
    limits:
      "Local card state is transient. JSON stores only the node type and version. Removal or import resets local fields. This workflow is not runtime-verified.",
  },
  {
    slug: "public-tabbable",
    workflowIds: ["tabbable"],
    title: "Native Tab workflows",
    Component: PublicTabbableExample,
    items: ["editor-editable-card", "box", "button", "stack"],
    description:
      "Move through card controls with native Tab order. Keep list and code editing in independent roots.",
    limits:
      "Nested editor history is independent. Browser Tab order and keyboard acceptance remain unverified.",
  },
  {
    slug: "basic-marks",
    title: "Basic marks",
    Component: BasicMarksExample,
    items: ["editor"],
    description:
      "Combine text marks. Use the toolbar or native bold, italic, and underline shortcuts.",
    limits:
      "Keyboard-label text remains ordinary editable text. The editor has no keyboard-label mark.",
  },
  {
    slug: "basic-nodes",
    title: "Basic nodes",
    Component: BasicNodesExample,
    items: ["editor"],
    description:
      "Change headings, paragraphs, quotes, and text marks in one document.",
    limits:
      "Horizontal rules use the installed native HorizontalRuleExtension and a local toolbar control. This does not add a house Editor API.",
  },
  {
    slug: "link",
    title: "Links",
    Component: LinkExample,
    items: ["editor"],
    description:
      "Select text. Add, change, or remove a safe URL. Paste a safe URL over selected text to keep its label.",
    limits:
      "Accepted URL schemes are HTTP, HTTPS, mailto, and tel. Relative URLs are not accepted.",
  },
  {
    slug: "installation-next-01-editor",
    title: "Minimal editor setup",
    Component: MinimalEditorExample,
    items: ["editor"],
    description:
      "Start with one empty editable surface. Native rich-text shortcuts work without a toolbar.",
    limits:
      "This client composition is framework-independent. It does not configure a Next.js application.",
  },
  {
    slug: "installation-next-02-marks",
    title: "Marks setup",
    Component: MarksSetupExample,
    items: ["editor"],
    description:
      "Start with formatted text. Compose bold, italic, underline, undo, and redo controls.",
    limits:
      "The toolbar shows selected controls. EditorRoot still registers its standard native extensions.",
  },
  {
    slug: "installation-next-03-elements",
    title: "Elements setup",
    Component: ElementsSetupExample,
    items: ["editor"],
    description:
      "Load native heading, quote, paragraph, and mark state. Change selected content with focused controls.",
    limits: "The seed uses Lexical JSON, not Slate or Plate JSON.",
  },
  {
    slug: "editor-default",
    title: "Default editor",
    Component: DefaultEditorExample,
    items: ["editor"],
    description:
      "Use the house Editor preset with its default toolbar, editable surface, and history.",
    limits:
      "This is the house preset, not the full Plate EditorKit. Optional editor features are not included.",
  },
  {
    slug: "editor-disabled",
    title: "Disabled editor composition",
    Component: DisabledEditorExample,
    items: ["editor"],
    description:
      "Show an empty non-editable surface with disabled controls, disabled semantics, and no editor tab stop.",
    limits:
      "Editor has no disabled prop. This composition uses editable=false, aria-disabled, and tabIndex=-1. It is not a native disabled form field.",
  },
  {
    slug: "editor-full-width",
    title: "Full-width editor",
    Component: FullWidthEditorExample,
    items: ["editor", "container"],
    description:
      "Use the house preset inside a fluid Container. The editor fills the available parent width.",
    limits:
      "Parent layout still bounds the width. This is not the full Plate EditorKit or a fullWidth editor variant.",
  },
  {
    slug: "equation",
    sourceFile: "math-example",
    title: "Equations",
    Component: MathExample,
    items: ["editor", "editor-math", "editor-typeahead"],
    description:
      "Edit inline and block equations. Use slash commands and combine math with native tables and code blocks.",
    limits:
      "TeX input has a 4096-character limit. Browser behavior and consumer installation remain unverified.",
  },
  {
    slug: "column",
    sourceFile: "columns-example",
    title: "Columns",
    Component: ColumnsExample,
    items: ["editor", "editor-columns"],
    description:
      "Edit seeded left and right columns. Compare editable column borders with read-only mode.",
    limits:
      "Generic editor-document converters do not support column nodes. The native extension supports JSON and HTML conversion.",
  },
  {
    slug: "date",
    sourceFile: "date-example",
    title: "Inline dates",
    Component: DateExample,
    items: ["editor", "editor-date"],
    description:
      "Choose a date in the inline calendar. Keep nearby text editable and use editor history.",
    limits:
      "Dates use YYYY-MM-DD values. Generic editor-document converters do not support date nodes.",
  },
  {
    slug: "media",
    sourceFile: "media-example",
    title: "Media",
    Component: MediaExample,
    items: ["editor", "editor-media"],
    description:
      "Insert validated HTTPS media URLs. Edit image captions and widths. Render supported audio, video, file, and provider content.",
    limits:
      "A host must supply an upload callback. Host code sets size, type, and quota limits. Batch upload is not built in. Twitter embeds are not supported. Media JSON and tagged HTML keep metadata.",
  },
  {
    slug: "controlled",
    sourceFile: "public-hosts",
    title: "Controlled document replacement",
    Component: ControlledEditorExample,
    items: ["editor"],
    description:
      "Replace or reset a native document. Return focus to its start or end. Edit a document after local async initialization.",
    limits:
      "Replacement keeps local undo history. Async initialization uses a fixed local Promise, not persistence or a network service.",
  },
  {
    slug: "multiple-editors",
    sourceFile: "public-hosts",
    title: "Independent editors",
    Component: MultipleEditorsExample,
    items: ["editor"],
    description:
      "Edit two independent roots. Keep their formatting, history, content, and read-only state separate.",
    limits:
      "The roots do not share document state. This is not a collaboration example.",
  },
  {
    slug: "version-history",
    sourceFile: "public-history",
    title: "Local revision history",
    Component: VersionHistoryExample,
    items: ["editor", "editor-review", "native-select"],
    description:
      "Save immutable snapshots. Inspect an earlier revision without changing the current document. Compare inserted, removed, and updated blocks and text.",
    limits:
      "History stays in memory and holds at most 20 snapshots, each within 1 MiB and 200 top-level blocks. Long or multiline text uses whole-block differences. No server history is configured.",
  },
  {
    slug: "public-placeholder",
    sourceFile: "public-placeholder",
    workflowIds: ["block-placeholder"],
    title: "Selected empty block placeholders",
    Component: PublicPlaceholderExample,
    items: ["editor-block-placeholder"],
    description:
      "Select an empty root heading, paragraph, quote, or code block to expose a transient hint and live status. Typing removes it without saved placeholder text.",
    limits:
      "Hints apply only to focused empty top-level elements. Labels are fixed until unmount. Native focus, history, cleanup, screen-reader announcements, serialization and responsive behavior remain unverified.",
  },
  {
    slug: "public-editing-rules",
    sourceFile: "public-editing-rules",
    workflowIds: ["exit-break", "single-block"],
    title: "Native exit break and single-paragraph rules",
    Component: PublicEditingRulesExample,
    items: ["editor-editing-rules"],
    description:
      "Exit native quote, code, and table root boundaries with modifier shortcuts. Use separate single-block or single-line input modes with bounded plain-text paste.",
    limits:
      "Single-paragraph modes apply only to a root with one paragraph and do not validate or flatten arbitrary documents. Single-line removes new pasted breaks, not existing content. Full autoformat, plugin-rules, placeholders and tabbable workflows are not provided. History, IME, native clipboard and accessibility are unverified.",
  },
  {
    slug: "public-drawing",
    sourceFile: "public-drawing",
    workflowIds: [],
    title: "Configured bounded drawing scenes",
    description:
      "Edit restricted Excalidraw drafts with explicit local SDK assets and sanitized SVG export. Runtime acceptance is deferred.",
    Component: EditorDrawingClient,
    items: ["editor-drawing"],
    limits:
      "Requires browser-only SDK loading, approved same-origin assets and the SDK stylesheet. Files, images, links, custom metadata and unsupported element types reject. Generic document conversion is unsupported. SDK and dependency-audit acceptance remain required. No complete mapped Excalidraw workflow credit.",
  },
  {
    slug: "public-collaboration",
    sourceFile: "public-collaboration",
    workflowIds: [],
    title: "Two-client host-configured collaboration",
    Component: PublicCollaborationExample,
    items: ["editor-collaboration", "field"],
    description:
      "Connect two independent Lexical roots to one initialized host document. Inspect separate connection states and control each root's read-only state.",
    limits:
      "This custom editor-v1 transport does not implement Hocuspocus or WebRTC. Both roots use one browser session. Matching schema, host policies, and initialized storage are required. Sync, history, cleanup, and accessibility remain unverified. Full mapped collaboration equivalence is not credited.",
  },
  {
    slug: "public-cursors",
    sourceFile: "public-cursors",
    workflowIds: [],
    title: "Native cursor and toolbar selection paint",
    description:
      "Paint native drag carets and retain browser ranges during toolbar focus without adding document data.",
    Component: PublicCursorsExample,
    items: ["editor-cursor-overlay"],
    limits:
      "Paint follows native selection and drop geometry without changing saved state. Toolbar focus retention is not AI authorization or acceptance. Cross-frame geometry, cleanup, pointer behavior and accessibility remain unverified. This partial workflow earns no full cursor-overlay credit.",
  },
  {
    slug: "public-floating-toolbar",
    sourceFile: "public-floating-toolbar",
    workflowIds: ["floating-toolbar"],
    title: "Selection-anchored floating controls",
    Component: PublicFloatingToolbarExample,
    items: ["editor-floating-toolbar"],
    description:
      "Select native text, focus the floating toolbar with Alt+F10, change marks or heading type, and preserve saved-range validation.",
    limits:
      "This composition demonstrates native formatting, scripts, and heading controls. Nested link/equation popups, review and host AI actions are not composed here. Pointer, focus, geometry, RTL, read-only and accessibility remain unverified.",
  },
  {
    slug: "public-review",
    sourceFile: "public-review",
    workflowIds: ["discussion"],
    title: "Anchored discussions and inline suggestions",
    Component: PublicReviewExample,
    items: ["editor-review"],
    description:
      "Follow anchored threads, reply, resolve and reopen, add comments, suggest inline insert/delete/format changes, and accept or reject decisions with native history.",
    limits:
      "Profiles and synchronous policies are local fixtures, not authentication or server authorization. Suggestions are inline only. Review clipboard accepts plain text; rich HTML is rejected. Structural suggestions, lossless review conversion, persistence, and shared discussions are not provided. Runtime and accessibility remain unverified.",
  },
  {
    slug: "search",
    sourceFile: "public-search",
    workflowIds: ["find-replace"],
    title: "Search with transient highlights",
    Component: PublicSearchExample,
    items: ["editor-search"],
    description:
      "Search live text, move through bounded matches with keyboard or pointer controls, and keep document content and undo history unchanged.",
    limits:
      "The pinned find-replace example exposes search only. No replacement operation exists. Matches do not cross styled TextNodes. Query/result bounds do not make document scanning constant-time. Runtime, read-only geometry, and overlay cleanup remain unverified.",
  },
  {
    slug: "public-typeahead",
    sourceFile: "public-typeahead",
    workflowIds: ["emoji", "mention", "slash-command"],
    title: "Full emoji, mentions, and slash actions",
    Component: PublicTypeaheadExample,
    items: [
      "editor-typeahead",
      "editor-toc",
      "editor-blocks",
      "editor-columns",
      "editor-date",
      "editor-math",
      "editor-footnotes",
    ],
    description:
      "Use the full local emoji inventory and shared bounded history, abortable fixture mention search, and slash actions for native blocks, columns, dates, equations, footnotes, and contents.",
    limits:
      "Mention identities are local documentation fixtures, not profile services or access grants. Date insertion uses fixed 2025-01-15. AI, upload, and drawing actions require missing host integrations and are omitted. IME, clipboard, focus, asynchronous query, and accessibility acceptance remain unverified.",
  },
  {
    slug: "public-document",
    sourceFile: "public-document",
    workflowIds: [
      "html",
      "markdown",
      "markdown-streaming",
      "markdown-to-slate",
      "preview-markdown",
    ],
    title: "HTML, Markdown, and local streaming",
    Component: PublicDocumentExamples,
    items: [
      "editor-document",
      "editor-code",
      "heading",
      "label",
      "native-select",
      "slider",
      "textarea",
    ],
    description:
      "Paste rich HTML, import validated source, inspect Markdown syntax, export rich and static output, and control a bounded local streaming producer that commits only at EOF.",
    limits:
      "The historical markdown-to-slate workflow maps to native Lexical output, not Slate migration. Streaming uses fixed local scenarios, not AI inference. Plain-text Markdown clipboard conversion remains unsupported; whole-document import is not paste. Cancellation cannot stop arbitrary host producers. Runtime and fidelity acceptance remain unverified.",
  },
  {
    slug: "public-tables",
    sourceFile: "public-tables",
    workflowIds: ["table", "table-nomerge"],
    title: "Rich tables and merge policy",
    Component: PublicTablesExample,
    items: ["editor"],
    description:
      "Edit native tables, resize rows and columns, change cell presentation, merge or split selections, and reload generated local JSON or HTML snapshots.",
    limits:
      "The second root disables house merges at mount time without flattening imported spans. Explicit splitting remains available. Snapshot controls accept only their generated local content, not untrusted external documents. Clipboard, geometry, history, and roundtrip acceptance remain unverified.",
  },
  {
    slug: "public-selection",
    sourceFile: "public-selection",
    workflowIds: ["block-selection", "dnd"],
    title: "Block selection and reorder",
    Component: PublicSelectionExample,
    items: ["editor-block-selection"],
    description:
      "Select top-level ranges, copy or confirm native cuts, reorder by handle or move controls, and preserve rich content with local history.",
    limits:
      "Selection and reorder apply to top-level blocks only. Local Cut confirmation grants no server permission. Pointer, clipboard policy, history, and read-only acceptance remain unverified.",
  },
  {
    slug: "read-only",
    sourceFile: "public-readonly",
    workflowIds: ["editor-disabled"],
    title: "Read-only rich document",
    Component: ReadOnlyEditorExample,
    items: ["editor"],
    description:
      "Render headings, inline marks, a quotation, and a usable link without enabling document mutation. Select and copy native content.",
    limits:
      "This is a companion to the disabled-editor workflow, not an additional mapped public example. Clipboard, focus, and read-only behavior remain unverified.",
  },
  {
    slug: "public-code",
    sourceFile: "public-code",
    workflowIds: ["code-block"],
    title: "Native code editing and formatting",
    Component: PublicCodeExample,
    items: ["editor-code", "editor-code-format"],
    description:
      "Edit seeded JavaScript, Python, and CSS blocks. Select configured languages, copy code with feedback, and format supported JavaScript with local history.",
    limits:
      "The language control is a native select, not a search field. Its empty option is Unspecified, not Auto or Plain Text. The optional Prettier adapter does not support Python. Static grammar loading has a material bundle cost.",
  },
  {
    slug: "public-footnotes",
    sourceFile: "public-footnotes",
    workflowIds: ["footnote"],
    title: "Rich footnotes and backlinks",
    Component: PublicFootnotesExample,
    items: ["editor-footnotes"],
    description:
      "Edit rich definitions, insert repeated references, inspect unresolved and duplicate identifiers, and return through backlinks.",
    limits:
      "References use fixed local identifiers, not host citations. Generic document converters do not support footnote nodes. Browser and clipboard acceptance remain unverified.",
  },
  {
    slug: "public-toc",
    sourceFile: "public-toc",
    workflowIds: ["toc"],
    title: "Live table of contents",
    Component: PublicTocExample,
    items: ["editor-toc"],
    description:
      "Insert a live heading overview, edit headings, navigate within the editor, and export HTML with matching anchor IDs.",
    limits:
      "TOC entries derive from current native headings. Generic document converters do not support TOC nodes. Export and focus workflows remain unverified.",
  },
  {
    slug: "public-blocks",
    sourceFile: "public-blocks",
    workflowIds: ["callout", "toggle"],
    title: "Callouts and nested disclosures",
    Component: PublicBlocksExample,
    items: ["editor", "editor-blocks", "editor-typeahead"],
    description:
      "Edit rich callouts, choose status and emoji icons, and compose nested disclosures with usable title links and local read-only disclosure.",
    limits:
      "Emoji choices use the local full inventory. Saved selections expire after document edits. JSON output is local inspection, not storage or host document authorization.",
  },
  {
    slug: "public-styles",
    sourceFile: "public-styles",
    workflowIds: ["text-align", "font", "indent", "line-height"],
    title: "Text and block presentation",
    Component: PublicStylesExample,
    items: ["editor"],
    description:
      "Apply selected-block alignment, text and background colors, indentation, and line height. Save and reload styled native JSON and HTML.",
    limits:
      "These controls use native Lexical state. Saved roundtrips stay in local component memory and are not host persistence. Public-example behavior remains unverified.",
  },
  {
    slug: "public-list-presentation",
    sourceFile: "public-list-presentation",
    workflowIds: [],
    title: "Native list presentation",
    Component: PublicListPresentationExample,
    items: ["editor-list-presentation", "box", "button", "stack", "text"],
    description:
      "Set list markers and signed starts on independent nested native lists.",
    limits:
      "Local JSON/HTML controls are not an untrusted importer. Runtime and clipboard fidelity remain unverified.",
  },
  {
    slug: "public-word-clipboard",
    sourceFile: "public-word-clipboard",
    workflowIds: [],
    title: "Bounded Word clipboard fragments",
    Component: PublicWordClipboardExample,
    items: ["editor-word-clipboard"],
    description:
      "Insert supported Office HTML as a native fragment. Preserve clipboard policies, list presentation, native history, and visible import errors.",
    limits:
      "Images need a synchronous trusted host resolver. No image source is fetched automatically. This subset does not preserve Word page layout. Native Word capture, host policy, history, and browser acceptance remain pending.",
  },
  {
    slug: "public-docx",
    sourceFile: "public-docx",
    workflowIds: [],
    title: "Bounded native Word document conversion",
    Component: PublicDocxExample,
    items: ["editor-docx", "box", "button", "stack", "text"],
    description:
      "Import a supported Word document or download native content as actual DOCX archive bytes. Keep read-only export and native history separate from import.",
    limits:
      "This local semantic subset rejects unsupported content. It does not preserve Word page layout, images, macros, headers, or footers. Native decompression support is required. This file workflow does not implement the separate pinned Word clipboard workflow. Real-file, security, history, and browser validation remain pending.",
  },
  {
    slug: "public-labels",
    sourceFile: "public-labels",
    workflowIds: ["select-editor"],
    title: "Validated native label-token editor",
    Component: PublicLabelsExample,
    items: [
      "editor-labels",
      "box",
      "button",
      "checkbox-group",
      "fieldset",
      "form",
      "hstack",
      "stack",
      "text",
    ],
    description:
      "Choose eleven fixed label options, validate one through ten selections, replace only label-only content, and switch between editable and read-only controls.",
    limits:
      "The pure codec permits an empty selection; the form applies its one-label minimum. Host options are fixed per mount. Label identities do not grant access. Generic document conversion is unsupported. Native clipboard, normalization, source closure, history, and accessibility remain untested.",
  },
  {
    slug: "public-external-previews",
    sourceFile: "public-external-previews",
    workflowIds: ["potion-iframe", "pro-iframe", "image-pro"],
    title: "Opt-in public external preview shells",
    Component: PublicExternalPreviewsExample,
    items: ["box", "button", "heading", "input", "stack", "text"],
    description:
      "Load the public Potion and Pro iframe wrappers only after explicit consent. Use a bounded Pro example ID and remove each frame separately.",
    limits:
      "These wrappers embed third-party applications, not Lexical replacements or copied commercial source. Requests expose browser metadata. The sandbox, host CSP, and service framing policies can block functionality. Only public wrapper source receives coverage; live-service and accessibility checks are deferred.",
  },
  {
    slug: "public-iframe",
    sourceFile: "public-iframe",
    workflowIds: ["iframe"],
    title: "Same-origin responsive iframe editor",
    Component: PublicIframeExample,
    items: [
      "editor",
      "box",
      "field",
      "heading",
      "input",
      "slider",
      "stack",
      "text",
    ],
    description:
      "Mount a fresh native editor in a script-disabled same-origin frame, copy host styles and theme markers, change its bounded width, and copy text back to the parent.",
    limits:
      "This is a layout boundary, not a security sandbox. It copies owned stylesheet nodes and watches host theme/head changes, not arbitrary CSSOM-only edits. CSP, fonts, frame focus, native clipboard, observer cleanup, and nested-frame accessibility remain unverified.",
  },
  {
    slug: "public-persisted",
    sourceFile: "public-persisted",
    workflowIds: ["installation-next"],
    title: "Date-scoped local draft host",
    Component: PublicPersistedExample,
    items: [
      "editor-document",
      "box",
      "button",
      "field",
      "heading",
      "input",
      "stack",
      "text",
    ],
    description:
      "Open validated saved native state before mounting the editable root, save document changes by date, and reset without replacing the saved snapshot.",
    limits:
      "Browser-local storage is unencrypted and last-write-wins across tabs. Invalid storage pauses automatic writes. Only this root's base node types are admitted. This React composition is not a verified Next.js integration; storage, mount/reset races, history, and source closure remain untested.",
  },
  {
    slug: "public-plugin-rules",
    sourceFile: "public-plugin-rules",
    workflowIds: ["plugin-rules"],
    title: "Native block behavior rules",
    Component: PublicPluginRulesExample,
    items: [
      "editor-block-behavior",
      "editor-autoformat",
      "button",
      "stack",
      "text",
    ],
    description:
      "Split headings into paragraphs and inspect native quote, code, list, inline, link, and void keyboard boundaries with history and read-only controls.",
    limits:
      "Only collapsed heading splitting is overridden. Other operations use native Lexical behavior, not a Plate rule runtime. Directional affinity, empty links, void selection, nested contexts, metadata, and Undo remain runtime-unverified.",
  },
  {
    slug: "public-autoformat",
    sourceFile: "public-autoformat",
    workflowIds: ["autoformat"],
    title: "Additional native input shortcuts",
    Component: PublicAutoformatExample,
    items: ["editor-autoformat", "button", "stack", "text"],
    description:
      "Extend native shortcuts with nested quote, checklist, rule, smart quote, symbol, fraction, and Unicode script input rules.",
    limits:
      "Known substitutions are fixed and bounded, not an arbitrary input-rule engine. Code text stays literal. Fraction boundaries and line-start guillemet behavior are explicit. Native Undo, overlapping rules, IME, paste, and copied-consumer behavior remain unverified.",
  },
  {
    slug: "public-demo-host",
    sourceFile: "public-demo-host",
    workflowIds: ["demo-host"],
    title: "Validated fixture host",
    Component: PublicDemoHostExample,
    items: ["editor", "button", "field", "input", "stack", "text"],
    description:
      "Validate a fixture ID before creating two fresh independent native documents. Reload explicitly and retain current documents after an invalid ID.",
    limits:
      "Four public fixture families are translated to local Lexical values. This is not the complete upstream fixture/value inventory and does not import Slate state. Independence, cloning, history, and copied-consumer workflows remain unverified.",
  },
  {
    slug: "public-native-editing",
    sourceFile: "public-native-editing",
    workflowIds: ["basic-blocks", "list", "list-classic", "autoformat"],
    title: "Native blocks, lists, and Markdown shortcuts",
    Component: PublicNativeEditingExample,
    items: ["editor", "heading"],
    description:
      "Compose heading, quote, horizontal-rule, list, checklist, indentation, presentation, history, and native Markdown shortcut controls.",
    limits:
      "This uses the installed Lexical transformers, not a second overlapping shortcut registration. Nested quote operations, richer list marker/start controls, checklist/rule shortcuts, and smart symbol/quote/fraction substitutions remain incomplete. These source workflows are not runtime-verified.",
  },
  {
    slug: "public-scale",
    sourceFile: "public-scale",
    workflowIds: ["huge-document", "hundreds-editors"],
    title: "Explicitly admitted scale fixtures",
    Component: PublicScaleExample,
    items: [
      "editor",
      "box",
      "button",
      "field",
      "native-select",
      "stack",
      "text",
    ],
    description:
      "Mount a bounded long document or many independent native roots only after a separate user action. Opening one fixture unmounts the other.",
    limits:
      "The caps are 500 paragraphs and 200 independent roots. These partial fixtures do not supply the pinned Slate engine/chunking controls, URL benchmark configuration, or frame statistics. No performance or capacity result is claimed. Memory-intensive deferred tests require RUN_EDITOR_SCALE=1.",
  },
  {
    slug: "csv",
    sourceFile: "public-csv",
    title: "CSV clipboard tables",
    Component: CsvEditorExample,
    items: ["editor-csv"],
    description:
      "Paste rectangular CSV data into native tables. Preserve quoted fields, local history, read-only behavior, and host paste vetoes.",
    limits:
      "Input is limited to 1 MiB and 50 by 50 cells. Rows must have equal widths. JSON and HTML keep clipboard priority. Formulas remain plain text.",
  },
] as const

const styles = stylex.create({
  section: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
    paddingBlock: `calc(${tokens["--spacing"]} * 6)`,
  },
  preview: { minInlineSize: 0 },
  details: { minInlineSize: 0 },
})

export function getCoreEditorExampleSource(slug: string) {
  const example = examples.find((entry) => entry.slug === slug)

  if (!example) return null
  const sourceFile = "sourceFile" in example ? example.sourceFile : example.slug
  const source = sources[`./editor-examples/${sourceFile}.tsx`]

  if (!source)
    throw new Error(`Missing core editor example source: ${sourceFile}`)

  return {
    slug: example.slug,
    workflowIds:
      "workflowIds" in example ? [...example.workflowIds] : [example.slug],
    title: example.title,
    installNames: [...example.items],
    filename: `${sourceFile}.tsx`,
    source: rewriteImports(source),
    limits: example.limits,
    status: "internal-pending" as const,
  }
}

export function getCoreEditorExamples() {
  return examples.map((example) => ({
    slug: example.slug,
    workflowIds:
      "workflowIds" in example ? [...example.workflowIds] : [example.slug],
    title: example.title,
    description: example.description,
    limits: example.limits,
    installNames: [...example.items],
    url: `/editor/examples#${example.slug}`,
  }))
}

export function getCoreEditorExamplesMarkdown() {
  return [
    "# Editor examples",
    ...getCoreEditorExamples().map((example) => {
      const documentation = getCoreEditorExampleSource(example.slug)

      if (!documentation)
        throw new Error(`Missing core editor example: ${example.slug}`)

      return [
        `## ${example.title}`,
        example.description,
        example.limits,
        `Mapped workflows: ${example.workflowIds.join(", ")}`,
        `Required registry items: ${example.installNames.join(", ")}`,
        `\`\`\`tsx\n${documentation.source}\n\`\`\``,
      ].join("\n\n")
    }),
  ].join("\n\n")
}

export function CoreEditorExamplesGallery() {
  return (
    <Stack data-testid="editor-examples-core">
      <Heading>Core compositions</Heading>
      <Text>
        These native Lexical compositions use house Editor APIs. Browser
        acceptance and consumer installation checks have not run.
      </Text>
      <Text>
        Open one live preview at a time. Closing a preview resets its local
        document. Copy source without opening the preview.
      </Text>
      <Text>
        Install each example's listed registry items first. Keep the generated
        StyleX setup and application fonts loaded. Copy one complete file. Each
        file exports a named React component and includes its own seed when
        needed.
      </Text>
      {examples.map(
        ({ slug, title, description, limits, Component, items }) => {
          const documentation = getCoreEditorExampleSource(slug)

          if (!documentation)
            throw new Error(`Missing core editor example: ${slug}`)

          return (
            <Box
              key={slug}
              render={<section aria-labelledby={`${slug}-title`} />}
              id={slug}
              data-testid={`editor-example-${slug}`}
              xstyle={styles.section}
            >
              <Stack>
                <Heading id={`${slug}-title`}>{title}</Heading>
                <Text>{description}</Text>
                <Text>{limits}</Text>
                <Text>Required registry items: {items.join(", ")}</Text>
                <Collapsible>
                  <CollapsibleTrigger render={<Button variant="outline" />}>
                    Live preview
                  </CollapsibleTrigger>
                  <CollapsiblePanel>
                    <Box xstyle={styles.preview}>
                      <Component />
                    </Box>
                  </CollapsiblePanel>
                </Collapsible>
                <Clipboard
                  value={documentation.source}
                  aria-label="Copy source"
                >
                  Copy source
                </Clipboard>
                <Collapsible>
                  <CollapsibleTrigger render={<Button variant="outline" />}>
                    View source
                  </CollapsibleTrigger>
                  <CollapsiblePanel xstyle={styles.details}>
                    <Codeblock>{documentation.source}</Codeblock>
                  </CollapsiblePanel>
                </Collapsible>
              </Stack>
            </Box>
          )
        },
      )}
    </Stack>
  )
}
