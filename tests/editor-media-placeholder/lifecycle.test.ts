import type { MediaUpload } from "@editor/media/upload"

import { createEditorMediaPlaceholder } from "@editor/media-placeholder-controller"
import { MediaPlaceholderNode } from "@editor/media-placeholder-node"
import { $createMediaNode, MediaNode } from "@editor/media/model"
import { createEmptyHistoryState, registerHistory } from "@lexical/history"
import { describe, expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  createEditor,
  HISTORY_PUSH_TAG,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"

function fixture(upload: MediaUpload) {
  const editor = createEditor({
    namespace: "placeholder-test",
    nodes: [MediaNode, MediaPlaceholderNode],
    onError(error) {
      throw error
    },
  })

  const history = createEmptyHistoryState()
  const unhistory = registerHistory(editor, history, 1000)
  editor.update(
    () => {
      $getRoot().append($createParagraphNode().append($createTextNode("Keep")))
      $getRoot().getFirstChildOrThrow().selectEnd()
    },
    { discrete: true },
  )
  const controller = createEditorMediaPlaceholder({ upload })
  const unregister = controller.register(editor)
  const key = controller.insert("file")

  if (!key) throw new Error("Missing placeholder")

  return {
    editor,
    controller,
    key,
    history,
    cleanup() {
      unregister()
      unhistory()
    },
  }
}

function deferred() {
  return Promise.withResolvers<string>()
}

function types(editor: ReturnType<typeof createEditor>) {
  return editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .map((node) => node.getType()),
  )
}

const file = new File(["hello"], "report.txt", { type: "text/plain" })

