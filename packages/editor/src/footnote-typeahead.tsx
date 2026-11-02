"use client"

import type { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import type { BaseUIEvent } from "@base-ui/react/types"
import type {
  AnyLexicalExtensionArgument,
  EditorState,
  LexicalEditor,
  NodeKey,
} from "lexical"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { Box } from "@registry/components/ui/box"
import {
  Command,
  CommandItem as CommandItemComponent,
  CommandList as CommandListComponent,
} from "@registry/components/ui/command"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import { Stack } from "@registry/components/ui/stack"
import { Text } from "@registry/components/ui/text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $addUpdateTag,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  BLUR_COMMAND,
  HISTORY_PUSH_TAG,
  defineExtension,
  mergeRegister,
} from "lexical"
import {
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react"

import type { EditorContentProps } from "./root"

import { $insertEditorFootnote } from "./footnote-commands"
import { EditorFootnoteExtension } from "./footnote-extension"
import { editorFootnoteIdSchema, nextEditorFootnoteId } from "./footnote-model"
import { $getEditorFootnoteSnapshot } from "./footnote-state"
import { EditorContent } from "./root"

export interface EditorFootnoteTypeaheadItem {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly identifier: string
}

export interface EditorFootnoteTypeaheadQuery {
  readonly key: NodeKey
  readonly start: number
  readonly end: number
  readonly text: string
}

export interface EditorFootnoteTypeaheadSnapshot {
  readonly query: EditorFootnoteTypeaheadQuery | null
  readonly items: readonly EditorFootnoteTypeaheadItem[]
  readonly active: number
  readonly revision: number
}

export interface EditorFootnoteTypeaheadController {
  readonly extension: AnyLexicalExtensionArgument
  close(): void
  choose(id: string): boolean
  highlight(index: number): void
  subscribe(this: void, listener: () => void): () => void
  getSnapshot(this: void): EditorFootnoteTypeaheadSnapshot
  getServerSnapshot(this: void): EditorFootnoteTypeaheadSnapshot
  connectView(): () => void
  connectList(id: string): () => void
  connectOption(index: number, element: HTMLDivElement | null): void
  getAnchor(): {
    readonly contextElement: HTMLElement
    getBoundingClientRect(): DOMRect
  } | null
}

const styles = stylex.create({
  optionText: {
    gap: `calc(${tokens["--spacing"]} / 2)`,
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
  description: {
    color: tokens["--muted-foreground"],
    fontSize: "0.875rem",
    lineHeight: 1.4,
  },
  item: {
    minBlockSize: {
      default: null,
      "@media (pointer: coarse)": `calc(${tokens["--spacing"]} * 11)`,
    },
  },
})

function $readEditorFootnoteTypeaheadQuery(): EditorFootnoteTypeaheadQuery | null {
  const selection = $getSelection()

  if (
    !$isRangeSelection(selection) ||
    !selection.isCollapsed() ||
    selection.anchor.type !== "text"
  )
    return null

  const node = $getNodeByKey(selection.anchor.key)

  if (node?.getType() !== "text" || !node.isAttached()) return null

  for (let parent = node.getParent(); parent; parent = parent.getParent())
    if (parent.getType() === "code") return null

  const prefix = node.getTextContent().slice(0, selection.anchor.offset)
  const match = /\[\^([A-Za-z0-9_.:-]{0,64})$/.exec(prefix)

  if (!match) return null
  const start = selection.anchor.offset - (match[0]?.length ?? 0)
  let backslashes = 0

  for (let index = start - 1; index >= 0 && prefix[index] === "\\"; index -= 1)
    backslashes += 1

  if (backslashes % 2 === 1) return null

  return {
    key: node.getKey(),
    start,
    end: selection.anchor.offset,
    text: match[1] ?? "",
  }
}

function sameQuery(
  left: EditorFootnoteTypeaheadQuery | null,
  right: EditorFootnoteTypeaheadQuery | null,
) {
  return (
    left === right ||
    (left !== null &&
      right !== null &&
      left.key === right.key &&
      left.start === right.start &&
      left.end === right.end &&
      left.text === right.text)
  )
}

function definitionPreview(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim()

  return normalized.length > 80
    ? `${normalized.slice(0, 77).trimEnd()}…`
    : normalized
}

export function createEditorFootnoteTypeahead() {
  let editor: LexicalEditor | null = null
  let composing = false
  let dismissed: EditorFootnoteTypeaheadQuery | null = null
  let contentRevision = 0
  let capturedRevision = -1
  let listId: string | null = null
  let rootAttributes = new Map<string, string | null>()
  const listeners = new Set<() => void>()
  const optionElements = new Map<number, HTMLDivElement>()

  let snapshot: EditorFootnoteTypeaheadSnapshot = {
    query: null,
    items: [],
    active: 0,
    revision: 0,
  }

  const serverSnapshot = snapshot

  const ariaNames = [
    "aria-controls",
    "aria-autocomplete",
    "aria-activedescendant",
  ]

  function restoreAria(root: HTMLElement) {
    for (const name of ariaNames) {
      const value = rootAttributes.get(name)

      if (value === undefined || value === null) root.removeAttribute(name)
      else root.setAttribute(name, value)
    }
  }

  function syncAria() {
    const root = editor?.getRootElement()

    if (!root) return
    const item = snapshot.items[snapshot.active]
    const option = optionElements.get(snapshot.active)

    if (listId && snapshot.query) {
      root.setAttribute("aria-controls", listId)
      root.setAttribute("aria-autocomplete", "list")

      if (item && option?.id)
        root.setAttribute("aria-activedescendant", option.id)
      else root.removeAttribute("aria-activedescendant")
    } else restoreAria(root)
  }

  function publish(next: Omit<EditorFootnoteTypeaheadSnapshot, "revision">) {
    snapshot = { ...next, revision: snapshot.revision + 1 }
    syncAria()

    for (const listener of listeners) listener()
  }

  function close() {
    capturedRevision = -1

    if (snapshot.query) {
      dismissed = snapshot.query
      publish({ query: null, items: [], active: 0 })
    }
  }

  function buildItems(query: EditorFootnoteTypeaheadQuery) {
    const instance = editor

    if (!instance) return []
    const footnotes = instance.getEditorState().read($getEditorFootnoteSnapshot)
    const definitions = new Map<string, string>()

    for (const definition of footnotes.definitions)
      if (!definitions.has(definition.identifier))
        definitions.set(
          definition.identifier,
          definitionPreview(definition.preview),
        )

    const items: EditorFootnoteTypeaheadItem[] = []
    const text = query.text.toLocaleLowerCase()
    const seen = new Set<string>()

    for (const [identifier, preview] of definitions) {
      if (
        query.text &&
        !identifier.toLocaleLowerCase().includes(text) &&
        !preview.toLocaleLowerCase().includes(text)
      )
        continue
      seen.add(identifier)
      items.push({
        id: `footnote-${identifier}`,
        label: `Footnote [^${identifier}]`,
        description: preview || "Empty footnote",
        identifier,
      })

      if (items.length >= 49) break
    }

    const identifiers = [
      ...footnotes.definitions.map((definition) => definition.identifier),
      ...footnotes.references.map((reference) => reference.identifier),
    ]

    const requested = query.text
      ? editorFootnoteIdSchema.safeParse(query.text)
      : null

    const createIdentifier = requested?.success
      ? requested.data
      : nextEditorFootnoteId(identifiers)

    if (
      items.length < 50 &&
      !seen.has(createIdentifier) &&
      !footnotes.definitions.some(
        (definition) => definition.identifier === createIdentifier,
      )
    )
      items.unshift({
        id: `create-${createIdentifier}`,
        label: `Create footnote [^${createIdentifier}]`,
        description: "Add a new footnote definition",
        identifier: createIdentifier,
      })

    return items
  }

  function refresh(editorState: EditorState, contentChanged = false) {
    if (contentChanged) contentRevision += 1

    if (!editor || composing || editor.isComposing() || !editor.isEditable()) {
      if (snapshot.query) close()

      return
    }

    const query = editorState.read($readEditorFootnoteTypeaheadQuery)

    if (!query) {
      capturedRevision = -1

      if (snapshot.query) publish({ query: null, items: [], active: 0 })

      return
    }

    if (sameQuery(query, dismissed)) return

    if (sameQuery(query, snapshot.query) && contentChanged) {
      close()

      return
    }

    if (!sameQuery(query, snapshot.query)) {
      dismissed = null
      capturedRevision = contentRevision
    }

    const items = buildItems(query)

    const active = sameQuery(query, snapshot.query)
      ? Math.min(snapshot.active, Math.max(0, items.length - 1))
      : 0

    publish({ query, items, active })
  }

  function applyChoice(id: string) {
    const instance = editor
    const query = snapshot.query
    const item = snapshot.items.find((candidate) => candidate.id === id)

    if (
      !instance ||
      !query ||
      !item ||
      !instance.isEditable() ||
      capturedRevision !== contentRevision
    ) {
      close()

      return false
    }

    const currentQuery = $readEditorFootnoteTypeaheadQuery()
    const selection = $getSelection()
    const node = $getNodeByKey(query.key)

    if (
      !sameQuery(query, currentQuery) ||
      !$isTextNode(node) ||
      !node.isSimpleText() ||
      !$isRangeSelection(selection) ||
      !selection.isCollapsed() ||
      selection.anchor.key !== query.key ||
      selection.anchor.offset !== query.end
    ) {
      close()

      return false
    }

    $addUpdateTag(HISTORY_PUSH_TAG)
    selection.setTextNodeRange(node, query.start, node, query.end)
    selection.removeText()
    const inserted = $insertEditorFootnote({ identifier: item.identifier })
    close()

    return inserted
  }

  function keydown(event: KeyboardEvent) {
    if (
      !snapshot.query ||
      event.defaultPrevented ||
      composing ||
      event.isComposing ||
      event.keyCode === 229 ||
      !editor?.isEditable()
    )
      return false

    if (event.key === "Escape") {
      event.preventDefault()
      close()

      return true
    }

    if (event.key === "Tab") {
      close()

      return false
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return false

    if (event.key === "Enter") {
      const item = snapshot.items[snapshot.active]

      if (!item) return false
      event.preventDefault()

      return applyChoice(item.id)
    }

    const count = snapshot.items.length

    if (!count || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key))
      return false

    event.preventDefault()
    highlight(
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? count - 1
          : (snapshot.active + (event.key === "ArrowDown" ? 1 : count - 1)) %
            count,
    )

    return true
  }

  function choose(id: string) {
    const instance = editor

    if (!instance) return false
    let chosen = false
    instance.update(
      () => {
        chosen = applyChoice(id)
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )

    return chosen
  }

  function highlight(index: number) {
    if (!snapshot.items.length || !Number.isInteger(index)) return

    publish({
      query: snapshot.query,
      items: snapshot.items,
      active: Math.max(0, Math.min(index, snapshot.items.length - 1)),
    })
  }

  function syncOption(index: number, element: HTMLDivElement | null) {
    if (element) {
      optionElements.set(index, element)

      if (index === snapshot.active)
        element.scrollIntoView({ block: "nearest" })
    } else optionElements.delete(index)
    syncAria()
  }

  function connectView() {
    return () => close()
  }

  function connectList(id: string) {
    listId = id
    syncAria()

    return () => {
      if (listId === id) listId = null
      syncAria()
    }
  }

  function getAnchor() {
    const root = editor?.getRootElement()

    if (!root) return null
    const selection = root.ownerDocument.getSelection()

    if (!selection?.rangeCount)
      return {
        contextElement: root,
        getBoundingClientRect: () => root.getBoundingClientRect(),
      }
    const range = selection.getRangeAt(0).cloneRange()

    return {
      contextElement: root,
      getBoundingClientRect() {
        return range.getBoundingClientRect()
      },
    }
  }

  const extension = defineExtension({
    name: "@yopem-ui/editor/footnote-typeahead",
    dependencies: [EditorFootnoteExtension],
    register(instance) {
      if (editor)
        throw new Error("Use one footnote typeahead controller per editor")
      editor = instance
      let registered = true

      function startComposition() {
        const query = snapshot.query
        composing = true
        close()

        if (query) dismissed = null
      }

      function endComposition() {
        composing = false
        queueMicrotask(() => {
          if (registered && editor === instance)
            refresh(instance.getEditorState())
        })
      }

      return mergeRegister(
        instance.registerUpdateListener(
          ({ editorState, dirtyElements, dirtyLeaves }) => {
            const contentChanged =
              dirtyElements.size > 0 || dirtyLeaves.size > 0

            if (contentChanged) dismissed = null
            refresh(editorState, contentChanged)
          },
        ),
        instance.registerEditableListener((editable) => {
          if (!editable) close()
        }),
        instance.registerCommand(
          KEY_DOWN_COMMAND,
          keydown,
          COMMAND_PRIORITY_HIGH,
        ),
        instance.registerCommand(
          BLUR_COMMAND,
          () => {
            const root = instance.getRootElement()
            const query = snapshot.query

            queueMicrotask(() => {
              if (
                registered &&
                editor === instance &&
                snapshot.query === query &&
                root &&
                !root.contains(root.ownerDocument.activeElement)
              )
                close()
            })

            return false
          },
          COMMAND_PRIORITY_HIGH,
        ),
        instance.registerRootListener((root, previous) => {
          if (previous) {
            restoreAria(previous)
            close()
          }

          rootAttributes = new Map(
            root
              ? ariaNames.map((name) => [name, root.getAttribute(name)])
              : [],
          )
          previous?.removeEventListener(
            "compositionstart",
            startComposition,
            true,
          )
          previous?.removeEventListener("compositionend", endComposition, true)
          root?.addEventListener("compositionstart", startComposition, true)
          root?.addEventListener("compositionend", endComposition, true)

          if (root) refresh(instance.getEditorState())
        }),
        () => {
          registered = false
          const root = instance.getRootElement()

          root?.removeEventListener("compositionstart", startComposition, true)
          root?.removeEventListener("compositionend", endComposition, true)

          if (root) restoreAria(root)
          close()
          editor = null
          dismissed = null
          capturedRevision = -1
          listId = null
          optionElements.clear()
        },
      )
    },
  })

  return {
    extension,
    close,
    choose,
    highlight,
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    getSnapshot() {
      return snapshot
    },
    getServerSnapshot() {
      return serverSnapshot
    },
    connectView,
    connectList,
    connectOption: syncOption,
    getAnchor,
  }
}

function preserveFootnoteNativeEditing(
  event: BaseUIEvent<ReactKeyboardEvent<HTMLElement>>,
) {
  event.preventBaseUIHandler()
}

export interface EditorFootnoteTypeaheadProps extends EditorContentProps {
  readonly controller: EditorFootnoteTypeaheadController
  readonly ariaLabel?: string
}

function FootnoteTypeaheadOption({
  controller,
  index,
  item,
  active,
}: {
  controller: EditorFootnoteTypeaheadController
  index: number
  item: EditorFootnoteTypeaheadItem
  active: boolean
}) {
  function connectOption(element: HTMLDivElement | null) {
    controller.connectOption(index, element)
  }

  const handlePointerDown = useStableCallback(function handlePointerDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItemComponent>["onPointerDown"]>
    >[0],
  ) {
    event.preventDefault()
  })

  const handleMouseDown = useStableCallback(function handleMouseDown(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItemComponent>["onMouseDown"]>
    >[0],
  ) {
    event.preventDefault()
  })

  const handlePointerMove = useStableCallback(function handlePointerMove(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItemComponent>["onPointerMove"]>
    >[0],
  ) {
    if (!event.defaultPrevented) controller.highlight(index)
  })

  const handleClick = useStableCallback(function handleClick(
    event: Parameters<
      NonNullable<ComponentProps<typeof CommandItemComponent>["onClick"]>
    >[0],
  ) {
    if (!event.defaultPrevented) controller.choose(item.id)
  })

  return (
    <CommandItemComponent
      value={item}
      ref={connectOption}
      tabIndex={-1}
      aria-selected={active}
      aria-label={
        item.description ? `${item.label} ${item.description}` : item.label
      }
      xstyle={styles.item}
      data-highlighted={active ? "" : undefined}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
    >
      <Stack xstyle={styles.optionText}>
        <Text>{item.label}</Text>
        {item.description ? (
          <Text xstyle={styles.description}>{item.description}</Text>
        ) : null}
      </Stack>
    </CommandItemComponent>
  )
}

export function EditorFootnoteTypeahead({
  controller,
  ariaLabel = "Footnote suggestions",
  ...contentProps
}: EditorFootnoteTypeaheadProps) {
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getServerSnapshot,
  )

  const listId = useId()
  const returnFocus = useRef(true)
  const actionsRef = useRef<PopoverPrimitive.Root.Actions>(null)

  const [connectView] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (element) return controller.connectView()
      },
  )

  const [connectList] = useState(
    () =>
      function connect(element: HTMLDivElement | null) {
        if (element) return controller.connectList(listId)
      },
  )

  const handleOpenChange = useStableCallback(function handleOpenChange(
    open: boolean,
  ) {
    if (!open) controller.close()
  })

  const handleKeyDownCapture = useStableCallback(function handleKeyDownCapture(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    returnFocus.current = event.key !== "Tab" || event.defaultPrevented
  })

  const handleFocusCapture = useStableCallback(function handleFocusCapture() {
    returnFocus.current = true
  })

  const handleKeyDown = useStableCallback(function handleKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Tab") returnFocus.current = event.defaultPrevented

    if (event.key === "Tab" && !event.defaultPrevented) {
      controller.close()
      actionsRef.current?.unmount()
    }
  })

  const handleFinalFocus = useStableCallback(function handleFinalFocus() {
    if (!returnFocus.current) return false

    const element = controller.getAnchor()?.contextElement

    if (element?.contains(element.ownerDocument.activeElement)) return false

    return element ?? false
  })

  return (
    <Popover
      actionsRef={actionsRef}
      modal={false}
      open={snapshot.query !== null}
      onOpenChange={handleOpenChange}
    >
      <Box
        ref={connectView}
        data-slot="editor-footnote-typeahead"
        onKeyDownCapture={handleKeyDownCapture}
        onFocusCapture={handleFocusCapture}
        onKeyDown={handleKeyDown}
      >
        <PopoverTrigger
          id={contentProps.id}
          nativeButton={false}
          role={contentProps.role ?? "textbox"}
          aria-expanded={undefined}
          onKeyDown={preserveFootnoteNativeEditing}
          onKeyUp={preserveFootnoteNativeEditing}
          render={<EditorContent {...contentProps} />}
        />
      </Box>
      <PopoverPopup
        aria-label={ariaLabel}
        anchor={controller.getAnchor()}
        align="start"
        initialFocus={false}
        finalFocus={handleFinalFocus}
      >
        <Command
          autoHighlight={false}
          highlightItemOnHover={false}
          mode="none"
          items={snapshot.items}
        >
          <CommandListComponent
            aria-label={ariaLabel}
            id={listId}
            ref={connectList}
          >
            {snapshot.items.map((item, index) => (
              <FootnoteTypeaheadOption
                key={item.id}
                controller={controller}
                index={index}
                item={item}
                active={index === snapshot.active}
              />
            ))}
          </CommandListComponent>
        </Command>
      </PopoverPopup>
    </Popover>
  )
}
