import type { EditorState, LexicalEditor } from "lexical"

import { CodeExtension } from "@lexical/code"
import { ListExtension, CheckListExtension } from "@lexical/list"
import { RichTextExtension } from "@lexical/rich-text"
import { TableExtension } from "@lexical/table"
import {
  $getNodeByKey,
  $addUpdateTag,
  createCommand,
  $isTextNode,
  $getSelection,
  $createRangeSelectionFromDom,
  $setSelection,
  $isRangeSelection,
  $createTextNode,
  defineExtension,
  mergeRegister,
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  BLUR_COMMAND,
  HISTORY_PUSH_TAG,
} from "lexical"
import { z } from "zod"

import type { MentionIdentity } from "./mention-codec"
import type { EditorSlashCommand } from "./typeahead-commands"
import type { EditorEmoji } from "./typeahead-emoji"
import type { EditorTypeaheadQuery } from "./typeahead-query"

import { createEditorEmojiHistory } from "./emoji-history"
import {
  decodeMention,
  safeMentionProfileURL,
  mentionIdentitySchema,
} from "./mention-codec"
import {
  MentionNode,
  $createMentionNode,
  registerMentionProfileResolver,
} from "./mention-node"
import { editorSlashCommands } from "./typeahead-commands"
import {
  searchEditorEmoji,
  editorEmojiInventory,
  parseEditorEmojiInventory,
} from "./typeahead-emoji"
import {
  $readEditorTypeaheadQuery,
  sameEditorTypeaheadQuery,
} from "./typeahead-query"

const SELECT_TYPEAHEAD_COMMAND = createCommand<string>("yopem/select-typeahead")

export interface EditorTypeaheadOptions {
  readonly commands?: readonly EditorSlashCommand[]
  readonly mentions?: {
    readonly load?: (
      query: string,
      signal: AbortSignal,
    ) => Promise<readonly MentionIdentity[]>
    readonly debounceMs?: number
    readonly profileURL?: (id: string) => string | null
  }
  readonly emoji?: readonly EditorEmoji[]
  readonly filterEmoji?: (emoji: EditorEmoji) => boolean
  readonly onDiagnostic?: (
    code: "mention-load" | "mention-results" | "mention-profile",
  ) => void
}

export interface EditorTypeaheadItem {
  readonly id: string
  readonly label: string
  readonly description?: string
  readonly emoji?: string
  readonly identity?: MentionIdentity
  readonly profileURL?: string
}

export interface EditorTypeaheadSnapshot {
  readonly query: EditorTypeaheadQuery | null
  readonly items: readonly EditorTypeaheadItem[]
  readonly active: number
  readonly status: "closed" | "loading" | "ready" | "empty" | "error"
  readonly revision: number
}

