"use client"

import "@excalidraw/excalidraw/index.css"
import type { EditorAiConfig } from "@yopem-ui/editor/ai/client"
import type { EditorCopilotConfig } from "@yopem-ui/editor/copilot"
import type {
  EditorReviewAction,
  EditorReviewHost,
} from "@yopem-ui/editor/review"
import type {
  EditorSlashCommand,
  MentionIdentity,
} from "@yopem-ui/editor/typeahead"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text"
import { $insertNodeToNearestRoot } from "@lexical/utils"
import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Checkbox } from "@registry/components/ui/checkbox"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Fieldset } from "@registry/components/ui/fieldset"
import { HStack } from "@registry/components/ui/hstack"
import { Input } from "@registry/components/ui/input"
import { Label } from "@registry/components/ui/label"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorAiRoot,
  EditorAlignmentButton,
  EditorBackgroundColorControl,
  EditorBlockButton,
  EditorContent,
  EditorBlockPresentationExtension,
  EditorClearFormattingButton,
  EditorFirstLineIndentControl,
  EditorFontColorControl,
  EditorFontFamilyControl,
  EditorFontSizeControl,
  EditorFontWeightControl,
  EditorFormatButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorLinkControl,
  EditorListButton,
  EditorRoot,
  EditorTableButton,
  EditorTableCellPresentation,
  EditorTableDimensions,
  EditorTableMenu,
  EditorTablePresentationExtension,
  EditorTableResizeControls,
  EditorToolbar,
  useEditor,
  useEditorState,
} from "@yopem-ui/editor"
import { EditorAiInlinePreview } from "@yopem-ui/editor/ai-menu-preview"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
import {
  EditorAiMenuContent,
  EditorAiMenuPanel,
  EditorAiMenuRoot,
  EditorAiMenuTrigger,
} from "@yopem-ui/editor/ai/menu"
import { EditorAutoformatExtension } from "@yopem-ui/editor/autoformat"
import { EditorBlockBehaviorExtension } from "@yopem-ui/editor/block-behavior"
import {
  EditorCalloutAppearanceButton,
  EditorCalloutButton,
  EditorDisclosureButton,
  EditorToggleButton,
  EditorBlocksExtension,
  CalloutNode,
  ToggleNode,
  INSERT_EDITOR_CALLOUT_COMMAND,
  INSERT_EDITOR_TOGGLE_COMMAND,
  editorCalloutAppearances,
} from "@yopem-ui/editor/blocks"
import {
  EditorCodeCopyButton,
  EditorCodeExtension,
  EditorCodeLanguage,
  EditorCodeStatus,
  EditorCodeToggle,
  EditorCodeToolbar,
} from "@yopem-ui/editor/code"
import {
  EditorColumnsControls,
  EditorColumnsExtension,
  EditorColumnsGroupNode,
  INSERT_EDITOR_COLUMNS_COMMAND,
} from "@yopem-ui/editor/columns"
import { EditorCopilot } from "@yopem-ui/editor/copilot"
import { EditorCursorOverlay } from "@yopem-ui/editor/cursor-overlay"
import {
  EditorDateControls,
  EditorDateExtension,
  EditorDateNode,
  INSERT_EDITOR_DATE_COMMAND,
} from "@yopem-ui/editor/date"
import { registerDocumentPaste } from "@yopem-ui/editor/document"
import {
  $createEditorDrawingNode,
  EditorDrawingExtension,
  type EditorDrawingScene,
} from "@yopem-ui/editor/drawing"
import {
  EditorDrawingInsertButton,
  registerEditorDrawingRuntime,
} from "@yopem-ui/editor/drawing/browser"
import { EditorFloatingToolbar } from "@yopem-ui/editor/floating-toolbar"
import {
  EditorFootnoteControls,
  EditorFootnoteExtension,
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
  INSERT_EDITOR_FOOTNOTE_COMMAND,
} from "@yopem-ui/editor/footnote"
import {
  EditorListMarkerControl,
  EditorListPresentationExtension,
  EditorListStartControl,
} from "@yopem-ui/editor/list-presentation"
import {
  $insertEditorMath,
  EditorMathControl,
  EditorMathExtension,
  EditorMathNode,
} from "@yopem-ui/editor/math"
import {
  MediaExtension,
  MediaInsertControl,
  mediaKinds,
} from "@yopem-ui/editor/media"
import {
  EditorReviewCreateControl,
  EditorReviewDiffControl,
  EditorReviewModeControl,
  EditorReviewPanel,
  EditorReviewProvider,
  createEditorReview,
  parseReviewDocument,
} from "@yopem-ui/editor/review"
import {
  EditorSearchInput,
  EditorSearchNextButton,
  EditorSearchPreviousButton,
  EditorSearchRoot,
  EditorSearchStatus,
  EditorSearchViewport,
} from "@yopem-ui/editor/search"
import {
  createEditorTypeahead,
  editorEmojiInventory,
  EditorTypeahead,
} from "@yopem-ui/editor/typeahead"
import {
  EditorWordClipboardExtension,
  registerWordClipboardPaste,
} from "@yopem-ui/editor/word-clipboard"
import {
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  defineExtension,
  HISTORY_PUSH_TAG,
  RootNode,
} from "lexical"
import {
  useId,
  useReducer,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react"

type Locale = "en" | "cn"

type BooleanStateAction = boolean | "indeterminate" | "toggle"

function booleanStateReducer(current: boolean, action: BooleanStateAction) {
  if (action === true || action === false) return action

  if (action === "indeterminate") return false

  return !current
}

type Variant =
  | "normal"
  | "copilot"
  | "listClassic"
  | "forced-layout"
  | "drawing"

const copy = {
  en: {
    editor: "Integrated playground editor",
    resetNotice:
      "Changing locale or variant resets this local document and host setup.",
    seedTitle: "Integrated native editor",
    seedIntro: "This sample combines ",
    seedFeatures: "native Lexical features",
    seedOutro: " with local review state.",
    seedKeyboard: "Keyboard and pointer editing",
    seedHistory: "Native undo and redo",
    seedEquation: "Equation: ",
    seedDate: " · Review date: ",
    seedFirstColumn: "First column",
    seedSecondColumn: "Second column",
    seedNote: "See note ",
    seedFootnote: "Native footnote definition.",
    seedAnchor: "Review anchor for the local sample.",
    seedEnd: "End of sample.",
    seedComment: "The sample keeps this review anchor in native Lexical state.",
    seedClassic: "Classic ordered item",
    seedForcedLayout: "Forced layout paragraph seed",
    placeholder: "Edit the native Lexical sample. Type / for block commands.",
    toolbar: "Integrated editor tools",
    codeToolbar: "Code tools",
    search: "Search document",
    searchPlaceholder: "Find in this document",
    previous: "Previous match",
    next: "Next match",
    normal: "Normal",
    copilot: "Copilot",
    listClassic: "List classic",
    forcedLayout: "Forced layout",
    drawing: "Excalidraw",
    drawingReadOnly: "Read-only drawing editor",
    drawingAssets: "Self-hosted Excalidraw assets are installed",
    drawingAssetPath: "Self-hosted Excalidraw asset path",
    drawingNotice:
      "Scenes keep bounded native shapes and text. Files and embedded URLs are not supported.",
    drawingAssetNotice:
      "This preview imports Excalidraw CSS. Serve SDK fonts at /assets/excalidraw/ and allow them in Content Security Policy. Missing local fonts can trigger fallback-host requests.",
    drawingAssetGate:
      "Confirm that self-hosted Excalidraw assets are installed to enable drawing tools.",
    insertDrawingFixture: "Insert shape fixture",
    localPolicy:
      "Review controls use a local fixture policy, not authentication.",
    noEndpoint: "No endpoint is configured.",
    hostPolicy:
      "The server must check current authentication, exact Origin, CSRF, document access, ai:invoke permission, model, and quota. Client setup grants no permission.",
    configureAiMenu: "Configure AI menu",
    selectionAiCommands: "Selection AI commands",
    askAboutSelection: "Ask about selection",
    readOnlyShortcut: "Press Alt+Shift+R to toggle editor read-only state.",
    makeReadOnly: "Make editor read-only",
    enableEditing: "Enable editor editing",
    wordPasteNotice:
      "Word paste uses bounded conversion. Images are rejected without a trusted host resolver.",
    nativeJsonNotice:
      "Copy or download native Lexical JSON. Import stays unavailable because no full validator covers every playground node.",
    copyNativeJson: "Copy native JSON",
    downloadNativeJson: "Download native JSON",
    nativeJsonCopied: "Native JSON copied.",
    nativeJsonCopyError: "Clipboard access is unavailable.",
    nativeJsonDownloaded: "Native JSON download started.",
    endpoint: "Host endpoint",
    documentId: "Host document ID",
    csrf: "Host CSRF token",
    configure: "Configure Copilot",
    invalidConfig:
      "Use a valid same-origin endpoint, document ID, and CSRF token.",
    copilotNotice:
      "Copilot has no default endpoint. Press Control+Space at a paragraph end to request text.",
  },
  cn: {
    editor: "集成编辑器",
    resetNotice: "切换语言或变体会重置本地文档和主机配置。",
    seedTitle: "集成原生编辑器",
    seedIntro: "此示例将",
    seedFeatures: "原生 Lexical 功能",
    seedOutro: "与本地审阅状态组合。",
    seedKeyboard: "键盘和指针编辑",
    seedHistory: "原生撤销和重做",
    seedEquation: "公式：",
    seedDate: " · 审阅日期：",
    seedFirstColumn: "第一列",
    seedSecondColumn: "第二列",
    seedNote: "参见脚注 ",
    seedFootnote: "原生脚注定义。",
    seedAnchor: "本地示例的审阅锚点。",
    seedEnd: "示例结束。",
    seedComment: "此示例将审阅锚点保存在原生 Lexical 状态中。",
    seedClassic: "经典有序列表项",
    seedForcedLayout: "强制布局段落示例",
    placeholder: "编辑原生 Lexical 示例。输入 / 查看块命令。",
    toolbar: "集成编辑器工具",
    codeToolbar: "代码工具",
    search: "搜索文档",
    searchPlaceholder: "查找文档内容",
    previous: "上一处匹配",
    next: "下一处匹配",
    normal: "普通",
    copilot: "Copilot",
    listClassic: "经典列表",
    forcedLayout: "强制布局",
    drawing: "Excalidraw",
    drawingReadOnly: "只读绘图编辑器",
    drawingAssets: "已安装自托管的 Excalidraw 资源",
    drawingAssetPath: "自托管 Excalidraw 资源路径",
    drawingNotice: "场景仅保存受限的原生形状和文本。不支持文件和嵌入式 URL。",
    drawingAssetNotice:
      "加载 Excalidraw 样式表。请从 /assets/excalidraw/ 提供 SDK 字体，并在内容安全策略中允许这些字体。本地字体缺失时，SDK 可能请求备用字体主机。",
    drawingAssetGate: "请确认已安装自托管的 Excalidraw 资源，再启用绘图工具。",
    insertDrawingFixture: "插入形状示例",
    localPolicy: "审阅控件使用本地示例策略，不代表身份验证。",
    noEndpoint: "尚未配置端点。",
    hostPolicy:
      "服务器必须检查当前身份、精确来源、CSRF、文档访问权限、ai:invoke 权限、模型和配额。客户端设置不会授予权限。",
    configureAiMenu: "配置 AI 菜单",
    selectionAiCommands: "选择文本的 AI 命令",
    askAboutSelection: "询问所选内容",
    readOnlyShortcut: "按 Alt+Shift+R 切换编辑器只读状态。",
    makeReadOnly: "将编辑器设为只读",
    enableEditing: "启用编辑器",
    wordPasteNotice: "Word 粘贴使用受限转换。没有可信主机解析器时会拒绝图像。",
    nativeJsonNotice:
      "复制或下载原生 Lexical JSON。缺少覆盖所有示例节点的完整验证器，因此不提供导入。",
    copyNativeJson: "复制原生 JSON",
    downloadNativeJson: "下载原生 JSON",
    nativeJsonCopied: "已复制原生 JSON。",
    nativeJsonCopyError: "剪贴板不可用。",
    nativeJsonDownloaded: "已开始下载原生 JSON。",
    endpoint: "主机端点",
    documentId: "主机文档 ID",
    csrf: "主机 CSRF 令牌",
    configure: "配置 Copilot",
    invalidConfig: "请使用有效的同源端点、文档 ID 和 CSRF 令牌。",
    copilotNotice:
      "Copilot 没有默认端点。在段落末尾按 Control+Space 请求文本。",
  },
} satisfies Record<Locale, Record<string, string>>

function AiMenuComposition({
  config,
  children,
}: {
  config?: EditorAiConfig
  children: ReactNode
}) {
  if (!config) return children

  return (
    <EditorAiRoot config={config}>
      <EditorAiMenuRoot>{children}</EditorAiMenuRoot>
    </EditorAiRoot>
  )
}

function PlaygroundAiParts({
  locale,
  review,
}: {
  locale: Locale
  review: ReturnType<typeof createEditorReview>
}) {
  const editor = useEditor()
  const binding = review.forEditor(editor)
  const labels = copy[locale]

  return (
    <>
      <EditorAiMenuPanel review={binding} />
      <EditorFloatingToolbar aria-label={labels.selectionAiCommands}>
        <EditorAiMenuTrigger>{labels.askAboutSelection}</EditorAiMenuTrigger>
      </EditorFloatingToolbar>
      <EditorAiInlinePreview />
    </>
  )
}

function NativeJsonControls({ locale }: { locale: Locale }) {
  const editor = useEditor()
  const labels = copy[locale]
  const [message, setMessage] = useState("")

  function serializeNativeState() {
    return JSON.stringify(editor.getEditorState().toJSON(), null, 2)
  }

  async function copyNativeJson() {
    try {
      await navigator.clipboard.writeText(serializeNativeState())
      setMessage(labels.nativeJsonCopied)
    } catch {
      setMessage(labels.nativeJsonCopyError)
    }
  }

  function downloadNativeJson() {
    const url = URL.createObjectURL(
      new Blob([serializeNativeState()], { type: "application/json" }),
    )

    const link = document.createElement("a")
    link.href = url
    link.download = "public-playground-native.json"
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
    setMessage(labels.nativeJsonDownloaded)
  }

  return (
    <Stack>
      <Text>{labels.nativeJsonNotice}</Text>
      <HStack>
        <Button onClick={copyNativeJson}>{labels.copyNativeJson}</Button>
        <Button onClick={downloadNativeJson}>
          {labels.downloadNativeJson}
        </Button>
      </HStack>
      {message ? <Box render={<output />}>{message}</Box> : null}
    </Stack>
  )
}

function WordClipboardRegistration({ locale }: { locale: Locale }) {
  const editor = useEditor()
  const labels = copy[locale]
  const [error, setError] = useState("")

  const [connect] = useState(
    () =>
      function connect() {
        const onError = (failure: Error) => setError(failure.message)
        const unregisterDocument = registerDocumentPaste(editor, onError)

        try {
          const unregisterWord = registerWordClipboardPaste(editor, onError)

          return () => {
            unregisterWord()
            unregisterDocument()
          }
        } catch (cause) {
          unregisterDocument()
          throw cause
        }
      },
  )

  return (
    <Stack ref={connect}>
      <Text>{labels.wordPasteNotice}</Text>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

const anchorId = "public-playground-anchor"

const reviewAuthor = { id: "playground-reviewer", name: "Playground reviewer" }

const elementFields = { direction: null, format: "", indent: 0, version: 1 }

function textNode(text: string, format = 0) {
  return {
    type: "text",
    version: 1,
    text,
    detail: 0,
    format,
    mode: "normal",
    style: "",
  }
}

function paragraph(children: object[]) {
  return { ...elementFields, type: "paragraph", children }
}

function heading(text: string) {
  return {
    ...elementFields,
    type: "heading",
    tag: "h1",
    children: [textNode(text)],
  }
}

function reviewerCan(
  action: EditorReviewAction,
  targetId: string | undefined,
  viewer: Parameters<EditorReviewHost["can"]>[2],
) {
  return (
    viewer.id === reviewAuthor.id &&
    (action === "create" ||
      action === "suggest" ||
      action === "undo" ||
      action === "redo" ||
      targetId !== undefined)
  )
}

const reviewHost: EditorReviewHost = {
  viewer: reviewAuthor,
  visible: true,
  replyWhileReadonly: false,
  can: reviewerCan,
}

function createInitialState(locale: Locale) {
  const labels = copy[locale]

  return JSON.stringify(
    parseReviewDocument(
      {
        root: {
          ...elementFields,
          type: "root",
          $: {
            yopemReview: {
              version: 1,
              threads: [
                {
                  id: anchorId,
                  resolved: false,
                  comments: [
                    {
                      id: "public-playground-comment",
                      author: reviewAuthor,
                      text: labels.seedComment,
                      createdAt: 1,
                      updatedAt: 1,
                    },
                  ],
                },
              ],
            },
          },
          children: [
            heading(labels.seedTitle),
            paragraph([
              textNode(labels.seedIntro),
              textNode(labels.seedFeatures, 1),
              textNode(labels.seedOutro),
            ]),
            {
              ...elementFields,
              type: "list",
              listType: "bullet",
              tag: "ul",
              start: 1,
              children: [
                {
                  ...elementFields,
                  type: "listitem",
                  value: 1,
                  children: [textNode(labels.seedKeyboard)],
                },
                {
                  ...elementFields,
                  type: "listitem",
                  value: 2,
                  children: [textNode(labels.seedHistory)],
                },
              ],
            },
            {
              ...elementFields,
              type: "code",
              language: "typescript",
              children: [textNode("const answer: number = 42;")],
            },
            paragraph([
              textNode(labels.seedEquation),
              {
                type: "editor-math",
                version: 1,
                kind: "inline",
                tex: "E=mc^2",
              },
              textNode(labels.seedDate),
              { type: "editor-date", version: 1, date: "2025-01-15" },
            ]),
            {
              type: "editor-columns-group",
              version: 1,
              direction: null,
              format: "",
              indent: 0,
              layout: [50, 50],
              children: [
                {
                  type: "editor-column",
                  version: 1,
                  direction: null,
                  format: "",
                  indent: 0,
                  children: [paragraph([textNode(labels.seedFirstColumn)])],
                },
                {
                  type: "editor-column",
                  version: 1,
                  direction: null,
                  format: "",
                  indent: 0,
                  children: [paragraph([textNode(labels.seedSecondColumn)])],
                },
              ],
            },
            paragraph([
              textNode(labels.seedNote),
              {
                type: "editor-footnote-reference",
                version: 1,
                identifier: "1",
              },
              textNode("."),
            ]),
            {
              type: "editor-footnote-definition",
              version: 1,
              identifier: "1",
              direction: null,
              format: "",
              indent: 0,
              children: [paragraph([textNode(labels.seedFootnote)])],
            },
            paragraph([
              {
                type: "mark",
                version: 1,
                direction: null,
                format: "",
                indent: 0,
                ids: [anchorId],
                children: [textNode(labels.seedAnchor)],
              },
            ]),
            paragraph([textNode(labels.seedEnd)]),
          ],
        },
      },
      true,
    ),
  )
}

function createListClassicInitialState(locale: Locale) {
  return JSON.stringify({
    root: {
      ...elementFields,
      type: "root",
      children: [
        {
          ...elementFields,
          type: "list",
          listType: "number",
          tag: "ol",
          start: -2,
          children: [
            {
              ...elementFields,
              type: "listitem",
              value: -2,
              children: [textNode(copy[locale].seedClassic)],
            },
          ],
        },
      ],
    },
  })
}

function createForcedLayoutInitialState(locale: Locale) {
  return JSON.stringify({
    root: {
      ...elementFields,
      type: "root",
      children: [paragraph([textNode(copy[locale].seedForcedLayout)])],
    },
  })
}

const forcedLayoutExtension = defineExtension({
  name: "@docs/public-playground/forced-layout",
  register(editor) {
    return editor.registerNodeTransform(RootNode, (root) => {
      const first = root.getFirstChild()

      if (!first) {
        root.append($createHeadingNode("h1"))

        return
      }

      if ($isParagraphNode(first)) {
        const heading = $createHeadingNode("h1").updateFromJSON({
          ...first.exportJSON(),
          tag: "h1",
        })

        heading.setStyle(first.getStyle())
        heading.append(...first.getChildren())
        first.replace(heading)

        return
      }

      if ($isHeadingNode(first)) {
        if (first.getTag() !== "h1") first.setTag("h1")

        return
      }

      first.insertBefore($createHeadingNode("h1"))
    })
  },
})

const drawingAssetPath = "/assets/excalidraw/"

const drawingDefaults = {
  angle: 0,
  strokeColor: "#000000",
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: 2,
  strokeStyle: "solid",
  roughness: 0,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: null,
  version: 1,
  versionNonce: 1,
  isDeleted: false,
  boundElements: [],
  updated: 1700000000000,
  link: null,
  locked: false,
}

const drawingFixture: EditorDrawingScene = {
  elements: [
    {
      ...drawingDefaults,
      id: "playground-rectangle",
      type: "rectangle",
      x: 60,
      y: 60,
      width: 160,
      height: 120,
      seed: 11,
    },
    {
      ...drawingDefaults,
      id: "playground-ellipse",
      type: "ellipse",
      x: 300,
      y: 80,
      width: 120,
      height: 120,
      seed: 12,
    },
  ],
}

const mentionFixture = [
  { id: "docs-fixture-ada", label: "Ada Lovelace" },
  { id: "docs-fixture-grace", label: "Grace Hopper" },
  { id: "docs-fixture-katherine", label: "Katherine Johnson" },
] satisfies readonly MentionIdentity[]

function loadMentionFixture(query: string, signal: AbortSignal) {
  signal.throwIfAborted()

  if (query.length > 64) return Promise.resolve([])
  const normalizedQuery = query.trim().toLocaleLowerCase("en")

  return Promise.resolve(
    mentionFixture
      .filter((person) =>
        person.label.toLocaleLowerCase("en").includes(normalizedQuery),
      )
      .slice(0, 8),
  )
}

const slashCommands: readonly EditorSlashCommand[] = [
  {
    id: "callout",
    label: "Callout",
    description: "Insert a callout",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([CalloutNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([CalloutNode])) return
      editor.dispatchCommand(INSERT_EDITOR_CALLOUT_COMMAND, undefined)
    },
  },
  {
    id: "toggle",
    label: "Toggle",
    description: "Insert a toggle",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([ToggleNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([ToggleNode])) return
      editor.dispatchCommand(INSERT_EDITOR_TOGGLE_COMMAND, undefined)
    },
  },
  {
    id: "columns",
    label: "Two columns",
    description: "Insert two columns",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorColumnsGroupNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorColumnsGroupNode]))
        return
      editor.dispatchCommand(INSERT_EDITOR_COLUMNS_COMMAND, [50, 50])
    },
  },
  {
    id: "fixed-date",
    label: "Fixed date",
    description: "Insert the fixed date 2025-01-15",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorDateNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorDateNode])) return
      editor.dispatchCommand(INSERT_EDITOR_DATE_COMMAND, "2025-01-15")
    },
  },
  {
    id: "equation-inline",
    label: "Inline equation",
    description: "Insert an inline equation",
    available(editor) {
      return editor.isEditable() && editor.hasNodes([EditorMathNode])
    },
    run(editor) {
      if (!editor.isEditable() || !editor.hasNodes([EditorMathNode])) return
      $insertEditorMath({ kind: "inline", tex: "x^2" })
    },
  },
  {
    id: "footnote",
    label: "Footnote",
    description: "Insert a footnote reference",
    available(editor) {
      return (
        editor.isEditable() &&
        editor.hasNodes([
          EditorFootnoteDefinitionNode,
          EditorFootnoteReferenceNode,
        ])
      )
    },
    run(editor) {
      if (
        !editor.isEditable() ||
        !editor.hasNodes([
          EditorFootnoteDefinitionNode,
          EditorFootnoteReferenceNode,
        ])
      )
        return
      editor.dispatchCommand(INSERT_EDITOR_FOOTNOTE_COMMAND, undefined)
    },
  },
]

