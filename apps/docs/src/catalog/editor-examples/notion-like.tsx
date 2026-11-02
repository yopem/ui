"use client"

import type { EditorTocHeading } from "@yopem-ui/editor/toc"
import type { EditorState, LexicalEditor } from "lexical"
import type { MouseEvent } from "react"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Clipboard } from "@registry/components/ui/clipboard"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Fieldset } from "@registry/components/ui/fieldset"
import { Grid } from "@registry/components/ui/grid"
import { Heading } from "@registry/components/ui/heading"
import { HStack } from "@registry/components/ui/hstack"
import { Input } from "@registry/components/ui/input"
import { List, ListItem } from "@registry/components/ui/list"
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@registry/components/ui/menu"
import {
  Popover,
  PopoverClose,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { ScrollArea } from "@registry/components/ui/scroll-area"
import {
  Sheet,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@registry/components/ui/sheet"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  EditorBlockPresentationExtension,
  EditorFormatButton,
  EditorHistoryButton,
  EditorRoot,
  EditorTableMenu,
  EditorTablePresentationExtension,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import {
  createEditorBlockMenu,
  EditorBlockMenu,
} from "@yopem-ui/editor/block-menu"
import {
  createEditorBlockSelection,
  EditorBlockSelection,
  EditorBlockSelectionActions,
  EditorBlockSelectionGutter,
  EditorBlockSelectionStatus,
} from "@yopem-ui/editor/block-selection"
import {
  CalloutNode,
  EditorBlocksExtension,
  INSERT_EDITOR_CALLOUT_COMMAND,
} from "@yopem-ui/editor/blocks"
import { exportDocument, parseDocument } from "@yopem-ui/editor/document"
import {
  EditorFloatingToolbar,
  EditorLinkFloatingToolbar,
} from "@yopem-ui/editor/floating-toolbar"
import { EditorMathControls, EditorMathExtension } from "@yopem-ui/editor/math"
import {
  MediaActions,
  MediaAlignButton,
  MediaCaptionTextarea,
  MediaDeleteButton,
  MediaEditControl,
  MediaExtension,
  MediaImageResize,
  MediaInsertControl,
} from "@yopem-ui/editor/media"
import {
  $getEditorTocSnapshot,
  EditorTocExtension,
  EditorTocInsertControl,
  EditorTocRemoveControl,
  editorTocSlashCommand,
  focusEditorTocHeading,
} from "@yopem-ui/editor/toc"
import {
  createEditorTypeahead,
  EditorTypeahead,
  type EditorSlashCommand,
  type MentionIdentity,
} from "@yopem-ui/editor/typeahead"
import { $getRoot } from "lexical"
import {
  BoldIcon,
  ClockIcon,
  CodeIcon,
  FileTextIcon,
  GripVerticalIcon,
  HomeIcon,
  InfoIcon,
  ItalicIcon,
  LockIcon,
  MenuIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  PanelsTopLeftIcon,
  SquarePenIcon,
  TablePropertiesIcon,
  TrashIcon,
  UnderlineIcon,
  UndoIcon,
  RedoIcon,
  UsersIcon,
  UserRoundIcon,
  XIcon,
} from "lucide-react"
import { useRef, useState, useSyncExternalStore } from "react"
import { z } from "zod"

const styles = stylex.create({
  workspace: {
    backgroundColor: tokens["--sidebar"],
    color: tokens["--sidebar-foreground"],
    borderColor: tokens["--border"],
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: tokens["--radius-md"],
    minInlineSize: 0,
    blockSize: "100dvh",
    overflow: "clip",
    containerType: "inline-size",
    containerName: "potion-workspace",
  },
  layout: {
    blockSize: "100%",
    minBlockSize: 0,
    gridTemplateRows: "minmax(0, 1fr)",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      "@container potion-workspace (min-width: 1100px)":
        "18.75rem minmax(0, 1fr)",
    },
  },
  sidebar: {
    display: {
      default: "none",
      "@container potion-workspace (min-width: 1100px)": "flex",
    },
    minBlockSize: 0,
    borderInlineEnd: `1px solid ${tokens["--sidebar-border"]}`,
  },
  sidebarContent: {
    padding: `calc(${tokens["--spacing"]} * 3)`,
    gap: `calc(${tokens["--spacing"]} * 6)`,
    minBlockSize: "100%",
  },
  brand: { gap: `calc(${tokens["--spacing"]} * 2)`, minInlineSize: 0 },
  account: { justifyContent: "space-between", flexWrap: "wrap" },
  navigation: { gap: tokens["--spacing"] },
  pageButton: {
    justifyContent: "flex-start",
    inlineSize: "100%",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
  },
  pageName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  mobile: {
    display: {
      default: "inline-flex",
      "@container potion-workspace (min-width: 1100px)": "none",
    },
  },
  mobileHeader: {
    display: {
      default: "flex",
      "@container potion-workspace (min-width: 1100px)": "none",
    },
    flexShrink: 0,
    padding: `calc(${tokens["--spacing"]} * 3)`,
    gap: `calc(${tokens["--spacing"]} * 2)`,
  },
  sheet: { maxInlineSize: "20rem" },
  canvas: {
    backgroundColor: tokens["--background"],
    color: tokens["--foreground"],
    minInlineSize: 0,
    minBlockSize: 0,
    flex: 1,
    gap: 0,
    borderStartEndRadius: tokens["--radius-md"],
    borderEndEndRadius: tokens["--radius-md"],
  },
  page: { flex: 1, minBlockSize: 0, gap: 0 },
  pageScroll: { flex: 1, minBlockSize: 0 },
  header: {
    justifyContent: "space-between",
    flexWrap: "wrap",
    flexShrink: 0,
    padding: `calc(${tokens["--spacing"]} * 3)`,
    gap: `calc(${tokens["--spacing"]} * 2)`,
  },
  actions: { gap: tokens["--spacing"], flexWrap: "wrap" },
  coarseTarget: {
    minBlockSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
    minInlineSize: { default: null, "@media (pointer: coarse)": "2.75rem" },
  },
  document: {
    inlineSize: "100%",
    maxInlineSize: "52rem",
    containerType: "inline-size",
    marginInline: "auto",
    paddingInline: {
      default: `calc(${tokens["--spacing"]} * 6)`,
      "@media (min-width: 640px)": `calc(${tokens["--spacing"]} * 12)`,
    },
    paddingBlock: {
      default: `calc(${tokens["--spacing"]} * 8)`,
      "@media (min-width: 640px)": `calc(${tokens["--spacing"]} * 16)`,
    },
    gap: `calc(${tokens["--spacing"]} * 4)`,
  },
  fullWidth: { maxInlineSize: "none" },
  outline: {
    maxBlockSize: "12rem",
    overflowY: "auto",
    minInlineSize: 0,
  },
  outlineList: { listStyleType: "none", padding: 0, margin: 0 },
  outlineItem: {
    justifyContent: "flex-start",
    inlineSize: "100%",
    blockSize: "auto",
    minBlockSize: { default: "2rem", "@media (pointer: coarse)": "2.75rem" },
    paddingBlock: `calc(${tokens["--spacing"]} * 1)`,
    whiteSpace: "normal",
    textAlign: "start",
    overflowWrap: "anywhere",
  },
  outlineDepthOne: { paddingInlineStart: `calc(${tokens["--spacing"]} * 2)` },
  outlineDepthTwo: { paddingInlineStart: `calc(${tokens["--spacing"]} * 4)` },
  outlineDepthThree: { paddingInlineStart: `calc(${tokens["--spacing"]} * 6)` },
  outlineDepthFour: { paddingInlineStart: `calc(${tokens["--spacing"]} * 8)` },
  outlineDepthFive: { paddingInlineStart: `calc(${tokens["--spacing"]} * 10)` },
  outlineDepthSix: { paddingInlineStart: `calc(${tokens["--spacing"]} * 12)` },
  title: {
    fontSize: { default: "2rem", "@media (min-width: 640px)": "2.5rem" },
    fontWeight: 600,
    lineHeight: 1.25,
    blockSize: "auto",
    minBlockSize: "3.5rem",
    paddingInline: tokens["--spacing"],
    paddingBlock: `calc(${tokens["--spacing"]} * 2)`,
  },
  titleControl: {
    "--input-control-border": "transparent",
    "--input-control-shadow": "none",
    backgroundColor: tokens["--background"],
  },
  hidden: {
    position: "absolute",
    inlineSize: 1,
    blockSize: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
  },
  meta: { color: tokens["--muted-foreground"], fontSize: "0.875rem" },
  surface: {
    borderWidth: 0,
    borderRadius: 0,
    paddingInline: 0,
    paddingBlock: 0,
    minBlockSize: "20rem",
    fontSize: "1rem",
    overflowWrap: "anywhere",
  },
  serif: { fontFamily: "Georgia, Cambria, serif" },
  mono: { fontFamily: tokens["--font-mono"] },
  small: { fontSize: "0.875rem" },
  selection: { paddingInlineStart: 0 },
  footer: {
    paddingBlock: `calc(${tokens["--spacing"]} * 2)`,
    paddingInline: `calc(${tokens["--spacing"]} * 3)`,
    gap: `calc(${tokens["--spacing"]} * 2)`,
    flexShrink: 0,
  },
  scope: { inlineSize: "24rem", maxInlineSize: "calc(100vw - 2rem)" },
  sidebarFooter: {
    marginBlockStart: "auto",
    gap: `calc(${tokens["--spacing"]} * 3)`,
  },
  unavailable: {
    gap: `calc(${tokens["--spacing"]} * 2)`,
    paddingInline: `calc(${tokens["--spacing"]} * 3)`,
  },
  options: { inlineSize: "15rem", maxInlineSize: "calc(100vw - 2rem)" },
  option: { minBlockSize: "2.75rem" },
  tools: { maxInlineSize: "calc(100vw - 2rem)" },
  cover: {
    backgroundColor: tokens["--muted"],
    color: tokens["--muted-foreground"],
    minBlockSize: "8rem",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
  pageIcon: { fontSize: "2.5rem", lineHeight: 1.25 },
  home: {
    padding: {
      default: `calc(${tokens["--spacing"]} * 6)`,
      "@media (min-width: 640px)": `calc(${tokens["--spacing"]} * 12)`,
    },
    gap: `calc(${tokens["--spacing"]} * 10)`,
    minBlockSize: "40rem",
  },
  homeTitle: { textAlign: "center" },
  cards: {
    gap: `calc(${tokens["--spacing"]} * 4)`,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 9rem), 1fr))",
  },
  card: {
    blockSize: "9rem",
    inlineSize: "100%",
    maxInlineSize: "16rem",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    whiteSpace: "normal",
    textAlign: "start",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    backgroundColor: tokens["--card"],
    color: tokens["--card-foreground"],
    padding: `calc(${tokens["--spacing"]} * 4)`,
  },
  cardIcon: { fontSize: "1.5rem" },
})