describe("bounded native media placeholder lifecycle", () => {
  for (const suffix of ["?", "#", "?#", "?token=secret", "#fragment"]) {
    test(`invalid upload URL ${suffix} preserves document and permits retry`, async () => {
      let calls = 0

      const f = fixture(() => {
        calls++

        return Promise.resolve(
          calls === 1
            ? `https://media.test/report.txt${suffix}`
            : "https://media.test/a%3Fb%23c.txt",
        )
      })

      const before = JSON.stringify(f.editor.getEditorState().toJSON())

      const selection = f.editor.getEditorState().read(() => {
        const current = $getSelection()

        return current?.clone() ?? null
      })

      const undoLength = f.history.undoStack.length
      const redoLength = f.history.redoStack.length
      expect(await f.controller.start(f.key, file)).toBe(false)
      expect(f.controller.getSnapshot().error).toBe("invalid-result")
      expect(JSON.stringify(f.editor.getEditorState().toJSON())).toBe(before)
      expect(
        f.editor.getEditorState().read(() => {
          const current = $getSelection()

          return current === null ? selection === null : current.is(selection)
        }),
      ).toBe(true)
      expect(f.history.undoStack).toHaveLength(undoLength)
      expect(f.history.redoStack).toHaveLength(redoLength)
      expect(await f.controller.retry(f.key)).toBe(true)
      expect(types(f.editor)).toContain("yopem-media")
      expect(JSON.stringify(f.editor.getEditorState().toJSON())).toContain(
        "https://media.test/a%3Fb%23c.txt",
      )
      f.editor.dispatchCommand(UNDO_COMMAND, undefined)
      await Promise.resolve()
      expect(types(f.editor)).toContain("editor-media-placeholder")
      f.editor.dispatchCommand(REDO_COMMAND, undefined)
      await Promise.resolve()
      expect(types(f.editor)).toContain("yopem-media")
      expect(calls).toBe(2)
      f.cleanup()
    })
  }

  test("insertion has a native undo baseline and redo restores an inert placeholder", async () => {
    let calls = 0

    const f = fixture(() => {
      calls++

      return Promise.resolve("https://media.test/report.txt")
    })

    expect(f.history.undoStack).toHaveLength(1)
    f.editor.dispatchCommand(UNDO_COMMAND, undefined)
    await Promise.resolve()
    expect(types(f.editor)).toEqual(["paragraph"])
    expect(
      f.editor.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe("Keep")
    f.editor.dispatchCommand(REDO_COMMAND, undefined)
    await Promise.resolve()
    expect(types(f.editor)).toContain("editor-media-placeholder")
    expect(await f.controller.retry(f.key)).toBe(false)
    expect(calls).toBe(0)
    f.cleanup()
  })

  test("progress is transient; success replaces once; undo and redo never upload", async () => {
    const gate = deferred()
    let calls = 0

    const f = fixture((_file, context) => {
      calls++
      context.onProgress(45)

      return gate.promise
    })

    const pending = f.controller.start(f.key, file)
    expect(f.controller.getSnapshot().progress).toBe(45)
    expect(types(f.editor)).toContain("editor-media-placeholder")
    const json = JSON.stringify(f.editor.getEditorState().toJSON())
    expect(json).not.toContain("report.txt")
    expect(json).not.toContain("progress")
    gate.resolve("https://media.test/report.txt")
    expect(await pending).toBe(true)
    expect(
      types(f.editor).filter((type) => type === "yopem-media"),
    ).toHaveLength(1)
    f.editor.dispatchCommand(UNDO_COMMAND, undefined)
    await Promise.resolve()
    expect(types(f.editor)).toContain("editor-media-placeholder")
    expect(f.controller.getSnapshot().status).toBe("unavailable")
    f.editor.dispatchCommand(REDO_COMMAND, undefined)
    await Promise.resolve()
    expect(
      types(f.editor).filter((type) => type === "yopem-media"),
    ).toHaveLength(1)
    expect(calls).toBe(1)
    f.cleanup()
  })

  test("typed host and result errors permit explicit retry only", async () => {
    let calls = 0

    const f = fixture(() => {
      calls++

      if (calls === 1) return Promise.reject(new Error("secret credential"))

      if (calls === 2) return Promise.resolve("javascript:alert(1)")

      return Promise.resolve("https://media.test/report.txt")
    })

    expect(await f.controller.start(f.key, file)).toBe(false)
    expect(f.controller.getSnapshot().error).toBe("upload")
    expect(calls).toBe(1)
    expect(await f.controller.retry(f.key)).toBe(false)
    expect(f.controller.getSnapshot().error).toBe("invalid-result")
    expect(await f.controller.retry(f.key)).toBe(true)
    expect(calls).toBe(3)
    f.cleanup()
  })

  for (const mode of [
    "cancel",
    "undo",
    "undo-retained",
    "readonly",
    "document",
    "caret",
    "host",
    "cleanup",
  ] as const) {
    test(`${mode} invalidates pending upload and keeps capacity until settlement`, async () => {
      const gate = deferred()
      let signal: AbortSignal | undefined
      let calls = 0

      const f = fixture((_file, context) => {
        calls++
        signal = context.signal

        return gate.promise
      })

      if (mode === "undo-retained")
        f.editor.update(
          () =>
            $getRoot().append(
              $createParagraphNode().append($createTextNode("Undo this")),
            ),
          { discrete: true, tag: HISTORY_PUSH_TAG },
        )

      const pending = f.controller.start(f.key, file)

      if (mode === "cancel") f.controller.cancel(f.key)

      if (mode === "undo" || mode === "undo-retained") {
        f.editor.dispatchCommand(UNDO_COMMAND, undefined)
        await Promise.resolve()
        expect(types(f.editor).includes("editor-media-placeholder")).toBe(
          mode === "undo-retained",
        )
        expect(
          f.editor.getEditorState().read(() => $getRoot().getTextContent()),
        ).not.toContain("Undo this")
      }

      if (mode === "readonly") f.editor.setEditable(false)

      if (mode === "document")
        f.editor.update(
          () =>
            $getRoot().append(
              $createParagraphNode().append($createTextNode("Unrelated")),
            ),
          { discrete: true },
        )

      if (mode === "caret")
        f.editor.update(() => $getRoot().getLastChildOrThrow().selectEnd(), {
          discrete: true,
        })

      if (mode === "host")
        f.controller.configure(() =>
          Promise.resolve("https://media.test/new.txt"),
        )

      if (mode === "cleanup") f.cleanup()
      expect(signal?.aborted).toBe(true)
      expect(f.controller.getSnapshot().busy).toBe(true)
      expect(await f.controller.start(f.key, file)).toBe(false)
      gate.resolve("https://media.test/late.txt")
      expect(await pending).toBe(false)
      expect(f.controller.getSnapshot().busy).toBe(false)
      expect(types(f.editor)).not.toContain("yopem-media")
      expect(calls).toBe(1)

      if (mode !== "cleanup") f.cleanup()
    })
  }

  for (const notification of [1, 2]) {
    for (const mode of [
      "cancel",
      "host",
      "cleanup",
      "readonly",
      "document",
      "queued-document",
      "caret",
      "undo",
      "undo-retained",
    ] as const) {
      test(`${mode} during startup notification ${notification} never calls the old host`, async () => {
        let calls = 0
        let replacementCalls = 0
        let notifications = 0
        let selectedNotification = 0
        let actionCompleted = false
        let hostEditCommitted = false

        const f = fixture(() => {
          calls++

          return Promise.resolve("https://media.test/old.txt")
        })

        if (mode === "undo-retained")
          f.editor.update(
            () =>
              $getRoot().append(
                $createParagraphNode().append($createTextNode("Undo this")),
              ),
            { discrete: true, tag: HISTORY_PUSH_TAG },
          )

        const before = JSON.stringify(f.editor.getEditorState().toJSON())

        const unsubscribe = f.controller.subscribe(() => {
          if (f.controller.getSnapshot().status !== "uploading") return
          notifications++

          if (notifications !== notification) return
          selectedNotification = notifications

          if (mode === "cancel") f.controller.cancel(f.key)

          if (mode === "host")
            f.controller.configure(() => {
              replacementCalls++

              return Promise.resolve("https://media.test/new.txt")
            })

          if (mode === "cleanup") f.cleanup()

          if (mode === "readonly") f.editor.setEditable(false)

          if (mode === "document" || mode === "queued-document")
            f.editor.update(
              () =>
                $getRoot().append(
                  $createParagraphNode().append($createTextNode("Host edit")),
                ),
              {
                discrete: mode === "document" ? true : undefined,
                onUpdate() {
                  hostEditCommitted = true
                },
              },
            )

          if (mode === "caret")
            f.editor.update(
              () => $getRoot().getLastChildOrThrow().selectEnd(),
              {
                discrete: notification === 1 ? true : undefined,
              },
            )

          if (mode === "undo" || mode === "undo-retained")
            f.editor.dispatchCommand(UNDO_COMMAND, undefined)
          actionCompleted = true
        })

        const result = await f.controller.start(f.key, file)
        expect(selectedNotification).toBe(notification)
        expect(actionCompleted).toBe(true)

        if (mode === "document" || mode === "queued-document") {
          expect(hostEditCommitted).toBe(true)
          expect(
            f.editor.getEditorState().read(() => $getRoot().getTextContent()),
          ).toContain("Host edit")
          expect(JSON.stringify(f.editor.getEditorState().toJSON())).not.toBe(
            before,
          )
        }

        expect(result).toBe(false)
        expect(calls).toBe(0)
        expect(replacementCalls).toBe(0)
        expect(f.controller.getSnapshot().busy).toBe(false)
        expect(await f.controller.retry(f.key)).toBe(false)
        expect(types(f.editor)).not.toContain("yopem-media")

        if (mode === "undo" || mode === "undo-retained") {
          expect(types(f.editor).includes("editor-media-placeholder")).toBe(
            mode === "undo-retained",
          )
          expect(
            f.editor.getEditorState().read(() => $getRoot().getTextContent()),
          ).not.toContain("Undo this")
        }

        if (["cancel", "host", "cleanup", "readonly", "caret"].includes(mode))
          expect(JSON.stringify(f.editor.getEditorState().toJSON())).toBe(
            before,
          )
        unsubscribe()

        if (mode === "host") {
          expect(await f.controller.start(f.key, file)).toBe(true)
          expect(replacementCalls).toBe(1)
          expect(calls).toBe(0)
        }

        if (mode !== "cleanup") f.cleanup()
      })
    }
  }

  for (const mode of ["cancel", "host", "cleanup", "undo"] as const) {
    test(`${mode} during host progress retains capacity until the started host settles`, async () => {
      const gate = deferred()
      let calls = 0
      let signal: AbortSignal | undefined
      let invalidated = false

      const f = fixture((_file, context) => {
        calls++
        signal = context.signal
        context.onProgress(45)

        return gate.promise
      })

      const unsubscribe = f.controller.subscribe(() => {
        if (invalidated || f.controller.getSnapshot().progress !== 45) return
        invalidated = true

        if (mode === "cancel") f.controller.cancel(f.key)

        if (mode === "host")
          f.controller.configure(() =>
            Promise.resolve("https://media.test/new.txt"),
          )

        if (mode === "cleanup") f.cleanup()

        if (mode === "undo") f.editor.dispatchCommand(UNDO_COMMAND, undefined)
      })

      const pending = f.controller.start(f.key, file)

      if (mode === "undo") await Promise.resolve()
      expect(invalidated).toBe(true)
      expect(signal?.aborted).toBe(true)
      expect(f.controller.getSnapshot().busy).toBe(true)
      expect(await f.controller.start(f.key, file)).toBe(false)
      gate.resolve("https://media.test/late.txt")
      expect(await pending).toBe(false)
      expect(f.controller.getSnapshot().busy).toBe(false)
      expect(types(f.editor)).not.toContain("yopem-media")
      expect(calls).toBe(1)
      unsubscribe()

      if (mode !== "cleanup") f.cleanup()
    })
  }

  test("cancel removal is undoable but restored node cannot resume", async () => {
    const gate = deferred()
    const f = fixture(() => gate.promise)
    const pending = f.controller.start(f.key, file)
    f.controller.remove(f.key)
    expect(types(f.editor)).not.toContain("editor-media-placeholder")
    f.editor.dispatchCommand(UNDO_COMMAND, undefined)
    await Promise.resolve()
    expect(types(f.editor)).toContain("editor-media-placeholder")
    gate.resolve("https://media.test/late.txt")
    expect(await pending).toBe(false)
    expect(await f.controller.retry(f.key)).toBe(false)
    f.cleanup()
  })

  test("two roots remain isolated and one controller cannot bind both", async () => {
    const gate = deferred()
    const first = fixture(() => gate.promise)

    const second = fixture(() =>
      Promise.resolve("https://media.test/second.txt"),
    )

    expect(() => first.controller.register(second.editor)).toThrow()
    const pending = first.controller.start(first.key, file)
    expect(await second.controller.start(second.key, file)).toBe(true)
    first.controller.cancel(first.key)
    gate.resolve("https://media.test/first.txt")
    expect(await pending).toBe(false)
    expect(types(first.editor)).not.toContain("yopem-media")
    expect(types(second.editor)).toContain("yopem-media")
    first.cleanup()
    second.cleanup()
  })

  test("reload keeps kind only and requires fresh explicit file selection", async () => {
    const f = fixture(() => Promise.resolve("https://media.test/report.txt"))
    const json = JSON.stringify(f.editor.getEditorState().toJSON())
    f.editor.setEditorState(f.editor.parseEditorState(json))
    await Promise.resolve()

    const restored = f.editor.getEditorState().read(() =>
      $getRoot()
        .getChildren()
        .find((node) => node instanceof MediaPlaceholderNode)
        ?.getKey(),
    )

    if (!restored) throw new Error("Missing restored node")
    expect(await f.controller.retry(restored)).toBe(false)
    expect(await f.controller.start(restored, file)).toBe(true)
    f.cleanup()
  })

  test("rejects oversized files and excessive placeholders before host call", async () => {
    let calls = 0

    const f = fixture(() => {
      calls++

      return Promise.resolve("https://media.test/file")
    })

    expect(
      await f.controller.start(
        f.key,
        new File([new Uint8Array(16 * 1024 * 1024 + 1)], "large.bin"),
      ),
    ).toBe(false)
    expect(f.controller.getSnapshot().error).toBe("file-limit")
    expect(calls).toBe(0)

    for (let i = 0; i < 20; i++) f.controller.insert("file")
    expect(
      types(f.editor).filter((type) => type === "editor-media-placeholder")
        .length,
    ).toBeLessThanOrEqual(16)
    f.cleanup()
  })

  test("host mutation queued before resolution cannot overwrite content", async () => {
    const gate = deferred()
    const f = fixture(() => gate.promise)
    const pending = f.controller.start(f.key, file)
    f.editor.update(() =>
      $getRoot().append(
        $createMediaNode({ kind: "file", url: "https://media.test/host.txt" }),
      ),
    )
    gate.resolve("https://media.test/late.txt")
    expect(await pending).toBe(false)
    expect(
      types(f.editor).filter((type) => type === "yopem-media"),
    ).toHaveLength(1)
    f.cleanup()
  })
})
