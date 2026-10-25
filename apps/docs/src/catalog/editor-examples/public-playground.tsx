"use client"

import type { EditorCopilotConfig } from "@yopem-ui/editor/copilot"
import type {
  EditorReviewAction,
  EditorReviewHost,
} from "@yopem-ui/editor/review"
import type {
  EditorSlashCommand,
  MentionIdentity,
} from "@yopem-ui/editor/typeahead"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import { Field, FieldLabel } from "@registry/components/ui/field"
import { Fieldset } from "@registry/components/ui/fieldset"
import { HStack } from "@registry/components/ui/hstack"
import { Input } from "@registry/components/ui/input"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { Wrap } from "@registry/components/ui/wrap"
import {
  EditorAlignmentButton,
  EditorBackgroundColorControl,
  EditorBlockButton,
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
} from "@yopem-ui/editor"
import { validateEditorAiConfig } from "@yopem-ui/editor/ai/client"
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
import {
  EditorDateControls,
  EditorDateExtension,
  EditorDateNode,
  INSERT_EDITOR_DATE_COMMAND,
} from "@yopem-ui/editor/date"
import {
  EditorFootnoteControls,
  EditorFootnoteExtension,
  EditorFootnoteDefinitionNode,
  EditorFootnoteReferenceNode,
  INSERT_EDITOR_FOOTNOTE_COMMAND,
} from "@yopem-ui/editor/footnote"
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
import { useId, useState } from "react"

type Locale = "en" | "cn"

type Variant = "normal" | "copilot"

const copy = {
  en: {
    editor: "Integrated playground editor",
    placeholder: "Edit the native Lexical sample. Type / for block commands.",
    toolbar: "Integrated editor tools",
    codeToolbar: "Code tools",
    search: "Search document",
    searchPlaceholder: "Find in this document",
    previous: "Previous match",
    next: "Next match",
    normal: "Normal",
    copilot: "Copilot",
    localPolicy:
      "Review controls use a local fixture policy, not authentication.",
    noEndpoint: "No endpoint is configured.",
    hostPolicy:
      "Use a same-origin endpoint. Its host must check current authentication, origin, CSRF, document access, authorized model, and quota. Client checks do not grant access.",
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
    placeholder: "编辑原生 Lexical 示例。输入 / 查看块命令。",
    toolbar: "集成编辑器工具",
    codeToolbar: "代码工具",
    search: "搜索文档",
    searchPlaceholder: "查找文档内容",
    previous: "上一处匹配",
    next: "下一处匹配",
    normal: "普通",
    copilot: "Copilot",
    localPolicy: "审阅控件使用本地示例策略，不代表身份验证。",
    noEndpoint: "尚未配置端点。",
    hostPolicy:
      "请使用同源端点。主机必须检查当前身份验证、来源、CSRF、文档访问权限、授权模型和配额。客户端检查不会授予访问权限。",
    endpoint: "主机端点",
    documentId: "主机文档 ID",
    csrf: "主机 CSRF 令牌",
    configure: "配置 Copilot",
    invalidConfig: "请使用有效的同源端点、文档 ID 和 CSRF 令牌。",
    copilotNotice:
      "Copilot 没有默认端点。在段落末尾按 Control+Space 请求文本。",
  },
} satisfies Record<Locale, Record<string, string>>

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

const initialState = JSON.stringify(
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
                    text: "The sample keeps this review anchor in native Lexical state.",
                    createdAt: 1,
                    updatedAt: 1,
                  },
                ],
              },
            ],
          },
        },
        children: [
          heading("Integrated native editor"),
          paragraph([
            textNode("This sample combines "),
            textNode("native Lexical features", 1),
            textNode(" with local review state."),
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
                children: [textNode("Keyboard and pointer editing")],
              },
              {
                ...elementFields,
                type: "listitem",
                value: 2,
                children: [textNode("Native undo and redo")],
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
            textNode("Equation: "),
            { type: "editor-math", version: 1, kind: "inline", tex: "E=mc^2" },
            textNode(" · Review date: "),
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
                children: [paragraph([textNode("First column")])],
              },
              {
                type: "editor-column",
                version: 1,
                direction: null,
                format: "",
                indent: 0,
                children: [paragraph([textNode("Second column")])],
              },
            ],
          },
          paragraph([
            textNode("See note "),
            { type: "editor-footnote-reference", version: 1, identifier: "1" },
            textNode("."),
          ]),
          {
            type: "editor-footnote-definition",
            version: 1,
            identifier: "1",
            direction: null,
            format: "",
            indent: 0,
            children: [paragraph([textNode("Native footnote definition.")])],
          },
          paragraph([
            {
              type: "mark",
              version: 1,
              direction: null,
              format: "",
              indent: 0,
              ids: [anchorId],
              children: [textNode("Review anchor for the local sample.")],
            },
          ]),
          paragraph([textNode("End of sample.")]),
        ],
      },
    },
    true,
  ),
)

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