const element = { version: 1, direction: null, format: "", indent: 0 }

function text(text: string) {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
  }
}

function paragraph(value: string) {
  return { ...element, type: "paragraph", children: value ? [text(value)] : [] }
}

function createWorkspaceDocument(
  intro: string,
  heading: string,
  detail: string,
) {
  return JSON.stringify({
    root: {
      ...element,
      type: "root",
      children: [
        paragraph(intro),
        { ...element, type: "heading", tag: "h2", children: [text(heading)] },
        paragraph(detail),
        paragraph(""),
      ],
    },
  })
}

interface WorkspacePage {
  id: WorkspacePageId
  title: string
  icon: string
  document: string
  note?: string
  font?: "default" | "serif" | "mono"
  small?: boolean
  fullWidth?: boolean
  locked?: boolean
  cover?: boolean
  showIcon?: boolean
  words?: number
  prepared?: PreparedWorkspaceDocument
}

const initialPages = [
  {
    id: "link",
    title: "Link",
    icon: "🔗",
    document: JSON.stringify({
      root: {
        ...element,
        type: "root",
        children: [
          paragraph("Keep useful references beside your writing."),
          {
            ...element,
            type: "paragraph",
            children: [
              {
                ...element,
                type: "link",
                url: "https://example.com/",
                target: null,
                rel: "noreferrer",
                title: null,
                children: [text("Example reference")],
              },
              text(
                " opens native link actions when you place the caret inside it.",
              ),
            ],
          },
          paragraph(""),
        ],
      },
    }),
  },
  {
    id: "mention",
    title: "Mention",
    icon: "👤",
    document: createWorkspaceDocument(
      "Record the people who can answer your project questions.",
      "Project contacts",
      "Type @Ada, @Grace, or @Katherine to select a demo identity.",
    ),
    note: "Demo fixture identities only. Serialized mention IDs grant no access. No account or directory service is connected.",
  },
  {
    id: "playground",
    title: "Playground",
    icon: "🌳",
    document: JSON.stringify({
      root: {
        ...element,
        type: "root",
        children: [
          paragraph(
            "Try native formatting, checklists, tables, and block actions in this local draft.",
          ),
          {
            ...element,
            type: "heading",
            tag: "h2",
            children: [text("Draft checklist")],
          },
          {
            ...element,
            type: "list",
            listType: "check",
            tag: "ul",
            start: 1,
            children: ["Write a short introduction", "Review the draft"].map(
              (task, index) => ({
                ...element,
                type: "listitem",
                value: index + 1,
                checked: false,
                children: [text(task)],
              }),
            ),
          },
          {
            ...element,
            type: "table",
            children: [
              ["Topic", "Decision"],
              ["Scope", "One local draft"],
            ].map((row, index) => ({
              ...element,
              type: "tablerow",
              children: row.map((value) => ({
                ...element,
                type: "tablecell",
                headerState: index === 0 ? 1 : 0,
                colSpan: 1,
                rowSpan: 1,
                backgroundColor: null,
                children: [paragraph(value)],
              })),
            })),
          },
          paragraph(""),
        ],
      },
    }),
  },
  {
    id: "ai",
    title: "AI",
    icon: "🧠",
    document: createWorkspaceDocument(
      "Collect a writing brief before you request assistance.",
      "Prepare your prompt",
      "Describe the audience, the result, and the constraints. Keep private information out of prompts sent to external services.",
    ),
    note: "AI needs a host endpoint, authentication, document policy, and quota. No model or paid service is connected.",
  },
  {
    id: "copilot",
    title: "Copilot",
    icon: "🤖",
    document: createWorkspaceDocument(
      "Write a first sentence in your own words.",
      "Continue the thought",
      "Keep notes about the next idea here. This local page does not request automatic completions.",
    ),
    note: "Copilot needs explicit host configuration and permission. No completion service is connected.",
  },
  {
    id: "callout",
    title: "Callout",
    icon: "📢",
    document: JSON.stringify({
      root: {
        ...element,
        type: "root",
        children: [
          paragraph("Use a callout to keep an important decision visible."),
          {
            ...element,
            type: "editor-callout",
            appearance: "neutral",
            icon: "",
            children: [
              paragraph("Review the scope before you start the next draft."),
            ],
          },
          paragraph(
            "Type /callout in an empty paragraph to insert another callout.",
          ),
          paragraph(""),
        ],
      },
    }),
  },
  {
    id: "equation",
    title: "Equation",
    icon: "🧮",
    document: createWorkspaceDocument(
      "Keep calculation notes with the assumptions that support them.",
      "Working formula",
      "Place the caret in this document. Use the equation controls to insert or edit native TeX equations.",
    ),
    note: "Equations use bounded TeX and native MathML. Rendering depends on browser MathML support.",
  },
  {
    id: "upload",
    title: "Upload",
    icon: "📤",
    document: createWorkspaceDocument(
      "Prepare an asset list before you attach files.",
      "Asset checklist",
      "Record each file name, purpose, owner, and access requirements here. Do not paste private download credentials.",
    ),
    note: "Insert images by URL only. No file upload service is connected. Use HTTPS without credentials, queries, or fragments. Other URLs cannot save.",
  },
  {
    id: "slash-menu",
    title: "Slash Menu",
    icon: "/",
    document: createWorkspaceDocument(
      "Insert native blocks without leaving the keyboard.",
      "Choose a block",
      "Type / in an empty paragraph. Use the arrow keys and Enter to choose a command. Escape closes suggestions.",
    ),
  },
  {
    id: "block-menu",
    title: "Block Menu",
    icon: "📋",
    document: createWorkspaceDocument(
      "Work with complete blocks while keeping native selection.",
      "Block actions",
      "Right-click a block or press Shift+F10. Use Block controls for gutter selection and keyboard movement.",
    ),
  },
  {
    id: "floating-toolbar",
    title: "Floating Toolbar",
    icon: "🧰",
    document: createWorkspaceDocument(
      "Select a phrase to reveal focused formatting controls.",
      "Format a selection",
      "Use bold, italic, underline, or inline code. Press Alt+F10 to focus the toolbar. Escape returns focus to the editor.",
    ),
  },
  {
    id: "media-toolbar",
    title: "Media Toolbar",
    icon: "🎮",
    document: createWorkspaceDocument(
      "Plan media captions and placement before adding assets.",
      "Caption notes",
      "Insert an image by URL. Select the image to change its source, plain caption, width, or alignment.",
    ),
    note: "URL-only images. No upload service is connected. Use HTTPS without credentials, queries, or fragments. Other URLs cannot save.",
  },
  {
    id: "table-of-contents",
    title: "Table of Contents",
    icon: "📚",
    document: JSON.stringify({
      root: {
        ...element,
        type: "root",
        children: [
          { type: "editor-toc", version: 1 },
          {
            ...element,
            type: "heading",
            tag: "h2",
            children: [text("Document outline")],
          },
          paragraph(
            "Use heading blocks for major topics. Contents links follow these native headings.",
          ),
          {
            ...element,
            type: "heading",
            tag: "h2",
            children: [text("Next steps")],
          },
          paragraph(
            "Type /toc in an empty paragraph to insert another table of contents.",
          ),
          paragraph(""),
        ],
      },
    }),
  },
] as const