function DrawingControls({
  labels,
}: {
  labels: Pick<typeof copy.en, "insertDrawingFixture">
}) {
  const editor = useEditor()
  const { editable } = useEditorState()

  const [connect] = useState(
    () =>
      function registerDrawingRuntime() {
        return registerEditorDrawingRuntime(editor, drawingAssetPath)
      },
  )

  const insertDrawingFixture = useStableCallback(function insertDrawingFixture(
    event: MouseEvent<HTMLButtonElement>,
  ) {
    if (event.defaultPrevented || !editor.isEditable()) return

    editor.update(
      () => {
        if (!editor.isEditable()) return
        const node = $createEditorDrawingNode(drawingFixture)

        if ($isRangeSelection($getSelection())) $insertNodeToNearestRoot(node)
        else $getRoot().append(node)
      },
      { tag: HISTORY_PUSH_TAG },
    )
  })

  return (
    <Stack ref={connect}>
      <EditorToolbar aria-label="Drawing editor tools">
        <EditorDrawingInsertButton />
        <Button disabled={!editable} onClick={insertDrawingFixture}>
          {labels.insertDrawingFixture}
        </Button>
        <EditorHistoryButton action="undo" />
        <EditorHistoryButton action="redo" />
      </EditorToolbar>
    </Stack>
  )
}