function PlaygroundEditor({
  locale,
  variant,
  copilotConfig,
}: {
  locale: Locale
  variant: Variant
  copilotConfig?: EditorCopilotConfig
}) {
  const labels = copy[locale]
  const [review] = useState(createEditorReview)

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
    review.extension,
    typeahead.extension,
  ])

  return (
    <EditorRoot
      ariaLabel={labels.editor}
      extensions={extensions}
      initialState={initialState}
    >
      <EditorReviewProvider controller={review} host={reviewHost}>
        <EditorToolbar aria-label={labels.toolbar}>
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
          <EditorIndentButton direction="indent" />
          <EditorIndentButton direction="outdent" />
          <EditorFirstLineIndentControl />
          <EditorFontColorControl />
          <EditorBackgroundColorControl />
          <EditorFontFamilyControl />
          <EditorFontSizeControl />
          <EditorFontWeightControl />
          <EditorClearFormattingButton />
          <EditorBlockButton block="h1" />
          <EditorBlockButton block="h2" />
          <EditorBlockButton block="quote" />
          <EditorBlockButton block="code" />
          <EditorListButton listType="bullet" />
          <EditorListButton listType="number" />
          <EditorListButton listType="check" />
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
        </EditorToolbar>
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
        <EditorSearchRoot initialQuery="review">
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
              <EditorTypeahead
                controller={typeahead}
                placeholder={labels.placeholder}
              />
            </EditorSearchViewport>
          </Stack>
        </EditorSearchRoot>
        <EditorReviewPanel />
        {variant === "copilot" && copilotConfig ? (
          <EditorCopilot config={copilotConfig} />
        ) : null}
      </EditorReviewProvider>
    </EditorRoot>
  )
}

function CopilotSetup({
  locale,
  onConfigure,
}: {
  locale: Locale
  onConfigure: (config: EditorCopilotConfig) => void
}) {
  const labels = copy[locale]
  const fieldId = useId()
  const [endpoint, setEndpoint] = useState("")
  const [documentId, setDocumentId] = useState("")
  const [csrf, setCsrf] = useState("")
  const [error, setError] = useState("")

  function configure() {
    if (!csrf.trim()) {
      setError(labels.invalidConfig)

      return
    }

    const config: EditorCopilotConfig = {
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
  }

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
          onChange={(event) => setEndpoint(event.currentTarget.value)}
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
          onChange={(event) => setDocumentId(event.currentTarget.value)}
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
          onChange={(event) => setCsrf(event.currentTarget.value)}
        />
      </Field>
      <Button
        disabled={!endpoint || !documentId || !csrf.trim()}
        onClick={configure}
      >
        {labels.configure}
      </Button>
      {error ? <Text role="alert">{error}</Text> : null}
    </Stack>
  )
}

export function PublicPlaygroundExample() {
  const [locale, setLocale] = useState<Locale>("en")
  const [variant, setVariant] = useState<Variant>("normal")
  const [copilotConfig, setCopilotConfig] = useState<EditorCopilotConfig>()
  const labels = copy[locale]

  function chooseVariant(next: Variant) {
    setCopilotConfig(undefined)
    setVariant(next)
  }

  return (
    <Box data-testid="public-playground-workspace">
      <Stack>
        <Text>{labels.localPolicy}</Text>
        <Fieldset aria-label={locale === "en" ? "Locale" : "语言"}>
          <Wrap>
            <Button
              aria-label="English"
              aria-pressed={locale === "en"}
              onClick={() => setLocale("en")}
            >
              English
            </Button>
            <Button
              aria-label="简体中文"
              aria-pressed={locale === "cn"}
              onClick={() => setLocale("cn")}
            >
              简体中文
            </Button>
            <Button
              aria-pressed={variant === "normal"}
              onClick={() => chooseVariant("normal")}
            >
              {labels.normal}
            </Button>
            <Button
              aria-pressed={variant === "copilot"}
              onClick={() => chooseVariant("copilot")}
            >
              {labels.copilot}
            </Button>
          </Wrap>
        </Fieldset>
        {variant === "copilot" && !copilotConfig ? (
          <CopilotSetup locale={locale} onConfigure={setCopilotConfig} />
        ) : (
          <PlaygroundEditor
            key={`${variant}-${copilotConfig ? "configured" : "unconfigured"}`}
            locale={locale}
            variant={variant}
            copilotConfig={copilotConfig}
          />
        )}
        <Text>{labels.copilotNotice}</Text>
      </Stack>
    </Box>
  )
}
