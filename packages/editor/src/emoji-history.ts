import type { EditorEmoji } from "./typeahead-emoji"

import { validateEditorEmoji } from "./typeahead-emoji"

export interface EditorEmojiUsage {
  readonly emoji: EditorEmoji
  readonly count: number
}

export function createEditorEmojiHistory() {
  let snapshot: readonly EditorEmojiUsage[] = []
  const empty: readonly EditorEmojiUsage[] = []
  const listeners = new Set<() => void>()

  function publish(next: readonly EditorEmojiUsage[]) {
    snapshot = next

    for (const listener of listeners) listener()
  }

  function record(value: EditorEmoji) {
    const emoji = validateEditorEmoji(value)

    if (!emoji) throw new Error("Invalid emoji usage")
    const previous = snapshot.find((entry) => entry.emoji.id === emoji.id)
    publish(
      [
        {
          emoji,
          count: Math.min(Number.MAX_SAFE_INTEGER, (previous?.count ?? 0) + 1),
        },
        ...snapshot.filter((entry) => entry.emoji.id !== emoji.id),
      ]
        .sort((a, b) => b.count - a.count)
        .slice(0, 50),
    )
  }

  return {
    record,
    clear() {
      publish([])
    },
    getSnapshot(this: void) {
      return snapshot
    },
    getServerSnapshot(this: void) {
      return empty
    },
    subscribe(this: void, listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type EditorEmojiHistory = ReturnType<typeof createEditorEmojiHistory>