function PlaygroundEditor({
  locale,
  variant,
  aiMenuConfig,
  copilotConfig,
}: {
  locale: Locale
  variant: Variant
  aiMenuConfig?: EditorAiConfig
  copilotConfig?: EditorCopilotConfig
}) {
  const labels = copy[locale]
  const [review] = useState(createEditorReview)
  const [readOnly, setReadOnly] = useReducer(booleanStateReducer, false)
  const [assetsReady, setAssetsReady] = useReducer(booleanStateReducer, false)
  const assetPathId = useId()

  const [typeahead] = useState(() =>
    createEditorTypeahead({
      commands: slashCommands,
      emoji: editorEmojiInventory,
      mentions: { load: loadMentionFixture },
    }),
  )

  const [extensions] = useState(() => [
    EditorBlockPresentationExtension,
    EditorTablePresentationExtension,
    EditorCodeExtension,
    EditorBlocksExtension,
    EditorMathExtension,
    EditorColumnsExtension,
    EditorDateExtension,
    MediaExtension,
    EditorFootnoteExtension,
    EditorListPresentationExtension,
    ...(variant === "drawing" ? [] : [EditorWordClipboardExtension]),
    ...(variant === "listClassic" || variant === "drawing"
      ? []
      : [EditorAutoformatExtension, EditorBlockBehaviorExtension]),
    ...(variant === "forced-layout" ? [forcedLayoutExtension] : []),
    ...(variant === "drawing" ? [EditorDrawingExtension] : []),
    review.extension,
    typeahead.extension,
  ])

  const [editorInitialState] = useState(() =>
    variant === "listClassic"
      ? createListClassicInitialState(locale)
      : variant === "forced-layout"
        ? createForcedLayoutInitialState(locale)
        : createInitialState(locale),
  )

  const handleHostShortcut = useStableCallback(function handleHostShortcut(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.nativeEvent.isComposing ||
      !event.altKey ||
      !event.shiftKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.toLowerCase() !== "r"
    )
      return
    event.preventDefault()
    setReadOnly("toggle")
  })

  const toggleReadOnly = useStableCallback(function toggleReadOnly() {
    setReadOnly("toggle")
  })

  return (
    <>
      {variant === "drawing" ? (
        <DrawingSetup
          assetPathId={assetPathId}
          assetsReady={assetsReady}
          labels={labels}
          readOnly={readOnly}
          setAssetsReady={setAssetsReady}
          setReadOnly={setReadOnly}
        />
      ) : null}
      <EditorRoot
        ariaLabel={labels.editor}
        editable={!readOnly}
        extensions={extensions}
        initialState={editorInitialState}
        onKeyDownCapture={handleHostShortcut}
      >
        <EditorReviewProvider controller={review} host={reviewHost}>
          {variant === "drawing" ? (
            <DrawingPlaygroundContent
              assetsReady={assetsReady}
              labels={labels}
              locale={locale}
            />
          ) : (
            <StandardPlaygroundContent
              aiMenuConfig={aiMenuConfig}
              copilotConfig={copilotConfig}
              labels={labels}
              locale={locale}
              readOnly={readOnly}
              review={review}
              toggleReadOnly={toggleReadOnly}
              typeahead={typeahead}
              variant={variant}
            />
          )}
        </EditorReviewProvider>
      </EditorRoot>
    </>
  )
}