type WorkspacePageId = (typeof initialPages)[number]["id"]

interface PreparedWorkspaceDocument {
  initialState: ReturnType<typeof parseDocument>
  automatic: boolean
  state: "ready" | "saved" | "memory-only" | "rejected"
  error: string | null
}

const workspaceNodeSchema = z.object({
  type: z.enum([
    "root",
    "paragraph",
    "text",
    "linebreak",
    "tab",
    "heading",
    "quote",
    "link",
    "autolink",
    "list",
    "listitem",
    "code",
    "code-highlight",
    "table",
    "tablerow",
    "tablecell",
    "editor-callout",
    "editor-toggle",
    "editor-toggle-summary",
    "editor-toggle-body",
    "mention",
    "editor-math",
    "editor-toc",
    "yopem-media",
  ]),
  children: z.array(z.unknown()).optional(),
  $: z.record(z.string(), z.unknown()).optional(),
  $slots: z.record(z.string(), z.unknown()).optional(),
})

function workspaceDocument(source: string) {
  const document = parseDocument(source, "json")
  const pending: unknown[] = [document.root]

  while (pending.length) {
    const node = workspaceNodeSchema.parse(pending.pop())

    if (Object.keys(node.$slots ?? {}).length)
      throw new Error("Workspace nodes cannot own slots.")

    for (const key of Object.keys(node.$ ?? {})) {
      if (
        key !== "editorBlockPresentation" &&
        !(key === "yopemTableBorder" && node.type === "tablecell")
      )
        throw new Error("Workspace NodeState is not registered.")
    }

    if (node.children) pending.push(...node.children)
  }

  return document
}

