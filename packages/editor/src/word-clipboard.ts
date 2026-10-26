import type {
  BaseSelection,
  LexicalEditor,
  SerializedLexicalNode,
  SerializedRootNode,
} from "lexical"

import {
  $generateNodesFromSerializedNodes,
  ClipboardImportExtension,
  DEFAULT_IMPORT_MIME_TYPE,
} from "@lexical/clipboard"
import { getPeerDependencyFromEditor } from "@lexical/extension"
import {
  $getEditor,
  $getSelection,
  $hasUpdateTag,
  configExtension,
  defineExtension,
  PASTE_TAG,
} from "lexical"

import { DocumentError, checkText, checkTree } from "./document/boundary"
import { documentNodes } from "./document/convert"
import {
  EditorDocumentClipboardExtension,
  parseDocument,
} from "./document/index"
import { $insertDocumentNodes } from "./document/insertion"
import {
  isWordClipboardHTML,
  normalizeWordClipboardHTML,
  type WordClipboardImageResolver,
} from "./word-clipboard-model"

type SerializedDocumentNode = SerializedLexicalNode & {
  readonly children?: readonly SerializedLexicalNode[]
}

interface PasteRegistration {
  onError: (error: DocumentError) => void
  resolveImage?: WordClipboardImageResolver
  signal?: AbortSignal
}

export interface RegisterWordClipboardPasteOptions {
  readonly resolveImage?: WordClipboardImageResolver
  readonly signal?: AbortSignal
}

const pasteRegistrations = new WeakMap<LexicalEditor, PasteRegistration>()

function toDocumentError(error: Error) {
  return error instanceof DocumentError
    ? error
    : new DocumentError([error.message])
}

function assertPasteTarget(
  editor: LexicalEditor,
  document: ReturnType<typeof parseDocument>,
) {
  checkTree(document)
  const serialized = JSON.stringify(document)

  if (serialized === undefined)
    throw new DocumentError(["Word clipboard document cannot be serialized."])

  checkText(serialized)

  const expected: SerializedRootNode = document.root
  const pending: SerializedDocumentNode[] = [expected]

  while (pending.length) {
    const node = pending.pop()

    if (!node) continue

    const registered = documentNodes.find(
      (candidate) => candidate.getType() === node.type,
    )

    if (registered && !editor.hasNode(registered))
      throw new DocumentError([`Unsupported target node: ${node.type}.`])

    pending.push(...(node.children ?? []))
  }

  let state: ReturnType<LexicalEditor["parseEditorState"]>

  try {
    state = editor.parseEditorState(serialized)
  } catch (error) {
    throw new DocumentError([
      error instanceof Error ? error.message : "Unsupported target editor.",
    ])
  }

  assertRetained(expected, state.toJSON().root)
}

function assertRetained(
  expectedNode: SerializedDocumentNode,
  actualNode: SerializedDocumentNode,
) {
  const { children: expectedChildren = [], ...expectedFields } = expectedNode
  const { children: actualChildren = [], ...actualFields } = actualNode

  if (JSON.stringify(expectedFields) !== JSON.stringify(actualFields))
    throw new DocumentError([
      "Word clipboard data cannot be retained by the target editor.",
    ])

  if (expectedChildren.length !== actualChildren.length)
    throw new DocumentError([
      "Word clipboard children cannot be retained by the target editor.",
    ])

  expectedChildren.forEach((child, index) => {
    const actualChild = actualChildren[index]

    if (!actualChild)
      throw new DocumentError([
        "Word clipboard children cannot be retained by the target editor.",
      ])
    assertRetained(child, actualChild)
  })
}

function $importWordHTML(
  data: string,
  selection: BaseSelection,
  next: () => boolean,
) {
  const editor = $getEditor()
  const registration = pasteRegistrations.get(editor)

  if (!registration || !$hasUpdateTag(PASTE_TAG)) return next()

  try {
    if (!isWordClipboardHTML(data)) return next()
    const target = ensurePasteTarget(editor, selection, registration)
    const html = normalizeWordClipboardHTML(data, registration.resolveImage)

    ensurePasteTarget(editor, selection, registration, target)

    if (html === null) return next()
    const document = parseDocument(html, "html")

    assertPasteTarget(editor, document)
    ensurePasteTarget(editor, selection, registration, target)

    const nodes = $generateNodesFromSerializedNodes(document.root.children)

    if (!nodes.length)
      throw new DocumentError(["Word clipboard content is empty."])
    ensurePasteTarget(editor, selection, registration, target)
    $insertDocumentNodes(editor, nodes, selection)
  } catch (error) {
    registration.onError(
      error instanceof Error
        ? toDocumentError(error)
        : new DocumentError(["Word clipboard import failed."]),
    )
  }

  return true
}