function preventAltContextMenu(event: MouseEvent<HTMLDivElement>) {
  if (event.altKey) event.preventDefault()
}

function DrawingSetup({
  assetPathId,
  assetsReady,
  labels,
  readOnly,
  setAssetsReady,
  setReadOnly,
}: {
  assetPathId: string
  assetsReady: boolean
  labels: (typeof copy)[Locale]
  readOnly: boolean
  setAssetsReady: (action: BooleanStateAction) => void
  setReadOnly: (action: BooleanStateAction) => void
}) {
  return (
    <Stack>
      <Text>{labels.drawingNotice}</Text>
      <Text>{labels.drawingAssetNotice}</Text>
      <Field>
        <FieldLabel htmlFor={assetPathId}>{labels.drawingAssetPath}</FieldLabel>
        <Input id={assetPathId} readOnly value={drawingAssetPath} />
      </Field>
      <Label>
        <Checkbox
          aria-label={labels.drawingReadOnly}
          checked={readOnly}
          onCheckedChange={setReadOnly}
        />
        {labels.drawingReadOnly}
      </Label>
      <Label>
        <Checkbox
          aria-label={labels.drawingAssets}
          checked={assetsReady}
          onCheckedChange={setAssetsReady}
        />
        {labels.drawingAssets}
      </Label>
    </Stack>
  )
}