function workspaceStorageKey(id: WorkspacePageId) {
  return `yopem-ui:notion-like:v1:document:${id}`
}

function prepareWorkspaceDocument(
  page: WorkspacePage,
): PreparedWorkspaceDocument {
  const initialState = workspaceDocument(page.document)
  let saved: string | null

  try {
    saved = window.localStorage.getItem(workspaceStorageKey(page.id))
  } catch {
    return {
      initialState,
      automatic: false,
      state: "memory-only",
      error:
        "Browser storage could not be read. Changes stay in memory and can be lost on reload. Existing storage was not changed.",
    }
  }

  if (saved === null)
    return { initialState, automatic: true, state: "ready", error: null }

  try {
    return {
      initialState: workspaceDocument(saved),
      automatic: true,
      state: "saved",
      error: null,
    }
  } catch {
    return {
      initialState,
      automatic: false,
      state: "rejected",
      error:
        "Saved document data cannot be opened safely. Existing bytes were kept. Changes stay in memory and can be lost on reload.",
    }
  }
}

function saveWorkspaceDocument(
  id: WorkspacePageId,
  editor: LexicalEditor,
  prepared: PreparedWorkspaceDocument,
): PreparedWorkspaceDocument {
  try {
    const source = exportDocument(editor, "json")
    workspaceDocument(source)
    window.localStorage.setItem(workspaceStorageKey(id), source)

    return { ...prepared, state: "saved", error: null }
  } catch {
    return {
      ...prepared,
      automatic: false,
      state: "memory-only",
      error:
        "The current document could not be saved. Changes stay in memory and can be lost on reload. Previous storage was kept.",
    }
  }
}

function WorkspaceDocumentFeedback({
  prepared,
}: {
  prepared: PreparedWorkspaceDocument
}) {
  return (
    <>
      <Box
        render={<output />}
        aria-label="Document save status"
        data-save-state={prepared.state}
        xstyle={styles.meta}
      >
        {prepared.state === "saved"
          ? "Document saved in this browser."
          : prepared.state === "ready"
            ? "New draft. Document edits will save in this browser."
            : "Automatic saving is paused. This draft stays in memory."}
      </Box>
      {prepared.error ? (
        <Box role="alert" aria-label="Document storage error">
          {prepared.error}
        </Box>
      ) : null}
    </>
  )
}

function WorkspaceDocumentReady({
  onReady,
}: {
  onReady: (editor: LexicalEditor) => void
}) {
  const editor = useEditor()
  const ready = useEventCallback(onReady)

  const [attach] = useState(() => {
    let initialized = false

    return function attachReadiness(element: HTMLDivElement | null) {
      if (!element) return

      return editor.registerRootListener((root) => {
        if (!root || initialized) return
        initialized = true
        editor.read(() => ready(editor))
      })
    }
  })

  return <Box ref={attach} xstyle={styles.hidden} />
}

const mentionFixture = [
  { id: "docs-fixture-ada", label: "Ada Lovelace" },
  { id: "docs-fixture-grace", label: "Grace Hopper" },
  { id: "docs-fixture-katherine", label: "Katherine Johnson" },
] satisfies readonly MentionIdentity[]

function loadWorkspaceMentionFixture(query: string, signal: AbortSignal) {
  signal.throwIfAborted()

  if (query.length > 64) return Promise.resolve([])
  const normalizedQuery = query.trim().toLocaleLowerCase("en")

  const results = mentionFixture
    .filter((person) =>
      person.label.toLocaleLowerCase("en").includes(normalizedQuery),
    )
    .slice(0, 8)

  signal.throwIfAborted()

  return Promise.resolve(results)
}

const slashCommands: readonly EditorSlashCommand[] = [
  editorTocSlashCommand(),
  {
    id: "callout",
    label: "Callout",
    description: "Insert a callout",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([CalloutNode])
    },
    run(editor) {
      if (editor.isEditable() && editor.hasNodes([CalloutNode]))
        editor.dispatchCommand(INSERT_EDITOR_CALLOUT_COMMAND, undefined)
    },
  },
]

interface WorkspaceNavigationProps {
  pages: readonly WorkspacePage[]
  activeId: string
  onChoose: (id: string) => void
}

export function WorkspacePages({
  pages,
  activeId,
  onChoose,
}: WorkspaceNavigationProps) {
  const choosePage = useEventCallback(function choosePage(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (!event.defaultPrevented) onChoose(event.currentTarget.value)
  })

  return (
    <Box render={<nav />} aria-label="Workspace pages">
      <Stack xstyle={styles.navigation}>
        {pages.map((page) => (
          <Button
            key={page.id}
            variant={page.id === activeId ? "secondary" : "ghost"}
            aria-current={page.id === activeId ? "page" : undefined}
            xstyle={styles.pageButton}
            value={page.id}
            onClick={choosePage}
          >
            <Box render={<span />} aria-hidden="true">
              {page.icon}
            </Box>
            <Box render={<span />} xstyle={styles.pageName}>
              {page.title || "Untitled"}
            </Box>
          </Button>
        ))}
        {pages.length === 0 ? (
          <Box render={<output />} xstyle={styles.meta}>
            No matching pages
          </Box>
        ) : null}
      </Stack>
    </Box>
  )
}

