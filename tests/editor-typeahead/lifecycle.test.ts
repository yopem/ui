import type { MentionIdentity } from "@editor/mention-codec"

import { MentionNode } from "@editor/mention-node"
import { createEditorTypeahead } from "@editor/typeahead"
import { buildEditorFromExtensions } from "@lexical/extension"
import { RichTextExtension } from "@lexical/rich-text"
import { expect, test } from "bun:test"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
} from "lexical"

function defer() {
  let resolve: (value: readonly MentionIdentity[]) => void = () => {
    throw new Error("not initialized")
  }

  let reject: (error: Error) => void = () => {
    throw new Error("not initialized")
  }

  const promise = new Promise<readonly MentionIdentity[]>((yes, no) => {
    resolve = yes
    reject = no
  })

  return { promise, resolve, reject }
}

function setup(
  loader?: (
    query: string,
    signal: AbortSignal,
  ) => Promise<readonly MentionIdentity[]>,
) {
  const mentions = { load: loader, debounceMs: 0 }
  const controller = createEditorTypeahead({ mentions })

  const editor = buildEditorFromExtensions({
    name: "test/typeahead",
    dependencies: [RichTextExtension, controller.extension],
  })

  function type(text: string) {
    editor.update(
      () => {
        const previous = $getRoot().getFirstDescendant()

        const node = $isTextNode(previous)
          ? previous.setTextContent(text)
          : $createTextNode(text)

        if (!node.isAttached())
          $getRoot().clear().append($createParagraphNode().append(node))
        node.selectEnd()
      },
      { discrete: true },
    )
  }

  return { controller, editor, type, mentions }
}

async function tick() {
  await new Promise((resolve) => setTimeout(resolve, 10))
}

test("missing mention loader never registers fake candidates", () => {
  const { controller, editor, type, mentions } = setup()
  type("@Ada")
  expect(editor.hasNodes([MentionNode])).toBe(false)
  expect(controller.getSnapshot().query).toBeNull()
  mentions.load = () => Promise.resolve([{ id: "late", label: "Late" }])
  type("@Late")
  expect(controller.getSnapshot().query).toBeNull()
  editor.dispose()
})

test("async stale responses, abort, host replacement, readonly and disposal fail closed", async () => {
  const calls: {
    query: string
    signal: AbortSignal
    request: ReturnType<typeof defer>
  }[] = []

  const { controller, editor, type } = setup((query, signal) => {
    const request = defer()
    calls.push({ query, signal, request })

    return request.promise
  })

  expect(editor.hasNodes([MentionNode])).toBe(true)
  type("@A")
  await tick()
  type("@Ad")
  await tick()
  expect(calls[0]?.signal.aborted).toBe(true)
  calls[1]?.request.resolve([{ id: "ada", label: "Ada" }])
  await tick()
  calls[0]?.request.resolve([{ id: "old", label: "Old" }])
  await tick()
  expect(controller.getSnapshot().items.map((item) => item.id)).toEqual(["ada"])
  const replacement = editor.getEditorState().clone()
  const key = controller.getSnapshot().query?.key
  expect(key).toBeDefined()
  expect(
    replacement.read(() => $getRoot().getFirstDescendant()?.getKey()),
  ).toBe(key)
  editor.setEditorState(replacement)
  expect(controller.choose("ada")).toBe(false)
  type("@Err")
  await tick()
  calls.at(-1)?.request.reject(new Error("private backend detail"))
  await tick()
  expect(controller.getSnapshot().status).toBe("error")
  expect(JSON.stringify(controller.getSnapshot())).not.toContain(
    "private backend detail",
  )
  type("@Pending")
  await tick()
  editor.setEditable(false)
  expect(calls.at(-1)?.signal.aborted).toBe(true)
  expect(controller.getSnapshot().query).toBeNull()
  editor.dispose()
  expect(controller.choose("ada")).toBe(false)
})

test("host slash action consumes current trigger and calls registered action", () => {
  let actions = 0

  for (const label of ["\u200B", "\u202EHidden"]) {
    expect(() =>
      createEditorTypeahead({
        commands: [
          {
            id: "hidden",
            label,
            description: "Count host actions",
            run() {
              actions++
            },
          },
        ],
      }),
    ).toThrow()
  }

  const controller = createEditorTypeahead({
    commands: [
      {
        id: "custom",
        label: "Custom",
        description: "Count host actions",
        run() {
          actions++
        },
      },
    ],
  })

  const editor = buildEditorFromExtensions({
    name: "test/slash",
    dependencies: [RichTextExtension, controller.extension],
  })

  editor.update(
    () => {
      const text = $createTextNode("/custom")
      $getRoot().clear().append($createParagraphNode().append(text))
      text.selectEnd()
    },
    { discrete: true },
  )
  expect(controller.choose("custom")).toBe(true)
  editor.read(() => expect($getRoot().getTextContent()).toBe(""))
  expect(actions).toBe(1)
  editor.dispose()
})