function DrawingPlaygroundContent({
  assetsReady,
  labels,
  locale,
}: {
  assetsReady: boolean
  labels: (typeof copy)[Locale]
  locale: Locale
}) {
  return (
    <>
      <EditorContent
        lang={locale === "cn" ? "zh-CN" : "en"}
        placeholder={labels.placeholder}
      />
      {assetsReady ? (
        <DrawingControls labels={labels} />
      ) : (
        <Text>{labels.drawingAssetGate}</Text>
      )}
    </>
  )
}

function StandardPlaygroundContent({
  aiMenuConfig,
  copilotConfig,
  labels,
  locale,
  readOnly,
  review,
  toggleReadOnly,
  typeahead,
  variant,
}: {
  aiMenuConfig?: EditorAiConfig
  copilotConfig?: EditorCopilotConfig
  labels: (typeof copy)[Locale]
  locale: Locale
  readOnly: boolean
  review: ReturnType<typeof createEditorReview>
  toggleReadOnly: () => void
  typeahead: ReturnType<typeof createEditorTypeahead>
  variant: Variant
}) {
  return (
    <>
      <AiMenuComposition config={aiMenuConfig}>
        <>
          <Text>{labels.readOnlyShortcut}</Text>
          <EditorToolbar aria-label={labels.toolbar}>
            {aiMenuConfig ? <EditorAiMenuTrigger /> : null}
            <EditorFormatButton format="bold">
              {locale === "en" ? "Bold" : "加粗"}
            </EditorFormatButton>
            <EditorFormatButton format="italic">
              {locale === "en" ? "Italic" : "斜体"}
            </EditorFormatButton>
            <EditorFormatButton format="underline">
              {locale === "en" ? "Underline" : "下划线"}
            </EditorFormatButton>
            <EditorAlignmentButton alignment="left" />
            <EditorAlignmentButton alignment="center" />
            <EditorAlignmentButton alignment="right" />
            {variant === "listClassic" ? (
              <>
                <EditorListMarkerControl />
                <EditorListStartControl />
              </>
            ) : (
              <>
                <EditorIndentButton direction="indent" />
                <EditorIndentButton direction="outdent" />
                <EditorListButton listType="bullet" />
                <EditorListButton listType="number" />
                <EditorListButton listType="check" />
              </>
            )}
            {variant !== "listClassic" ? (
              <EditorFirstLineIndentControl />
            ) : null}
            <EditorFontColorControl />
            <EditorBackgroundColorControl />
            <EditorFontFamilyControl />
            <EditorFontSizeControl />
            <EditorFontWeightControl />
            <EditorClearFormattingButton />
            <EditorBlockButton block="h1" />
            {variant === "forced-layout" ? (
              <EditorBlockButton block="paragraph" />
            ) : null}
            <EditorBlockButton block="h2" />
            <EditorBlockButton block="quote" />
            <EditorBlockButton block="code" />
            <EditorLinkControl />
            <EditorTableButton />
            <EditorTableMenu />
            <EditorCalloutButton />
            <EditorToggleButton />
            <EditorDisclosureButton />
            {editorCalloutAppearances.map((appearance) => (
              <EditorCalloutAppearanceButton
                key={appearance}
                appearance={appearance}
              />
            ))}
            <EditorColumnsControls />
            <EditorDateControls initialDate="2025-01-15" />
            <EditorMathControl kind="inline" />
            <EditorMathControl kind="block" />
            <EditorFootnoteControls />
            {mediaKinds.map((kind) => (
              <MediaInsertControl key={kind} kind={kind} />
            ))}
            <EditorHistoryButton action="undo" />
            <EditorHistoryButton action="redo" />
            <Button onClick={toggleReadOnly} variant="outline">
              {readOnly ? labels.enableEditing : labels.makeReadOnly}
            </Button>
          </EditorToolbar>
          <NativeJsonControls locale={locale} />
          <WordClipboardRegistration locale={locale} />
          <EditorCodeToolbar aria-label={labels.codeToolbar}>
            <EditorCodeLanguage
              aria-label={locale === "en" ? "Code language" : "代码语言"}
            />
            <EditorCodeCopyButton
              aria-label={locale === "en" ? "Copy code" : "复制代码"}
            />
            <EditorCodeToggle
              setting="wrap"
              aria-label={locale === "en" ? "Wrap code" : "自动换行"}
            />
            <EditorCodeToggle
              setting="lineNumbers"
              aria-label={locale === "en" ? "Line numbers" : "行号"}
            />
            <EditorCodeStatus />
          </EditorCodeToolbar>
          <EditorTableDimensions />
          <EditorTableResizeControls />
          <EditorTableCellPresentation />
          <EditorReviewModeControl />
          <EditorReviewCreateControl />
          <EditorReviewDiffControl />
          <EditorSearchRoot initialQuery={locale === "cn" ? "审阅" : "review"}>
            <Stack>
              <EditorSearchInput
                aria-label={labels.search}
                placeholder={labels.searchPlaceholder}
              />
              <HStack>
                <EditorSearchPreviousButton>
                  {labels.previous}
                </EditorSearchPreviousButton>
                <EditorSearchNextButton>{labels.next}</EditorSearchNextButton>
                <EditorSearchStatus />
              </HStack>
              <EditorSearchViewport>
                {aiMenuConfig ? (
                  <EditorAiMenuContent
                    aria-label={labels.editor}
                    lang={locale === "cn" ? "zh-CN" : "en"}
                    onContextMenu={preventAltContextMenu}
                    placeholder={labels.placeholder}
                    render={<EditorTypeahead controller={typeahead} />}
                  />
                ) : (
                  <EditorTypeahead
                    aria-label={labels.editor}
                    lang={locale === "cn" ? "zh-CN" : "en"}
                    controller={typeahead}
                    onContextMenu={preventAltContextMenu}
                    placeholder={labels.placeholder}
                  />
                )}
              </EditorSearchViewport>
            </Stack>
          </EditorSearchRoot>
          <EditorReviewPanel />
          {aiMenuConfig ? (
            <PlaygroundAiParts locale={locale} review={review} />
          ) : null}
          {variant === "copilot" && copilotConfig ? (
            <EditorCopilot config={copilotConfig} />
          ) : null}
        </>
      </AiMenuComposition>
      <EditorCursorOverlay />
    </>
  )
}

