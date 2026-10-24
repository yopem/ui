import type { ExportMimeTypeFunction } from "@lexical/clipboard"
import type { BaseSelection, LexicalNode } from "lexical"

import {
  $getClipboardDataFromSelection,
  setLexicalClipboardDataTransfer,
  GetClipboardDataExtension,
} from "@lexical/clipboard"
import { getPeerDependencyFromEditor } from "@lexical/extension"
import {
  $addUpdateTag,
  $getEditor,
  $getRoot,
  $getSelection,
  $isBlockFullySelected,
  $isElementNode,
  $isRangeSelection,
  $nodesOfType,
  configExtension,
  defineExtension,
  COMMAND_PRIORITY_LOW,
  CUT_COMMAND,
  CUT_TAG,
  HISTORY_PUSH_TAG,
} from "lexical"

import { CalloutNode } from "./blocks-model"

function $fullySelectedCallouts(selection: BaseSelection | null) {
  return $isRangeSelection(selection) && !selection.isCollapsed()
    ? $nodesOfType(CalloutNode).filter(
        (node) => node.isAttached() && $isBlockFullySelected(node, selection),
      )
    : []
}

function $calloutClipboardSelection(selection: BaseSelection | null) {
  if (!$isRangeSelection(selection)) return null
  const callouts = $fullySelectedCallouts(selection)

  if (callouts.length === 0) return null
  const nodes = new Set(selection.getNodes())

  function include(node: LexicalNode) {
    nodes.add(node)

    if ($isElementNode(node))
      for (const child of node.getChildren()) include(child)
  }

  for (const callout of callouts) include(callout)
  const clone = selection.clone()
  clone.setCachedNodes(Array.from(nodes))

  return clone
}

function $exportCalloutMimeType(
  mime: string,
  handler: ExportMimeTypeFunction,
  selection: BaseSelection | null,
  next: () => string | null,
) {
  const stack = getPeerDependencyFromEditor<typeof GetClipboardDataExtension>(
    $getEditor(),
    GetClipboardDataExtension.name,
  )?.output[mime]

  const index = stack?.indexOf(handler) ?? -1

  if (!stack || index < 0 || index !== stack.lastIndexOf(handler)) return next()
  const clone = $calloutClipboardSelection(selection)

  if (!clone) return next()

  function callAt(index: number): string | null {
    const previous = stack?.[index]

    return previous ? previous(clone, () => callAt(index - 1)) : null
  }

  return callAt(index - 1)
}

function $exportCalloutHtml(
  selection: BaseSelection | null,
  next: () => string | null,
) {
  return $exportCalloutMimeType(
    "text/html",
    $exportCalloutHtml,
    selection,
    next,
  )
}

function $exportCalloutJson(
  selection: BaseSelection | null,
  next: () => string | null,
) {
  return $exportCalloutMimeType(
    "application/x-lexical-editor",
    $exportCalloutJson,
    selection,
    next,
  )
}

export const EditorCalloutClipboardExtension = defineExtension({
  name: "@yopem-ui/editor/blocks-clipboard",
  register(editor) {
    return editor.registerCommand(
      CUT_COMMAND,
      (event) => {
        if (
          !editor.isEditable() ||
          !event ||
          event.defaultPrevented ||
          !("clipboardData" in event) ||
          !event.clipboardData
        )
          return false
        const selection = $getSelection()
        const callouts = $fullySelectedCallouts(selection)

        if (
          !$isRangeSelection(selection) ||
          callouts.length === 0 ||
          $isBlockFullySelected($getRoot(), selection)
        )
          return false
        const root = editor.getRootElement()
        const domSelection = root?.ownerDocument.getSelection()

        if (
          !root ||
          !domSelection ||
          !root.contains(domSelection.anchorNode) ||
          !root.contains(domSelection.focusNode)
        )
          return false
        setLexicalClipboardDataTransfer(
          event.clipboardData,
          $getClipboardDataFromSelection(selection),
        )
        event.preventDefault()

        $addUpdateTag(CUT_TAG)
        $addUpdateTag(HISTORY_PUSH_TAG)
        selection.removeText()

        for (const callout of callouts)
          if (callout.isAttached()) callout.remove()

        return true
      },
      COMMAND_PRIORITY_LOW,
    )
  },
  dependencies: [
    configExtension(GetClipboardDataExtension, {
      $exportMimeType: {
        "text/html": [$exportCalloutHtml],
        "application/x-lexical-editor": [$exportCalloutJson],
      },
    }),
  ],
})