function ensurePasteTarget(
  editor: LexicalEditor,
  selection: BaseSelection,
  registration: PasteRegistration,
  expected?: ReturnType<typeof getPasteTargetSnapshot>,
) {
  if (!editor.isEditable())
    throw new DocumentError(["The editor is read-only."])

  if (editor.isComposing())
    throw new DocumentError([
      "Finish text composition before pasting Word content.",
    ])

  if ($getSelection() !== selection)
    throw new DocumentError(["The Word paste selection is no longer active."])

  if (registration.signal?.aborted)
    throw new DocumentError(["Word clipboard import was cancelled."])

  const current = getPasteTargetSnapshot(editor, selection)

  if (
    expected &&
    (current.pendingState !== expected.pendingState ||
      current.selection !== expected.selection ||
      current.document !== expected.document)
  )
    throw new DocumentError(["The Word paste target changed during import."])

  return current
}

function getPasteTargetSnapshot(
  editor: LexicalEditor,
  selection: BaseSelection,
) {
  const pendingState = editor._pendingEditorState

  if (!pendingState)
    throw new DocumentError(["Word paste requires an active editor update."])
  const root = pendingState.toJSON().root
  checkTree(root)
  const document = JSON.stringify(root)

  if (document === undefined)
    throw new DocumentError(["Word paste target cannot be serialized."])

  checkText(document)

  const points = selection.getStartEndPoints()?.map((point) => ({
    key: point.key,
    offset: point.offset,
    type: point.type,
  }))

  const nodes = selection.getNodes().map((node) => node.getKey())

  return {
    pendingState,
    selection: JSON.stringify({ points, nodes }),
    document,
  }
}

export const EditorWordClipboardExtension = defineExtension({
  name: "@yopem-ui/editor/word-clipboard",
  register(editor) {
    const output = getPeerDependencyFromEditor<typeof ClipboardImportExtension>(
      editor,
      ClipboardImportExtension.name,
    )?.output

    const stack = output?.$importMimeType["text/html"]
    const defaultHandler = DEFAULT_IMPORT_MIME_TYPE["text/html"]?.[0]
    const index = stack?.indexOf($importWordHTML) ?? -1

    if (!stack || !defaultHandler || stack[0] !== defaultHandler || index < 2)
      throw new DocumentError([
        "Native Word clipboard import middleware is unavailable.",
      ])

    stack.splice(index, 1)
    stack.splice(2, 0, $importWordHTML)

    return () => {
      pasteRegistrations.delete(editor)
    }
  },
  dependencies: [
    EditorDocumentClipboardExtension,
    configExtension(ClipboardImportExtension, {
      $importMimeType: {
        "text/html": [$importWordHTML],
      },
    }),
  ],
})

export function registerWordClipboardPaste(
  editor: LexicalEditor,
  onError: (error: DocumentError) => void,
  options: RegisterWordClipboardPasteOptions = {},
) {
  if (
    !getPeerDependencyFromEditor<typeof EditorDocumentClipboardExtension>(
      editor,
      EditorDocumentClipboardExtension.name,
    )
  )
    throw new DocumentError([
      "Register EditorDocumentClipboardExtension when you create the editor.",
    ])

  if (pasteRegistrations.has(editor))
    throw new DocumentError(["Word clipboard paste is already registered."])

  const registration: PasteRegistration = { onError }

  if (options.resolveImage) registration.resolveImage = options.resolveImage

  if (options.signal) registration.signal = options.signal

  pasteRegistrations.set(editor, registration)

  let active = true

  return () => {
    if (!active) return
    active = false
    pasteRegistrations.delete(editor)
  }
}