function HostAiSetup({
  locale,
  mode,
  onConfigure,
}: {
  locale: Locale
  mode: "ai-menu" | "copilot"
  onConfigure: (config: EditorAiConfig) => void
}) {
  const labels = copy[locale]
  const fieldId = useId()
  const [endpoint, setEndpoint] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [csrf, setCsrf] = useState("")
  const [error, setError] = useState("")

  const updateEndpoint = useStableCallback(function updateEndpoint(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setEndpoint(event.currentTarget.value)
  })

  const updateDocumentId = useStableCallback(function updateDocumentId(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setDocumentId(event.currentTarget.value)
  })

  const updateCsrf = useStableCallback(function updateCsrf(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setCsrf(event.currentTarget.value)
  })

  const configure = useStableCallback(function configure() {
    if (!csrf.trim()) {
      setError(labels.invalidConfig)

      return
    }

    const config: EditorAiConfig = {
      endpoint,
      documentId,
      headers: () => ({ "x-csrf-token": csrf }),
    }

    try {
      validateEditorAiConfig(config, window.location.origin)
      setError("")
      onConfigure(config)
    } catch {
      setError(labels.invalidConfig)
    }
  })

  return (
    <Stack>
      <Text>{labels.noEndpoint}</Text>
      <Text>{labels.hostPolicy}</Text>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-endpoint`}>
          {labels.endpoint}
        </FieldLabel>
        <Input
          id={`${fieldId}-endpoint`}
          aria-label={labels.endpoint}
          value={endpoint}
          maxLength={2048}
          onChange={updateEndpoint}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-documentId`}>
          {labels.documentId}
        </FieldLabel>
        <Input
          id={`${fieldId}-documentId`}
          aria-label={labels.documentId}
          value={documentId}
          maxLength={256}
          onChange={updateDocumentId}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-csrf`}>{labels.csrf}</FieldLabel>
        <Input
          id={`${fieldId}-csrf`}
          aria-label={labels.csrf}
          type="password"
          autoComplete="off"
          value={csrf}
          maxLength={4096}
          onChange={updateCsrf}
        />
      </Field>
      <Button
        disabled={!endpoint || !documentId || !csrf.trim()}
        onClick={configure}
      >
        {mode === "ai-menu" ? labels.configureAiMenu : labels.configure}
      </Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicPlaygroundExample() {
  const [locale, setLocale] = useState<Locale>("en")
  const [variant, setVariant] = useState<Variant>("normal")
  const [aiMenuConfig, setAiMenuConfig] = useState<EditorAiConfig>()
  const [copilotConfig, setCopilotConfig] = useState<EditorCopilotConfig>()
  const labels = copy[locale]

  const chooseLocale = useStableCallback(function chooseLocale(next: Locale) {
    if (next === locale) return
    setAiMenuConfig(undefined)
    setCopilotConfig(undefined)
    setLocale(next)
  })

  const chooseVariant = useStableCallback(function chooseVariant(
    next: Variant,
  ) {
    if (next === variant) return
    setAiMenuConfig(undefined)
    setCopilotConfig(undefined)
    setVariant(next)
  })

  const chooseEnglish = useStableCallback(function chooseEnglish() {
    chooseLocale("en")
  })

  const chooseChinese = useStableCallback(function chooseChinese() {
    chooseLocale("cn")
  })

  const chooseNormal = useStableCallback(function chooseNormal() {
    chooseVariant("normal")
  })

  const chooseCopilot = useStableCallback(function chooseCopilot() {
    chooseVariant("copilot")
  })

  const chooseListClassic = useStableCallback(function chooseListClassic() {
    chooseVariant("listClassic")
  })

  const chooseForcedLayout = useStableCallback(function chooseForcedLayout() {
    chooseVariant("forced-layout")
  })

  const chooseDrawing = useStableCallback(function chooseDrawing() {
    chooseVariant("drawing")
  })

  return (
    <Box data-testid="public-playground-workspace">
      <Stack>
        <Text>{labels.localPolicy}</Text>
        <Text>{labels.resetNotice}</Text>
        <Fieldset aria-label={locale === "en" ? "Locale" : "语言"}>
          <Wrap>
            <Button
              aria-label="English"
              aria-pressed={locale === "en"}
              onClick={chooseEnglish}
            >
              English
            </Button>
            <Button
              aria-label="简体中文"
              aria-pressed={locale === "cn"}
              onClick={chooseChinese}
            >
              简体中文
            </Button>
            <Button aria-pressed={variant === "normal"} onClick={chooseNormal}>
              {labels.normal}
            </Button>
            <Button
              aria-pressed={variant === "copilot"}
              onClick={chooseCopilot}
            >
              {labels.copilot}
            </Button>
            <Button
              aria-pressed={variant === "listClassic"}
              onClick={chooseListClassic}
            >
              {labels.listClassic}
            </Button>
            <Button
              aria-pressed={variant === "forced-layout"}
              onClick={chooseForcedLayout}
            >
              {labels.forcedLayout}
            </Button>
            <Button
              aria-pressed={variant === "drawing"}
              onClick={chooseDrawing}
            >
              {labels.drawing}
            </Button>
          </Wrap>
        </Fieldset>
        {variant === "copilot" && !copilotConfig ? (
          <HostAiSetup
            key={`${variant}-${locale}`}
            locale={locale}
            mode="copilot"
            onConfigure={setCopilotConfig}
          />
        ) : null}
        {variant !== "copilot" && variant !== "drawing" && !aiMenuConfig ? (
          <HostAiSetup
            key={`${variant}-${locale}`}
            locale={locale}
            mode="ai-menu"
            onConfigure={setAiMenuConfig}
          />
        ) : null}
        <PlaygroundEditor
          key={`${variant}-${locale}`}
          aiMenuConfig={aiMenuConfig}
          copilotConfig={copilotConfig}
          locale={locale}
          variant={variant}
        />
        {variant === "copilot" ? <Text>{labels.copilotNotice}</Text> : null}
      </Stack>
    </Box>
  )
}
