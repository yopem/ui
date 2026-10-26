import { $isEditorDrawingNode, EditorDrawingNode } from "@editor/drawing-node"
import { withDOM } from "@lexical/headless/dom"
import { expect, test } from "bun:test"
import { $getRoot, createEditor } from "lexical"

const scene = {
  elements: [
    {
      id: "source-rectangle",
      type: "rectangle",
      x: 24,
      y: 24,
      width: 120,
      height: 64,
    },
  ],
}

function serializedState(elements: readonly object[]) {
  return {
    root: {
      children: [
        {
          type: "editor-drawing",
          version: 1,
          elements,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  }
}

test("mounts saved drawing DOM, keeps fallback, rejects unsupported state, and detaches", () => {
  withDOM((window) => {
    const iframe = window.document.createElement("iframe")
    window.document.body.append(iframe)
    const ownerDocument = iframe.contentDocument

    if (!ownerDocument) throw new Error("Missing drawing owner document")

    const root = ownerDocument.createElement("div")
    ownerDocument.body.append(root)

    const editor = createEditor({
      namespace: "drawing-dom-mount",
      nodes: [EditorDrawingNode],
      onError(error) {
        throw error
      },
    })

    editor.setRootElement(root)
    editor.setEditorState(
      editor.parseEditorState(JSON.stringify(serializedState(scene.elements))),
    )

    const drawing = root.querySelector("figure[data-editor-drawing='1']")
    expect(drawing).not.toBeNull()
    expect(drawing?.ownerDocument).toBe(ownerDocument)
    expect(drawing?.getAttribute("data-editor-drawing-scene")).toBe(
      JSON.stringify(scene),
    )
    expect(drawing?.getAttribute("contenteditable")).toBe("false")

    const exported = editor.getEditorState().read(() => {
      const node = $getRoot().getFirstChild()

      if (!$isEditorDrawingNode(node))
        throw new Error("Missing drawing fixture")

      return node.exportDOM(editor).element
    })

    expect(exported?.ownerDocument).toBe(ownerDocument)

    const fallback = editor.getEditorState().read(() => {
      const node = $getRoot().getFirstChild()

      if (!$isEditorDrawingNode(node))
        throw new Error("Missing drawing fixture")

      return node.decorate(editor)
    })

    expect(fallback).toBe("Drawing with 1 elements")

    const saved = editor.getEditorState().toJSON()
    expect(() =>
      editor.parseEditorState(
        JSON.stringify(serializedState([{ id: "unsupported", type: "image" }])),
      ),
    ).toThrow()

    expect(editor.getEditorState().toJSON()).toEqual(saved)

    editor.setRootElement(null)
    expect(root.childElementCount).toBe(0)
  })
})