export function WorkspaceNavigation({
  pages,
  activeId,
  onChoose,
}: WorkspaceNavigationProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  const filtered = pages.filter((page) =>
    page.title.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()),
  )

  return (
    <Stack xstyle={styles.sidebarContent}>
      <Stack xstyle={styles.navigation}>
        <HStack xstyle={styles.account}>
          <HStack xstyle={styles.brand}>
            <UserRoundIcon aria-hidden="true" size={16} />
            <Text xstyle={styles.meta}>Sign in</Text>
          </HStack>
          <SquarePenIcon aria-hidden="true" size={16} />
        </HStack>
        <Text xstyle={styles.meta}>
          Accounts and page creation need host setup.
        </Text>
        <Button
          variant="ghost"
          xstyle={styles.pageButton}
          aria-expanded={searchOpen}
          onClick={(event) => {
            if (!event.defaultPrevented) setSearchOpen((current) => !current)
          }}
        >
          <SearchIcon aria-hidden="true" size={16} />
          Search
        </Button>
        {searchOpen ? (
          <Field>
            <FieldLabel>Search pages</FieldLabel>
            <Input
              name="workspace-search"
              autoComplete="off"
              maxLength={120}
              value={query}
              onChange={(event) => {
                if (!event.defaultPrevented) setQuery(event.currentTarget.value)
              }}
            />
          </Field>
        ) : null}
        <Button
          variant={activeId === "home" ? "secondary" : "ghost"}
          xstyle={styles.pageButton}
          aria-current={activeId === "home" ? "page" : undefined}
          onClick={(event) => {
            if (!event.defaultPrevented) onChoose("home")
          }}
        >
          <HomeIcon aria-hidden="true" size={16} />
          Home
        </Button>
      </Stack>
      <Stack xstyle={styles.navigation}>
        <Text xstyle={styles.meta}>Draft</Text>
        <WorkspacePages
          pages={searchOpen ? filtered : pages}
          activeId={activeId}
          onChoose={onChoose}
        />
      </Stack>
      <Stack xstyle={styles.sidebarFooter}>
        <HStack xstyle={styles.unavailable}>
          <SettingsIcon aria-hidden="true" size={16} />
          <Text xstyle={styles.meta}>Settings</Text>
        </HStack>
        <HStack xstyle={styles.unavailable}>
          <FileTextIcon aria-hidden="true" size={16} />
          <Text xstyle={styles.meta}>Editor</Text>
        </HStack>
        <HStack xstyle={styles.unavailable}>
          <PanelsTopLeftIcon aria-hidden="true" size={16} />
          <Text xstyle={styles.meta}>Templates</Text>
        </HStack>
        <HStack xstyle={styles.unavailable}>
          <TrashIcon aria-hidden="true" size={16} />
          <Text xstyle={styles.meta}>Trash</Text>
        </HStack>
        <Text xstyle={styles.meta}>
          Workspace settings, templates, and trash need host integration. Editor
          tools are available on each page.
        </Text>
      </Stack>
    </Stack>
  )
}

