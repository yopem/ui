import type { LexicalClipboardData } from "@lexical/clipboard"
import type {
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditorState,
  SerializedLexicalNode,
  SerializedParagraphNode,
} from "lexical"

import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
  $getClipboardDataFromSelection,
  copyToClipboard,
  GetClipboardDataExtension,
  setLexicalClipboardDataTransfer,
} from "@lexical/clipboard"
import {
  $addUpdateTag,
  $createNodeSelection,
  $getRoot,
  $getSelection,
  $getSlot,
  $getSlotNames,
  $isElementNode,
  $isNodeSelection,
  $setSelection,
  defineExtension,
  mergeRegister,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  COPY_COMMAND,
  CUT_COMMAND,
  CUT_TAG,
  HISTORY_PUSH_TAG,
  KEY_DOWN_COMMAND,
  SKIP_DOM_SELECTION_TAG,
} from "lexical"
import { z } from "zod"

const documentValueSchema = z.json()

type EditorBlockDocumentValue = z.infer<typeof documentValueSchema>

const emptyParagraph: SerializedParagraphNode = {
  type: "paragraph",
  version: 1,
  children: [],
  direction: null,
  format: "",
  indent: 0,
  textFormat: 0,
  textStyle: "",
}

export interface EditorBlockSelectionOptions {
  validateDocument?: (state: SerializedEditorState) => boolean
  authorizeCut?: (
    event: ClipboardEvent,
    data: Readonly<LexicalClipboardData>,
  ) => boolean
}

export interface EditorBlockSelectionSnapshot {
  readonly blocks: readonly NodeKey[]
  readonly selected: readonly NodeKey[]
  readonly mode: boolean
  readonly dragging: boolean
  readonly editable: boolean
  readonly error: string | null
  readonly layout: readonly { key: NodeKey; top: number; height: number }[]
  readonly dropTarget: { key: NodeKey; edge: "before" | "after" } | null
}

