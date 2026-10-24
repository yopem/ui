import {
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  mergeRegister,
  type LexicalEditor,
} from "lexical"

import {
  createEditorEmojiHistory,
  type EditorEmojiHistory,
} from "./emoji-history"
import { createEditorSelectionBookmark } from "./selection-bookmark"
import {
  editorEmojiInventory,
  parseEditorEmojiInventory,
  searchEditorEmoji,
  type EditorEmoji,
} from "./typeahead-emoji"

export interface EditorEmojiOptions {
  inventory?: readonly EditorEmoji[]
  filter?: (emoji: EditorEmoji) => boolean
  history?: EditorEmojiHistory
}

export function createEditorEmojiPicker(
  editor: LexicalEditor,
  options: EditorEmojiOptions = {},
) {
  const inventory = parseEditorEmojiInventory(
    options.inventory ?? editorEmojiInventory,
  )

  const filter = options.filter
  const history = options.history ?? createEditorEmojiHistory()
  const bookmark = createEditorSelectionBookmark(editor)
  const listeners = new Set<() => void>()

  const categories: readonly string[] = [
    ...new Set(inventory.map((emoji) => emoji.category ?? "custom")),
  ]

  let unregister: (() => void) | undefined
  let open = false
  let query = ""
  let category = "all"
  let offset = 0
  let returnFocusToTrigger = true
  let preview: EditorEmoji | null = null

  function readSnapshot() {
    const usage = history.getSnapshot()

    const candidates =
      category === "frequent"
        ? usage.flatMap((entry) => {
            const current = inventory.find(
              (emoji) => emoji.id === entry.emoji.id,
            )

            return current ? [current] : []
          })
        : inventory

    function matches(emoji: EditorEmoji) {
      return (
        (category === "all" ||
          category === "frequent" ||
          `category:${emoji.category ?? "custom"}` === category) &&
        (!filter || filter(emoji))
      )
    }

    const items: readonly EditorEmoji[] = searchEditorEmoji(
      query,
      candidates,
      matches,
      offset,
    )

    return {
      open,
      query,
      category,
      offset,
      returnFocusToTrigger,
      preview,
      editable: editor.isEditable(),
      valid: bookmark.getSnapshot(),
      categories,
      usage,
      items,
      hasNext:
        searchEditorEmoji(query, candidates, matches, offset + 50).length > 0,
    } as const
  }

  let snapshot = readSnapshot()

  const serverSnapshot = {
    ...snapshot,
    open: false,
    editable: false,
    valid: false,
  }

  function publish() {
    snapshot = readSnapshot()

    for (const listener of listeners) listener()
  }

  function setOpen(next: boolean) {
    if (next && (!editor.isEditable() || !unregister || editor.isComposing()))
      return

    if (next) {
      returnFocusToTrigger = true
      editor.getEditorState().read(bookmark.capture)
    } else bookmark.clear()
    open = next
    preview = null
    query = ""
    offset = 0
    publish()
  }

  function insert(id: string) {
    if (
      !open ||
      !unregister ||
      !editor.isEditable() ||
      editor.isComposing() ||
      !bookmark.getSnapshot()
    )
      return false
    const item = snapshot.items.find((candidate) => candidate.id === id)

    if (!item) return false
    let inserted = false
    editor.update(
      () => {
        if (!editor.isEditable() || !bookmark.restore()) return
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) return
        selection.insertText(item.emoji)
        inserted = true
        bookmark.clear()
      },
      { tag: HISTORY_PUSH_TAG, discrete: true },
    )

    if (!inserted) return false
    history.record(item)
    returnFocusToTrigger = false
    setOpen(false)

    if (editor.getRootElement()) editor.focus()

    return true
  }

  return {
    setOpen,
    insert,
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return serverSnapshot
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      if (!unregister) {
        unregister = mergeRegister(
          bookmark.subscribe(publish),
          history.subscribe(publish),
          editor.registerEditableListener((editable) => {
            if (!editable) {
              open = false
              bookmark.clear()
            }

            publish()
          }),
        )
        publish()
      }

      return function unsubscribe() {
        listeners.delete(listener)

        if (!listeners.size) {
          unregister?.()
          unregister = undefined
          open = false
          bookmark.clear()
          publish()
        }
      }
    },
    highlight(value: EditorEmoji | null) {
      const next = snapshot.items.find((item) => item === value) ?? null

      if (preview === next) return
      preview = next
      publish()
    },
    setQuery(this: void, value: string) {
      query = value.slice(0, 64)
      preview = null
      offset = 0
      publish()
    },
    setCategory(value: string) {
      if (
        value !== "all" &&
        value !== "frequent" &&
        !categories.some((name) => `category:${name}` === value)
      )
        return
      category = value
      preview = null
      offset = 0
      publish()
    },
    previous() {
      offset = Math.max(0, offset - 50)
      preview = null
      publish()
    },
    next() {
      if (snapshot.hasNext) {
        offset += 50
        preview = null
        publish()
      }
    },
    clearHistory() {
      offset = 0
      history.clear()
      publish()
    },
  }
}

export type EditorEmojiPickerController = ReturnType<
  typeof createEditorEmojiPicker
>