export function WorkspaceMobilePages(props: WorkspaceNavigationProps) {
  const [open, setOpen] = useState(false)

  const choosePage = useEventCallback(function choosePage(id: string) {
    props.onChoose(id)
    setOpen(false)
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" xstyle={styles.mobile} />}
        aria-label="Open workspace pages"
      >
        <MenuIcon aria-hidden="true" size={18} />
      </SheetTrigger>
      <SheetPopup side="left" xstyle={styles.sheet}>
        <SheetHeader>
          <SheetTitle>Workspace pages</SheetTitle>
          <SheetDescription>
            Choose a local page. Valid document edits save in this browser.
          </SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <WorkspaceNavigation
            pages={props.pages}
            activeId={props.activeId}
            onChoose={choosePage}
          />
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  )
}

export function WorkspacePageOptions({
  page,
  onUpdate,
}: {
  page: WorkspacePage
  onUpdate: (patch: Partial<WorkspacePage>) => void
}) {
  const [triggerElement, setTriggerElement] =
    useState<HTMLButtonElement | null>(null)

  return (
    <Menu>
      <MenuTrigger
        ref={setTriggerElement}
        render={
          <Button variant="ghost" size="icon" xstyle={styles.coarseTarget} />
        }
        aria-label="More page options"
      >
        <MoreHorizontalIcon aria-hidden="true" size={18} />
      </MenuTrigger>
      <MenuPopup
        align="end"
        aria-label="Page options"
        portalProps={{
          container: triggerElement?.closest("main") ?? undefined,
        }}
        xstyle={styles.options}
      >
        <MenuRadioGroup
          aria-label="Page font"
          value={page.font ?? "default"}
          onValueChange={(value, details) => {
            if (
              !details.event.defaultPrevented &&
              (value === "default" || value === "serif" || value === "mono")
            )
              onUpdate({ font: value })
          }}
        >
          <MenuRadioItem value="default" xstyle={styles.option}>
            Default
          </MenuRadioItem>
          <MenuRadioItem value="serif" xstyle={[styles.option, styles.serif]}>
            Serif
          </MenuRadioItem>
          <MenuRadioItem value="mono" xstyle={[styles.option, styles.mono]}>
            Mono
          </MenuRadioItem>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuCheckboxItem
          variant="switch"
          checked={page.small ?? false}
          xstyle={styles.option}
          onCheckedChange={(checked, details) => {
            if (!details.event.defaultPrevented) onUpdate({ small: checked })
          }}
        >
          Small text
        </MenuCheckboxItem>
        <MenuCheckboxItem
          variant="switch"
          checked={page.fullWidth ?? false}
          xstyle={styles.option}
          onCheckedChange={(checked, details) => {
            if (!details.event.defaultPrevented)
              onUpdate({ fullWidth: checked })
          }}
        >
          Full width
        </MenuCheckboxItem>
        <MenuCheckboxItem
          variant="switch"
          checked={page.locked ?? false}
          xstyle={styles.option}
          onCheckedChange={(checked, details) => {
            if (!details.event.defaultPrevented) onUpdate({ locked: checked })
          }}
        >
          Lock page
        </MenuCheckboxItem>
      </MenuPopup>
    </Menu>
  )
}

export function WorkspaceHome({
  pages,
  visited,
  onChoose,
}: {
  pages: readonly WorkspacePage[]
  visited: readonly string[]
  onChoose: (id: string) => void
}) {
  return (
    <Stack xstyle={styles.home}>
      <Heading render={<h2>Potion Template</h2>} xstyle={styles.homeTitle} />
      <Box render={<section />} aria-label="Recently visited">
        <Stack>
          <HStack xstyle={styles.brand}>
            <ClockIcon aria-hidden="true" size={16} />
            <Heading render={<h3>Recently visited</h3>} />
          </HStack>
          <Grid xstyle={styles.cards}>
            {visited.map((id) => {
              const page = pages.find((entry) => entry.id === id)

              if (!page) return null

              return (
                <Button
                  key={id}
                  variant="outline"
                  xstyle={styles.card}
                  onClick={(event) => {
                    if (!event.defaultPrevented) onChoose(id)
                  }}
                >
                  <Box
                    render={<span />}
                    aria-hidden="true"
                    xstyle={styles.cardIcon}
                  >
                    {page.icon}
                  </Box>
                  <Box render={<span />}>{page.title || "Untitled"}</Box>
                </Button>
              )
            })}
          </Grid>
        </Stack>
      </Box>
      <Text xstyle={styles.meta}>
        Open a draft from the sidebar. Only pages visited in this preview appear
        here.
      </Text>
    </Stack>
  )
}

export function WorkspacePageTitle({
  page,
  writable,
  onUpdate,
}: {
  page: WorkspacePage
  writable: boolean
  onUpdate: (patch: Partial<WorkspacePage>) => void
}) {
  const fontStyle =
    page.font === "serif"
      ? styles.serif
      : page.font === "mono"
        ? styles.mono
        : null

  return (
    <>
      <Wrap xstyle={styles.actions}>
        <Menu>
          <MenuTrigger
            render={<Button variant="ghost" size="sm" disabled={!writable} />}
          >
            {page.showIcon ? "Change icon" : "Add icon"}
          </MenuTrigger>
          <MenuPopup aria-label="Page icon" align="start">
            {initialPages.map((entry) => (
              <MenuItem
                key={entry.id}
                xstyle={styles.option}
                onClick={(event) => {
                  if (!event.defaultPrevented && writable)
                    onUpdate({ icon: entry.icon, showIcon: true })
                }}
              >
                <Box render={<span />} aria-hidden="true">
                  {entry.icon}
                </Box>
                {entry.title}
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuItem
              disabled={!page.showIcon}
              xstyle={styles.option}
              onClick={(event) => {
                if (!event.defaultPrevented && writable)
                  onUpdate({ showIcon: false })
              }}
            >
              Remove icon
            </MenuItem>
          </MenuPopup>
        </Menu>
        {!page.cover ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={!writable}
            onClick={(event) => {
              if (!event.defaultPrevented && writable) onUpdate({ cover: true })
            }}
          >
            Add cover
          </Button>
        ) : null}
      </Wrap>
      {page.showIcon ? (
        <Box aria-hidden="true" xstyle={styles.pageIcon}>
          {page.icon}
        </Box>
      ) : null}
      <Field>
        <FieldLabel xstyle={styles.hidden}>Page title</FieldLabel>
        <Input
          aria-label="Page title"
          name="page-title"
          autoComplete="off"
          value={page.title}
          readOnly={!writable}
          maxLength={120}
          placeholder="Untitled"
          onChange={(event) => {
            if (!event.defaultPrevented && writable)
              onUpdate({ title: event.currentTarget.value.slice(0, 120) })
          }}
          xstyle={[styles.title, fontStyle]}
          controlXstyle={styles.titleControl}
        />
      </Field>
    </>
  )
}

function WorkspaceFeatureControls({ pageId }: { pageId: WorkspacePageId }) {
  if (pageId === "equation")
    return (
      <EditorToolbar aria-label="Workspace equation tools">
        <EditorMathControls />
      </EditorToolbar>
    )

  if (pageId === "table-of-contents")
    return (
      <EditorToolbar aria-label="Workspace contents tools">
        <Wrap>
          <EditorTocInsertControl />
          <EditorTocRemoveControl />
        </Wrap>
      </EditorToolbar>
    )

  if (pageId !== "media-toolbar" && pageId !== "upload") return null

  return (
    <Stack>
      <EditorToolbar aria-label="Workspace image insertion">
        <MediaInsertControl kind="image" />
      </EditorToolbar>
      <MediaActions>
        <Fieldset aria-label="Selected image controls">
          <Stack>
            <Wrap>
              <MediaEditControl />
              <MediaAlignButton alignment="start" />
              <MediaAlignButton alignment="center" />
              <MediaAlignButton alignment="end" />
              <MediaDeleteButton />
            </Wrap>
            <Field>
              <FieldLabel>Selected caption</FieldLabel>
              <MediaCaptionTextarea />
            </Field>
            <MediaImageResize />
          </Stack>
        </Fieldset>
      </MediaActions>
    </Stack>
  )
}

const outlineDepthStyles = [
  styles.outlineDepthOne,
  styles.outlineDepthTwo,
  styles.outlineDepthThree,
  styles.outlineDepthFour,
  styles.outlineDepthFive,
  styles.outlineDepthSix,
] as const

function preventOutlineMouseDown(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault()
}

function WorkspacePageOutlineItem({
  editor,
  heading,
  active,
}: {
  editor: LexicalEditor
  heading: EditorTocHeading
  active: boolean
}) {
  const [navigate] = useState(() => {
    const key = heading.key

    return function navigate(event: MouseEvent<HTMLButtonElement>) {
      if (!event.defaultPrevented) focusEditorTocHeading(editor, key)
    }
  })

  return (
    <ListItem>
      <Button
        variant={active ? "secondary" : "ghost"}
        size="sm"
        xstyle={[styles.outlineItem, outlineDepthStyles[heading.depth - 1]]}
        aria-current={active ? "location" : undefined}
        onMouseDown={preventOutlineMouseDown}
        onClick={navigate}
      >
        {heading.title}
      </Button>
    </ListItem>
  )
}

function WorkspacePageOutline() {
  const editor = useEditor()
  const { editable } = useEditorState()

  const state = useSyncExternalStore(
    (listener) => editor.registerUpdateListener(listener),
    () => editor.getEditorState(),
    () => editor.getEditorState(),
  )

  const snapshot = state.read($getEditorTocSnapshot)

  return (
    <Box render={<nav />} aria-label="Page outline" xstyle={styles.outline}>
      <Text xstyle={styles.meta}>Page outline</Text>
      <List xstyle={styles.outlineList}>
        {snapshot.headings.map((heading) => (
          <WorkspacePageOutlineItem
            key={heading.key}
            editor={editor}
            heading={heading}
            active={editable && snapshot.activeKey === heading.key}
          />
        ))}
      </List>
    </Box>
  )
}

export function WorkspaceDocument({
  page,
  prepared,
  editable,
  onDocumentChange,
  onUpdate,
  onToggleEditable,
}: {
  page: WorkspacePage
  prepared: PreparedWorkspaceDocument
  editable: boolean
  onDocumentChange: (
    id: WorkspacePageId,
    state: EditorState,
    prepared: PreparedWorkspaceDocument,
  ) => void
  onUpdate: (patch: Partial<WorkspacePage>) => void
  onToggleEditable: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const [blockControls, setBlockControls] = useState(false)
  const [initialState] = useState(() => prepared.initialState)

  const session = useRef({
    ready: false,
    baseline: page.document,
    prepared,
  })

  const writable = editable && !page.locked

  const fontStyle =
    page.font === "serif"
      ? styles.serif
      : page.font === "mono"
        ? styles.mono
        : null

  const [setup] = useState(() => {
    const typeahead = createEditorTypeahead({
      commands: slashCommands,
      mentions: { load: loadWorkspaceMentionFixture },
    })

    const blocks = createEditorBlockSelection({ authorizeCut: () => true })
    const menu = createEditorBlockMenu()

    return {
      typeahead,
      blocks,
      menu,
      extensions: [
        EditorBlocksExtension,
        EditorBlockPresentationExtension,
        EditorTablePresentationExtension,
        EditorMathExtension,
        EditorTocExtension,
        MediaExtension,
        typeahead.extension,
        blocks.extension,
        menu.extension,
      ],
    }
  })

  const changeDocument = useEventCallback(function changeDocument(
    state: EditorState,
    editor: LexicalEditor,
  ) {
    const source = JSON.stringify(state.toJSON())

    if (source === session.current.baseline) return
    session.current.baseline = source

    if (session.current.ready && session.current.prepared.automatic)
      session.current.prepared = saveWorkspaceDocument(
        page.id,
        editor,
        session.current.prepared,
      )

    session.current.prepared = {
      ...session.current.prepared,
      initialState: state.toJSON(),
    }
    onDocumentChange(page.id, state, session.current.prepared)
  })

  const ready = useEventCallback(function ready(editor: LexicalEditor) {
    changeDocument(editor.getEditorState(), editor)
    session.current.ready = true
  })

  const toggleBlockControls = useEventCallback(function toggleBlockControls(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (event.defaultPrevented) return
    setup.blocks.clear()
    setBlockControls((current) => !current)
  })

  return (
    <EditorRoot
      ariaLabel="Workspace document"
      editable={writable}
      initialState={initialState}
      extensions={setup.extensions}
      onChange={changeDocument}
      xstyle={styles.canvas}
    >
      <HStack xstyle={styles.header}>
        <HStack xstyle={styles.brand}>
          <Text xstyle={[styles.meta, styles.pageName]}>
            {page.title || "Untitled"}
          </Text>
          {page.locked ? <LockIcon aria-label="Page locked" size={16} /> : null}
        </HStack>
        <HStack xstyle={styles.actions}>
          <EditorToolbar aria-label="Workspace history and table tools">
            <EditorHistoryButton
              action="undo"
              aria-label="Undo"
              title="Undo"
              render={<Button size="icon" variant="ghost" />}
            >
              <UndoIcon aria-hidden="true" size={16} />
            </EditorHistoryButton>
            <EditorHistoryButton
              action="redo"
              aria-label="Redo"
              title="Redo"
              render={<Button size="icon" variant="ghost" />}
            >
              <RedoIcon aria-hidden="true" size={16} />
            </EditorHistoryButton>
          </EditorToolbar>
          <Button
            variant={blockControls ? "secondary" : "ghost"}
            size="icon"
            aria-label="Block controls"
            aria-pressed={blockControls}
            onClick={toggleBlockControls}
          >
            <GripVerticalIcon aria-hidden="true" size={16} />
          </Button>
          <Popover>
            <PopoverTrigger
              render={<Button variant="ghost" size="icon" />}
              aria-label="Editor tools"
            >
              <SettingsIcon aria-hidden="true" size={16} />
            </PopoverTrigger>
            <PopoverPopup align="end" xstyle={styles.tools}>
              <Stack>
                <PopoverTitle>Editor tools</PopoverTitle>
                <EditorToolbar aria-label="Workspace table tools">
                  <EditorTableMenu
                    aria-label="Table actions"
                    title="Table actions"
                    render={<Button variant="ghost" size="icon-sm" />}
                  >
                    <TablePropertiesIcon aria-hidden="true" size={16} />
                  </EditorTableMenu>
                </EditorToolbar>
              </Stack>
            </PopoverPopup>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              editable ? "Make workspace read-only" : "Edit workspace"
            }
            onClick={onToggleEditable}
          >
            {editable ? (
              <LockIcon aria-hidden="true" size={16} />
            ) : (
              <SquarePenIcon aria-hidden="true" size={16} />
            )}
          </Button>
          <WorkspacePageOptions page={page} onUpdate={onUpdate} />
        </HStack>
      </HStack>
      <ScrollArea
        aria-label="Page document"
        overscrollContain
        xstyle={styles.pageScroll}
      >
        {page.cover ? (
          <HStack data-testid="workspace-cover" xstyle={styles.cover}>
            <Button
              variant="outline"
              disabled={!writable}
              onClick={(event) => {
                if (!event.defaultPrevented && writable)
                  onUpdate({ cover: false })
              }}
            >
              Remove cover
            </Button>
          </HStack>
        ) : null}
        <Stack
          data-testid="workspace-document"
          xstyle={[styles.document, page.fullWidth && styles.fullWidth]}
        >
          <WorkspacePageTitle
            page={page}
            writable={writable}
            onUpdate={onUpdate}
          />
          {page.note ? <Text xstyle={styles.meta}>{page.note}</Text> : null}
          <WorkspaceFeatureControls pageId={page.id} />
          {page.id === "table-of-contents" ? <WorkspacePageOutline /> : null}
          {!writable ? (
            <Box render={<output />} xstyle={styles.meta}>
              Read-only · Navigation and JSON copy remain available.
            </Box>
          ) : null}
          <EditorBlockSelection
            controller={setup.blocks}
            xstyle={!blockControls && styles.selection}
          >
            {blockControls ? <EditorBlockSelectionGutter /> : null}
            <EditorBlockMenu controller={setup.menu}>
              <EditorTypeahead
                controller={setup.typeahead}
                placeholder="Type / for blocks"
                xstyle={[styles.surface, fontStyle, page.small && styles.small]}
              />
            </EditorBlockMenu>
            {blockControls ? (
              <Stack>
                <EditorBlockSelectionActions />
                <EditorBlockSelectionStatus />
              </Stack>
            ) : null}
          </EditorBlockSelection>
          <EditorFloatingToolbar aria-label="Workspace text formatting">
            <EditorFormatButton
              format="bold"
              title="Bold"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <BoldIcon aria-hidden="true" size={16} />
            </EditorFormatButton>
            <EditorFormatButton
              format="italic"
              title="Italic"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <ItalicIcon aria-hidden="true" size={16} />
            </EditorFormatButton>
            <EditorFormatButton
              format="underline"
              title="Underline"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <UnderlineIcon aria-hidden="true" size={16} />
            </EditorFormatButton>
            <EditorFormatButton
              format="code"
              title="Inline code"
              render={<Button variant="ghost" size="icon-sm" />}
            >
              <CodeIcon aria-hidden="true" size={16} />
            </EditorFormatButton>
          </EditorFloatingToolbar>
          <EditorLinkFloatingToolbar />
        </Stack>
      </ScrollArea>
      <Wrap xstyle={styles.footer}>
        <WorkspaceDocumentFeedback prepared={prepared} />
        <Clipboard value={page.document} aria-label="Copy page JSON">
          Copy page JSON
        </Clipboard>
        {page.words !== undefined ? (
          <Text xstyle={styles.meta}>Word count: {page.words}</Text>
        ) : null}
      </Wrap>
      <WorkspaceDocumentReady onReady={ready} />
    </EditorRoot>
  )
}

function PreparedWorkspacePage({
  page,
  onPrepared,
  ...props
}: Omit<Parameters<typeof WorkspaceDocument>[0], "prepared"> & {
  onPrepared: (id: WorkspacePageId, prepared: PreparedWorkspaceDocument) => void
}) {
  const prepare = useEventCallback(function prepare() {
    if (!page.prepared) onPrepared(page.id, prepareWorkspaceDocument(page))
  })

  const [attach] = useState(() => {
    let initialized = false

    return function prepareAfterMount(element: HTMLDivElement | null) {
      if (!element || initialized) return
      initialized = true
      prepare()
    }
  })

  return (
    <Stack ref={attach} xstyle={styles.page}>
      {page.prepared ? (
        <WorkspaceDocument {...props} page={page} prepared={page.prepared} />
      ) : (
        <Box
          render={<output />}
          aria-label="Document save status"
          data-save-state="loading"
        >
          Opening the local document. Editing is not available yet.
        </Box>
      )}
    </Stack>
  )
}

export function NotionLikeExample() {
  const [pages, setPages] = useState<readonly WorkspacePage[]>(initialPages)
  const [activeId, setActiveId] = useState("ai")
  const [visited, setVisited] = useState<readonly string[]>(["ai"])
  const [editable, setEditable] = useState(true)
  const activePage = pages.find((page) => page.id === activeId)

  const choosePage = useEventCallback(function choosePage(id: string) {
    if (id !== "home" && !pages.some((page) => page.id === id)) return
    setActiveId(id)

    if (id !== "home")
      setVisited((current) => [id, ...current.filter((entry) => entry !== id)])
  })

  const updatePage = useEventCallback(function updatePage(
    patch: Partial<WorkspacePage>,
  ) {
    setPages((current) =>
      current.map((page) =>
        page.id === activeId ? { ...page, ...patch } : page,
      ),
    )
  })

  const prepareDocument = useEventCallback(function prepareDocument(
    id: WorkspacePageId,
    prepared: PreparedWorkspaceDocument,
  ) {
    setPages((current) =>
      current.map((page) =>
        page.id === id
          ? {
              ...page,
              document: JSON.stringify(prepared.initialState),
              prepared,
            }
          : page,
      ),
    )
  })

  const changeDocument = useEventCallback(function changeDocument(
    id: WorkspacePageId,
    state: EditorState,
    prepared: PreparedWorkspaceDocument,
  ) {
    const document = JSON.stringify(state.toJSON())

    const words = state.read(
      () =>
        $getRoot().getTextContent().trim().split(/\s+/u).filter(Boolean).length,
    )

    setPages((current) =>
      current.map((page) =>
        page.id === id && (page.document !== document || page.words !== words)
          ? { ...page, document, words, prepared }
          : page,
      ),
    )
  })

  const toggleEditable = useEventCallback(function toggleEditable(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (!event.defaultPrevented) setEditable((current) => !current)
  })

  const activeTitle = activePage ? activePage.title || "Untitled" : "Untitled"

  const mobileNavigation = (
    <WorkspaceMobilePages
      pages={pages}
      activeId={activeId}
      onChoose={choosePage}
    />
  )

  return (
    <Box data-testid="notion-like-workspace" xstyle={styles.workspace}>
      <Grid xstyle={styles.layout}>
        <Box
          render={<aside />}
          data-testid="workspace-sidebar"
          aria-label="Workspace"
          xstyle={styles.sidebar}
        >
          <ScrollArea aria-label="Workspace navigation" overscrollContain fill>
            <WorkspaceNavigation
              pages={pages}
              activeId={activeId}
              onChoose={choosePage}
            />
          </ScrollArea>
        </Box>
        <Stack xstyle={styles.canvas}>
          <HStack xstyle={styles.mobileHeader}>
            {mobileNavigation}
            <Text xstyle={[styles.meta, styles.pageName]}>
              {activeId === "home" ? "Home" : activeTitle}
            </Text>
          </HStack>
          {activeId === "home" ? (
            <ScrollArea
              aria-label="Workspace home"
              overscrollContain
              xstyle={styles.pageScroll}
            >
              <WorkspaceHome
                pages={pages}
                visited={visited}
                onChoose={choosePage}
              />
            </ScrollArea>
          ) : activePage ? (
            <PreparedWorkspacePage
              key={activePage.id}
              onPrepared={prepareDocument}
              page={activePage}
              editable={editable}
              onDocumentChange={changeDocument}
              onUpdate={updatePage}
              onToggleEditable={toggleEditable}
            />
          ) : null}
          <Wrap xstyle={styles.footer}>
            <Text xstyle={styles.meta}>Browser drafts are unencrypted.</Text>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    xstyle={styles.coarseTarget}
                  />
                }
                aria-label="Draft storage and workspace limits"
              >
                <InfoIcon aria-hidden="true" size={16} />
                Workspace limits
              </PopoverTrigger>
              <PopoverPopup side="top" align="end" xstyle={styles.scope}>
                <Stack>
                  <HStack>
                    <PopoverTitle>Workspace limits</PopoverTitle>
                    <PopoverClose
                      render={<Button variant="ghost" size="icon-sm" />}
                      aria-label="Close workspace limits"
                    >
                      <XIcon aria-hidden="true" size={16} />
                    </PopoverClose>
                  </HStack>
                  <Text xstyle={styles.meta}>
                    This Potion-style local shell does not have full Potion
                    parity. Valid native documents save in this browser only.
                  </Text>
                  <Text xstyle={styles.meta}>
                    Titles and page options stay in memory. Page switches and
                    reloads reset undo history and selection.
                  </Text>
                  <Text xstyle={styles.meta}>
                    Storage is unencrypted and accessible to scripts on this
                    origin. Browser storage can be cleared. Other tabs can
                    overwrite documents.
                  </Text>
                  <Text xstyle={styles.meta}>
                    No accounts, remote sync, or conflict resolution are
                    included.
                  </Text>
                  <HStack xstyle={styles.brand}>
                    <UsersIcon aria-hidden="true" size={16} />
                    <MessageSquareIcon aria-hidden="true" size={16} />
                    <ClockIcon aria-hidden="true" size={16} />
                    <Text xstyle={styles.meta}>
                      Collaboration, comments, and version history need host
                      setup.
                    </Text>
                  </HStack>
                  <Text xstyle={styles.meta}>
                    Import and trash are not connected. Export uses active-page
                    JSON copy only. Covers are local neutral banners.
                  </Text>
                </Stack>
              </PopoverPopup>
            </Popover>
          </Wrap>
        </Stack>
      </Grid>
    </Box>
  )
}