export function createEditorBlockSelection(
  options: EditorBlockSelectionOptions = {},
) {
  let editor: LexicalEditor | null = null
  let anchor: NodeKey | null = null
  let dragState: ReturnType<LexicalEditor["getEditorState"]> | null = null

  let snapshot: EditorBlockSelectionSnapshot = {
    blocks: [],
    selected: [],
    mode: false,
    dragging: false,
    editable: false,
    error: null,
    layout: [],
    dropTarget: null,
  }

  const server = snapshot
  const listeners = new Set<() => void>()
  const operationTag = "yopem-block-selection-operation"
  let measure: (() => void) | null = null
  let marqueeStart: number | null = null
  let marqueeBase: readonly NodeKey[] = []
  let gutter: HTMLElement | null = null

  function publish(patch: Partial<EditorBlockSelectionSnapshot>) {
    snapshot = { ...snapshot, ...patch }

    for (const listener of listeners) listener()
  }

  function fail(message: string) {
    publish({ error: message })

    return false
  }

  function clear() {
    if (snapshot.mode && editor)
      editor.update(
        () => {
          if (hasCurrentSelection()) {
            $setSelection(null)
            $addUpdateTag(SKIP_DOM_SELECTION_TAG)
          }
        },
        { discrete: true },
      )
    anchor = null
    dragState = null
    marqueeStart = null
    publish({
      selected: [],
      mode: false,
      dragging: false,
      error: null,
      dropTarget: null,
    })
  }

  function readBlocks() {
    return (
      editor?.getEditorState().read(() => $getRoot().getChildrenKeys()) ?? []
    )
  }

  function hasCurrentSelection() {
    const selection = $getSelection()

    if (!snapshot.mode || !$isNodeSelection(selection)) return false
    const expected = $createNodeSelection()

    for (const key of snapshot.selected) expected.add(key)

    return selection.is(expected)
  }

  function $documentFingerprint() {
    const values: string[] = []

    function visit(node: LexicalNode) {
      const slots = $getSlotNames(node)
      values.push(JSON.stringify([node.getKey(), node.exportJSON(), slots]))

      if ($isElementNode(node))
        for (const child of node.getChildren()) visit(child)

      for (const name of slots) {
        const slot = $getSlot(node, name)

        if (slot) visit(slot)
      }
    }

    visit($getRoot())

    return JSON.stringify(values)
  }

  function selectedNodes() {
    if (!hasCurrentSelection()) {
      clear()
      throw new Error("Block selection is no longer valid")
    }

    const children = $getRoot().getChildren()

    const selected = new Set(snapshot.selected)
    const nodes = children.filter((node) => selected.has(node.getKey()))

    if (!nodes.length || nodes.length !== snapshot.selected.length) {
      clear()
      throw new Error("Block selection is no longer valid")
    }

    return nodes
  }

  function syncSelection(keys: readonly NodeKey[]) {
    editor?.update(
      () => {
        const selection = $createNodeSelection()

        for (const key of keys) selection.add(key)
        $setSelection(keys.length ? selection : null)
        $addUpdateTag(SKIP_DOM_SELECTION_TAG)
      },
      { discrete: true },
    )
  }

  function select(
    key: NodeKey,
    modifiers: { shift?: boolean; toggle?: boolean } = {},
  ) {
    const blocks = readBlocks()

    if (!blocks.includes(key)) {
      clear()

      return fail("Select a current top-level block")
    }

    let selected = [key]
    const previous = new Set(snapshot.selected)

    if (modifiers.shift && anchor && blocks.includes(anchor)) {
      const start = blocks.indexOf(anchor)
      const end = blocks.indexOf(key)
      selected = blocks.slice(Math.min(start, end), Math.max(start, end) + 1)
    } else {
      if (modifiers.toggle)
        selected = blocks.filter((item) =>
          item === key ? !previous.has(item) : previous.has(item),
        )
      anchor = key
    }

    publish({ blocks, selected, mode: selected.length > 0, error: null })
    syncSelection(selected)

    return true
  }

  function selectAll() {
    const blocks = readBlocks()
    anchor = blocks[0] ?? null
    publish({ blocks, selected: blocks, mode: blocks.length > 0, error: null })
    syncSelection(blocks)
  }

  function validate(children: SerializedEditorState["root"]["children"]) {
    if (!editor) throw new Error("Editor is not connected")
    const current = editor.getEditorState().toJSON()
    const next = { ...current, root: { ...current.root, children } }
    const text = JSON.stringify(next)

    if (new TextEncoder().encode(text).length > 1048576)
      throw new Error("Block operation exceeds the document size limit")
    let values = 0

    function visit(value: EditorBlockDocumentValue, depth: number) {
      values++

      if (values > 131072 || depth > 64)
        throw new Error("Block operation exceeds document bounds")

      if (value instanceof Object)
        for (const item of Object.values(value)) visit(item, depth + 1)
    }

    visit(documentValueSchema.parse(JSON.parse(text)), 0)

    if (options.validateDocument && options.validateDocument(next) !== true)
      throw new Error("Document validation rejected the block operation")
  }

  function mutate(
    action: "up" | "down" | "duplicate" | "delete" | "drop",
    target?: NodeKey,
    edge: "before" | "after" = "before",
  ) {
    const currentEditor = editor

    if (!currentEditor || !currentEditor.isEditable())
      return fail("Editor is read-only or disconnected")
    let success = false
    let message: string | null = null
    currentEditor.update(
      () => {
        try {
          const root = $getRoot()
          const nodes = selectedNodes()
          const children = root.getChildren()
          const keys = children.map((node) => node.getKey())
          const selected = new Set(nodes.map((node) => node.getKey()))
          let ordered = [...keys]
          const original = currentEditor.getEditorState().toJSON().root.children

          const byKey = new Map(
            keys.map((key, index) => [key, original[index]]),
          )

          const selection = $getSelection()?.clone() ?? null

          if (action === "duplicate") {
            const nativeSelection = $createNodeSelection()

            for (const node of nodes) nativeSelection.add(node.getKey())

            const exported =
              $generateJSONFromSelectedNodes<SerializedLexicalNode>(
                currentEditor,
                nativeSelection,
              ).nodes

            const expected = nodes.map((node) => byKey.get(node.getKey())!)

            if (JSON.stringify(exported) !== JSON.stringify(expected))
              throw new Error(
                "Selected blocks cannot be duplicated without content loss",
              )
            const index = keys.indexOf(nodes[nodes.length - 1].getKey()) + 1
            validate([
              ...original.slice(0, index),
              ...exported,
              ...original.slice(index),
            ])
            const rootJSON = currentEditor.getEditorState().toJSON().root

            const roundTrip = currentEditor
              .parseEditorState(
                JSON.stringify({ root: { ...rootJSON, children: exported } }),
              )
              .toJSON().root.children

            if (JSON.stringify(roundTrip) !== JSON.stringify(expected))
              throw new Error(
                "Selected blocks cannot be imported without content loss",
              )
            const copies = $generateNodesFromSerializedNodes(exported)
            let previous = nodes[nodes.length - 1]

            for (const node of copies) {
              previous.insertAfter(node)
              previous = node
            }
          } else if (action === "delete") {
            const remaining = original.filter(
              (_, index) => !selected.has(keys[index]),
            )

            validate(remaining.length ? remaining : [emptyParagraph])
            const nativeSelection = $createNodeSelection()

            for (const node of nodes) nativeSelection.add(node.getKey())
            $setSelection(nativeSelection)
            nativeSelection.deleteNodes()
          } else {
            if (action === "drop") {
              if (!target || selected.has(target) || !keys.includes(target))
                throw new Error("Drop target is not a current unselected block")
              ordered = keys.filter((key) => !selected.has(key))
              const index = ordered.indexOf(target) + (edge === "after" ? 1 : 0)
              ordered.splice(
                index,
                0,
                ...keys.filter((key) => selected.has(key)),
              )
            } else {
              if (selected.has(keys[action === "up" ? 0 : keys.length - 1]))
                throw new Error("Selected blocks reached the document boundary")
              const indices = keys.map((_, index) => index)

              if (action === "down") indices.reverse()

              for (const index of indices) {
                const neighbor = index + (action === "up" ? -1 : 1)

                if (
                  selected.has(ordered[index]) &&
                  !selected.has(ordered[neighbor])
                )
                  [ordered[index], ordered[neighbor]] = [
                    ordered[neighbor],
                    ordered[index],
                  ]
              }
            }

            if (ordered.every((key, index) => key === keys[index]))
              throw new Error("Blocks are already at this position")
            validate(ordered.map((key) => byKey.get(key)!))

            const byNode = new Map(
              children.map((node) => [node.getKey(), node]),
            )

            for (const key of ordered) root.append(byNode.get(key)!)
            $setSelection(selection)
          }

          $addUpdateTag(operationTag)
          $addUpdateTag(HISTORY_PUSH_TAG)
          $addUpdateTag(SKIP_DOM_SELECTION_TAG)
          success = true
        } catch (error) {
          message =
            error instanceof Error ? error.message : "Block operation failed"
        }
      },
      { discrete: true },
    )

    if (message) return fail(message)

    if (success) {
      if (action === "delete") clear()
      else publish({ blocks: readBlocks(), error: null })
    }

    return success
  }

  function beginDrag(key: NodeKey) {
    if (!editor?.isEditable())
      return fail("Editor is read-only or disconnected")

    if (!snapshot.selected.includes(key) && !select(key)) return false
    dragState = editor.getEditorState()
    publish({ dragging: true, error: null })

    return true
  }

  function cancelDrag() {
    dragState = null
    publish({ dragging: false, dropTarget: null })
  }

  function drop(key: NodeKey, edge: "before" | "after") {
    const valid = dragState === editor?.getEditorState() && snapshot.dragging

    cancelDrag()

    return valid
      ? mutate("drop", key, edge)
      : fail("Drag expired; start a new drag")
  }

  function $clipboardData() {
    selectedNodes()

    return $getClipboardDataFromSelection($getSelection())
  }

  async function copy() {
    const current = editor

    if (!current || !snapshot.mode) return fail("Select blocks before copying")

    try {
      const data = current.getEditorState().read($clipboardData)

      if (!Object.values(data).some((value) => value))
        return fail("Clipboard export was denied")
      const result = await copyToClipboard(current, null, data)

      return result || fail("Clipboard write failed")
    } catch {
      return fail("Clipboard write failed")
    }
  }

  function cut() {
    const current = editor

    if (!current?.isEditable() || !options.authorizeCut)
      return fail("Host cut approval is required")
    const root = current.getRootElement()

    if (!root) return fail("Editor is not mounted")

    try {
      current.getEditorState().read(selectedNodes)
      root.focus()
      current.getEditorState().read(selectedNodes)

      return (
        root.ownerDocument.execCommand("cut") ||
        fail("Native cut event is unavailable")
      )
    } catch {
      return fail("Block selection is no longer valid")
    }
  }

  function clipboard(
    event: ClipboardEvent | KeyboardEvent | null,
    cutting: boolean,
  ) {
    if (!snapshot.mode) return false

    if (!event || !("clipboardData" in event) || !event.clipboardData)
      return false

    const clipboardEvent = event

    if (clipboardEvent.defaultPrevented) return true

    try {
      if (!editor || (cutting && !editor.isEditable()))
        return (fail("Editor is read-only or disconnected"), true)
      const currentEditor = editor
      selectedNodes()
      const selection = $getSelection()?.clone()
      const content = $documentFingerprint()
      const editable = currentEditor.isEditable()
      const transfer = event.clipboardData

      function unchanged() {
        selectedNodes()

        if (
          editor !== currentEditor ||
          currentEditor.isEditable() !== editable ||
          clipboardEvent.defaultPrevented ||
          clipboardEvent.clipboardData !== transfer ||
          !selection?.is($getSelection()) ||
          content !== $documentFingerprint()
        )
          throw new Error("Clipboard target changed")
      }

      const data = $clipboardData()
      unchanged()

      if (!Object.values(data).some((value) => value))
        return (fail("Clipboard export was denied"), true)
      const exported = JSON.stringify(data)

      if (cutting) {
        if (!options.authorizeCut || options.authorizeCut(event, data) !== true)
          return (fail("Host cut approval is required"), true)
        unchanged()

        if (JSON.stringify(data) !== exported)
          throw new Error("Clipboard export changed")
        const current = currentEditor.getEditorState().toJSON().root.children
        const keys = $getRoot().getChildrenKeys()

        const selected = new Set(snapshot.selected)

        const remaining = current.filter(
          (_, index) => !selected.has(keys[index]),
        )

        validate(remaining.length ? remaining : [emptyParagraph])
      }

      unchanged()

      if (JSON.stringify(data) !== exported)
        throw new Error("Clipboard export changed")
      setLexicalClipboardDataTransfer(transfer, data)

      for (const [mime, value] of Object.entries(data))
        if (transfer.getData(mime) !== value)
          throw new Error("Clipboard write failed")
      unchanged()

      if (JSON.stringify(data) !== exported)
        throw new Error("Clipboard export changed")

      if (cutting) {
        const currentSelection = $getSelection()

        if (!$isNodeSelection(currentSelection))
          throw new Error("Block selection is no longer valid")
        currentSelection.deleteNodes()
        $addUpdateTag(CUT_TAG)
        $addUpdateTag(HISTORY_PUSH_TAG)
        $addUpdateTag(operationTag)
        clear()
      }
    } catch {
      fail("Clipboard operation failed; content was not removed")
    } finally {
      event.preventDefault()
    }

    return true
  }

  function targetAt(clientY: number) {
    const offset = gutter?.getBoundingClientRect().top

    if (offset === undefined || !Number.isFinite(clientY)) return null
    const y = clientY - offset

    const selected = new Set(snapshot.selected)
    const candidates = snapshot.layout.filter((item) => !selected.has(item.key))

    const row =
      candidates.find((item) => y < item.top + item.height) ??
      candidates[candidates.length - 1]

    return row
      ? {
          key: row.key,
          edge:
            y < row.top + row.height / 2
              ? ("before" as const)
              : ("after" as const),
        }
      : null
  }

  function connectGutter(element: HTMLElement) {
    if (gutter) throw new Error("Use one gutter per block selection controller")
    gutter = element
    const view = element.ownerDocument.defaultView
    let frame = 0
    const observer = view ? new view.ResizeObserver(schedule) : null

    function schedule() {
      if (view && !frame) frame = view.requestAnimationFrame(update)
    }

    function update() {
      frame = 0
      observer?.disconnect()
      observer?.observe(element)
      const root = editor?.getRootElement()

      if (root) observer?.observe(root)
      const origin = element.getBoundingClientRect().top

      const layout = readBlocks().flatMap((key) => {
        const node = editor?.getElementByKey(key)

        if (!node) return []
        observer?.observe(node)
        const rect = node.getBoundingClientRect()

        return [{ key, top: rect.top - origin, height: rect.height }]
      })

      publish({ layout })
    }

    measure = schedule
    const root = editor?.getRootElement()

    if (root) observer?.observe(root)
    observer?.observe(element)

    function escape(event: KeyboardEvent) {
      if (
        event.key === "Escape" &&
        (snapshot.dragging || marqueeStart !== null)
      ) {
        clear()
        event.preventDefault()
      }
    }

    element.ownerDocument.addEventListener("keydown", escape, true)
    view?.addEventListener("resize", schedule)
    view?.addEventListener("scroll", schedule, true)
    schedule()

    return function disconnectGutter() {
      if (frame) view?.cancelAnimationFrame(frame)
      observer?.disconnect()
      element.ownerDocument.removeEventListener("keydown", escape, true)
      view?.removeEventListener("resize", schedule)
      view?.removeEventListener("scroll", schedule, true)
      measure = null
      gutter = null
      cancelDrag()
      marqueeStart = null
    }
  }

  function startMarquee(clientY: number, additive: boolean) {
    marqueeStart = clientY
    marqueeBase = additive ? snapshot.selected : []
    marquee(clientY)
  }

  function marquee(clientY: number) {
    if (marqueeStart === null || !gutter) return
    const origin = gutter.getBoundingClientRect().top
    const top = Math.min(clientY, marqueeStart) - origin
    const bottom = Math.max(clientY, marqueeStart) - origin

    const included = new Set(marqueeBase)

    for (const item of snapshot.layout)
      if (item.top <= bottom && item.top + item.height >= top)
        included.add(item.key)
    const selected = snapshot.blocks.filter((key) => included.has(key))

    anchor = selected[0] ?? null
    publish({ selected, mode: selected.length > 0, error: null })
    syncSelection(selected)
  }

  const extension = defineExtension({
    name: "@yopem-ui/editor/block-selection",
    dependencies: [GetClipboardDataExtension],
    register(currentEditor) {
      if (editor)
        throw new Error("Use one block selection controller per editor root")
      editor = currentEditor
      publish({ blocks: readBlocks(), editable: editor.isEditable() })

      function nativePointerDown() {
        clear()
      }

      const cleanup = mergeRegister(
        currentEditor.registerUpdateListener(
          ({ dirtyElements, dirtyLeaves, tags, editorState }) => {
            if (snapshot.mode && !editorState.read(hasCurrentSelection)) clear()

            if (dirtyElements.size || dirtyLeaves.size) {
              if (!tags.has(operationTag)) clear()
              publish({ blocks: readBlocks() })
              measure?.()
            }
          },
        ),
        currentEditor.registerEditableListener((editable) => {
          clear()
          publish({ editable })
        }),
        currentEditor.registerRootListener((root, previous) => {
          previous?.removeEventListener("pointerdown", nativePointerDown)
          root?.addEventListener("pointerdown", nativePointerDown)

          if (root !== previous) {
            clear()
            measure?.()
          }
        }),
        currentEditor.registerCommand(
          COPY_COMMAND,
          (event) => clipboard(event, false),
          COMMAND_PRIORITY_LOW,
        ),
        currentEditor.registerCommand(
          CUT_COMMAND,
          (event) => clipboard(event, true),
          COMMAND_PRIORITY_LOW,
        ),
        currentEditor.registerCommand(
          KEY_DOWN_COMMAND,
          (event) => {
            if (!snapshot.mode || event.defaultPrevented || event.isComposing)
              return false

            if (event.key === "Escape") {
              clear()
              event.preventDefault()

              return true
            }

            if (
              (event.metaKey || event.ctrlKey) &&
              event.key.toLowerCase() === "a"
            ) {
              selectAll()
              event.preventDefault()

              return true
            }

            return false
          },
          COMMAND_PRIORITY_HIGH,
        ),
      )

      return function disconnect() {
        cleanup()
        editor = null
        clear()
        publish({ blocks: [], editable: false })
      }
    },
  })

  return {
    extension,
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return server
    },
    select,
    selectAll,
    clear,
    beginDrag,
    cancelDrag,
    drop,
    copy,
    cut,
    connectGutter,
    startMarquee,
    marquee,
    endMarquee() {
      marqueeStart = null
    },
    getBlockElement(key: NodeKey) {
      return editor?.getElementByKey(key) ?? null
    },
    previewDrop(clientY: number) {
      if (snapshot.dragging) publish({ dropTarget: targetAt(clientY) })
    },
    dropAt(clientY: number) {
      const target = targetAt(clientY)

      return target
        ? drop(target.key, target.edge)
        : (cancelDrag(), fail("No valid drop target"))
    },
    move(direction: "up" | "down") {
      return mutate(direction)
    },
    duplicate() {
      return mutate("duplicate")
    },
    remove() {
      return mutate("delete")
    },
  }
}

export type EditorBlockSelectionController = ReturnType<
  typeof createEditorBlockSelection
>