export function createEditorTypeahead(options: EditorTypeaheadOptions = {}) {
  const mentionOptions = options.mentions
  const mentionLoader = mentionOptions?.load?.bind(mentionOptions)
  const profileResolver = mentionOptions?.profileURL?.bind(mentionOptions)

  const mentionDelay = Math.min(
    1000,
    Math.max(0, mentionOptions?.debounceMs ?? 150),
  )

  if ((options.commands?.length ?? 0) > 100)
    throw new Error("Too many slash commands")
  const custom = (options.commands ?? []).map((command) => ({ ...command }))
  const ids = new Set<string>()

  for (const command of custom) {
    if (
      !/^[\w-]{1,64}$/.test(command.id) ||
      ids.has(command.id) ||
      !mentionIdentitySchema.shape.label.safeParse(command.label).success ||
      !command.description.trim() ||
      command.description.length > 256 ||
      !z.function().safeParse(command.run).success
    )
      throw new Error("Invalid slash command")
    ids.add(command.id)
  }

  const inventory = options.emoji ?? editorEmojiInventory

  const emoji = parseEditorEmojiInventory(inventory)
  let editor: LexicalEditor | null = null

  let snapshot: EditorTypeaheadSnapshot = {
    query: null,
    items: [],
    active: 0,
    status: "closed",
    revision: 0,
  }

  const serverSnapshot = snapshot
  const listeners = new Set<() => void>()
  const emojiHistory = createEditorEmojiHistory()
  let request: AbortController | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let capturedState: EditorState | null = null
  let dismissed: EditorTypeaheadQuery | null = null
  let commands: readonly EditorSlashCommand[] = []
  let composing = false
  let listId: string | null = null
  let suspended = false
  const optionElements = new Map<number, HTMLDivElement>()

  const ariaNames = [
    "aria-controls",
    "aria-autocomplete",
    "aria-activedescendant",
  ]

  const rootAttributes = new Map<string, string | null>()

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
    const active = snapshot.items[snapshot.active]

    if (listId && snapshot.query) {
      root.setAttribute("aria-controls", listId)
      root.setAttribute("aria-autocomplete", "list")

      const option = optionElements.get(snapshot.active)

      if (active && option?.id)
        root.setAttribute("aria-activedescendant", option.id)
      else root.removeAttribute("aria-activedescendant")
    } else {
      restoreAria(root)
    }
  }

  function publish(next: Omit<EditorTypeaheadSnapshot, "revision">) {
    snapshot = { ...next, revision: snapshot.revision + 1 }
    syncAria()

    for (const listener of listeners) listener()
  }

  function abort() {
    request?.abort()
    request = null

    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  function close() {
    abort()
    capturedState = null

    if (snapshot.query) dismissed = snapshot.query

    if (snapshot.status !== "closed")
      publish({ query: null, items: [], active: 0, status: "closed" })
  }

  function validCurrent(
    query: EditorTypeaheadQuery,
    state: EditorState | null,
  ) {
    if (
      !editor ||
      !editor.isEditable() ||
      composing ||
      editor.isComposing() ||
      editor.getEditorState() !== state
    )
      return false

    return editor
      .getEditorState()
      .read(() => sameEditorTypeaheadQuery(query, $readEditorTypeaheadQuery()))
  }

  function diagnostic(
    code: "mention-load" | "mention-results" | "mention-profile",
  ) {
    options.onDiagnostic?.(code)
  }

  function resolveProfile(id: string) {
    if (!profileResolver) return null

    try {
      const value = profileResolver(id)
      const url = safeMentionProfileURL(value)

      if (value && !url) diagnostic("mention-profile")

      return url
    } catch {
      diagnostic("mention-profile")

      return null
    }
  }

  function mentionItems(values: readonly MentionIdentity[]) {
    if (!Array.isArray(values) || values.length > 50) {
      diagnostic("mention-results")
      throw new Error("Invalid mention results")
    }

    const seen = new Set<string>()
    const items: EditorTypeaheadItem[] = []

    for (const value of values) {
      const identity = decodeMention(value)

      if (!identity || seen.has(identity.id)) {
        diagnostic("mention-results")
        throw new Error("Invalid mention results")
      }

      seen.add(identity.id)
      items.push({
        ...identity,
        identity,
        profileURL: resolveProfile(identity.id) ?? undefined,
      })
    }

    return items
  }

  function refresh(state: EditorState, dirty: boolean, typing: boolean) {
    if (
      !editor ||
      !editor.isEditable() ||
      suspended ||
      composing ||
      editor.isComposing()
    ) {
      close()

      return
    }

    const query = state.read($readEditorTypeaheadQuery)

    if (!query || (query.kind === "mention" && !mentionLoader)) {
      close()
      dismissed = null

      return
    }

    if (sameEditorTypeaheadQuery(query, dismissed)) return

    if (
      snapshot.query &&
      dirty &&
      (!typing || sameEditorTypeaheadQuery(query, snapshot.query))
    ) {
      close()
      dismissed = query

      return
    }

    if (sameEditorTypeaheadQuery(query, snapshot.query)) {
      capturedState = state

      return
    }

    abort()
    dismissed = null
    capturedState = state

    if (query.kind === "slash") {
      const instance = editor
      commands = [
        ...editorSlashCommands(instance).filter(
          (command) => !ids.has(command.id),
        ),
        ...custom,
      ].filter((command) => !command.available || command.available(instance))
      const text = query.query.trim().toLocaleLowerCase()

      const items = commands
        .filter((command) =>
          `${command.id} ${command.label} ${command.description}`
            .toLocaleLowerCase()
            .includes(text),
        )
        .map(({ id, label, description }) => ({ id, label, description }))

      publish({
        query,
        items,
        active: 0,
        status: items.length ? "ready" : "empty",
      })
    } else if (query.kind === "emoji") {
      const items = searchEditorEmoji(query.query, emoji, options.filterEmoji)
      publish({
        query,
        items,
        active: 0,
        status: items.length ? "ready" : "empty",
      })
    } else {
      publish({ query, items: [], active: 0, status: "loading" })
      const revision = snapshot.revision
      const pending = new AbortController()
      request = pending

      const activeQuery = query

      async function load() {
        timer = undefined

        try {
          const values = await mentionLoader?.(
            activeQuery.query,
            pending.signal,
          )

          if (
            pending.signal.aborted ||
            snapshot.revision !== revision ||
            !validCurrent(activeQuery, capturedState)
          )
            return
          const items = mentionItems(values ?? [])
          publish({
            query,
            items,
            active: 0,
            status: items.length ? "ready" : "empty",
          })
        } catch {
          if (
            pending.signal.aborted ||
            snapshot.revision !== revision ||
            !validCurrent(activeQuery, capturedState)
          )
            return
          diagnostic("mention-load")
          publish({ query, items: [], active: 0, status: "error" })
        }
      }

      timer = setTimeout(() => {
        void load()
      }, mentionDelay)
    }
  }

  function applyChoice(id: string) {
    const instance = editor
    const query = snapshot.query
    const item = snapshot.items.find((entry) => entry.id === id)

    if (!instance || !query || !item || !validCurrent(query, capturedState)) {
      close()

      return false
    }

    const command = commands.find((entry) => entry.id === id)

    if (
      query.kind === "slash" &&
      (!command || (command.available && !command.available(instance)))
    ) {
      close()

      return false
    }

    if (!sameEditorTypeaheadQuery(query, $readEditorTypeaheadQuery()))
      return false
    const node = $getNodeByKey(query.key)
    const selection = $getSelection()

    if (!$isTextNode(node) || !$isRangeSelection(selection)) return false
    $addUpdateTag(HISTORY_PUSH_TAG)
    selection.setTextNodeRange(node, query.start, node, query.end)
    selection.removeText()
    close()

    if (query.kind === "slash") command?.run(instance)
    else if (item.identity)
      selection.insertNodes([
        $createMentionNode(item.identity),
        $createTextNode(" "),
      ])
    else if (item.emoji) {
      selection.insertText(item.emoji)
      const selectedEmoji = emoji.find((entry) => entry.id === item.id)

      if (selectedEmoji) emojiHistory.record(selectedEmoji)
    }

    return true
  }

  function choose(id: string) {
    return editor?.dispatchCommand(SELECT_TYPEAHEAD_COMMAND, id) ?? false
  }

  function highlight(index: number) {
    if (!snapshot.items.length || !Number.isInteger(index)) return
    publish({
      ...snapshot,
      active: Math.max(0, Math.min(index, snapshot.items.length - 1)),
    })
  }

  function keydown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      composing ||
      event.isComposing ||
      event.keyCode === 229 ||
      !editor?.isEditable()
    )
      return false

    const query = snapshot.query ?? dismissed
    const root = editor.getRootElement()
    const nativeSelection = root?.ownerDocument.getSelection()

    if (
      query &&
      root &&
      nativeSelection &&
      !nativeSelection.isCollapsed &&
      root.contains(nativeSelection.anchorNode) &&
      root.contains(nativeSelection.focusNode) &&
      sameEditorTypeaheadQuery(query, $readEditorTypeaheadQuery())
    ) {
      const selection = $createRangeSelectionFromDom(nativeSelection, editor)

      if (selection) {
        $setSelection(selection)
        close()

        return false
      }
    }

    if (!snapshot.query) return false

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
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter"]

    if (!keys.includes(event.key)) return false

    if (event.key === "Enter") {
      const item = snapshot.items[snapshot.active]

      if (!item) return false
      event.preventDefault()

      return choose(item.id)
    }

    event.preventDefault()
    const count = snapshot.items.length

    if (count)
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

  const extension = defineExtension({
    name: "@yopem-ui/editor-typeahead",
    nodes: mentionLoader ? [MentionNode] : [],
    dependencies: [
      RichTextExtension,
      ListExtension,
      CheckListExtension,
      CodeExtension,
      TableExtension,
    ],
    register(instance) {
      if (editor) throw new Error("Typeahead controller requires one editor")
      editor = instance
      let registered = true

      function startComposition() {
        composing = true
        const query = snapshot.query
        close()

        if (query) dismissed = null
      }

      function endComposition() {
        composing = false
        queueMicrotask(() => {
          if (editor === instance)
            refresh(instance.getEditorState(), false, false)
        })
      }

      const unregisterProfile = profileResolver
        ? registerMentionProfileResolver(instance, resolveProfile)
        : undefined

      return mergeRegister(
        instance.registerUpdateListener(
          ({ editorState, dirtyElements, dirtyLeaves }) =>
            refresh(
              editorState,
              dirtyElements.size > 0 || dirtyLeaves.size > 0,
              snapshot.query !== null && dirtyLeaves.has(snapshot.query.key),
            ),
        ),
        instance.registerEditableListener((editable) => {
          if (!editable) close()
        }),
        instance.registerCommand(
          SELECT_TYPEAHEAD_COMMAND,
          applyChoice,
          COMMAND_PRIORITY_HIGH,
        ),
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
                instance.getRootElement() === root &&
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
          if (previous) restoreAria(previous)
          rootAttributes.clear()

          if (root)
            for (const name of ariaNames)
              rootAttributes.set(name, root.getAttribute(name))
          previous?.removeEventListener(
            "compositionstart",
            startComposition,
            true,
          )
          previous?.removeEventListener("compositionend", endComposition)
          root?.addEventListener("compositionstart", startComposition, true)
          root?.addEventListener("compositionend", endComposition)

          if (!root) close()
        }),
        () => {
          registered = false
          unregisterProfile?.()
          close()
          editor = null
          dismissed = null
          composing = false
        },
      )
    },
  })

  return {
    extension,
    choose,
    close,
    highlight,
    emojiHistory,
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return serverSnapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
    connectOption(index: number, element: HTMLDivElement | null) {
      if (element) {
        optionElements.set(index, element)

        if (index === snapshot.active)
          element.scrollIntoView({ block: "nearest" })
      } else optionElements.delete(index)
      syncAria()
    },
    connectView() {
      suspended = false

      return () => {
        suspended = true
        close()
      }
    },
    connectList(id: string) {
      listId = id
      syncAria()

      return () => {
        listId = null
        optionElements.clear()
        syncAria()
      }
    },
    getAnchor() {
      const root = editor?.getRootElement()

      if (!root) return null
      const selection = root.ownerDocument.getSelection()

      if (!selection?.rangeCount || !root.contains(selection.anchorNode))
        return root
      const range = selection.getRangeAt(0).cloneRange()

      return {
        getBoundingClientRect() {
          return range.getBoundingClientRect()
        },
        contextElement: root,
      }
    },
  }
}

export type EditorTypeaheadController = ReturnType<typeof createEditorTypeahead>
