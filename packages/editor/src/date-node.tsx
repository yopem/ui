"use client"

import type {
  DOMConversionMap,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from "lexical"
import type { ReactNode } from "react"

import { Button } from "@registry/components/ui/button"
import { Calendar } from "@registry/components/ui/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@registry/components/ui/popover"
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
  HISTORY_PUSH_TAG,
} from "lexical"
import { useRef, useState } from "react"

import {
  editorDateFromHTMLAttributes,
  editorDateHTMLAttributes,
  editorDateNodeSchema,
  editorDateFromCalendarDate,
  editorDateToCalendarDate,
  formatEditorDate,
  parseEditorDate,
  validateEditorDateHTML,
  type EditorDateValue,
} from "./date-model"
import { useEditor, useEditorState } from "./root"

export type SerializedEditorDateNode = SerializedLexicalNode & {
  type: "editor-date"
  version: 1
  date: EditorDateValue
}

export function EditorDateInline({
  date,
  nodeKey,
}: {
  date: EditorDateValue
  nodeKey: NodeKey
}) {
  const editor = useEditor()
  const { editable } = useEditorState()
  const target = useRef<{ date: EditorDateValue } | null>(null)
  const [open, setOpen] = useState(false)
  const calendarDate = editorDateToCalendarDate(date)

  function prepare() {
    if (!editable || !editor.isEditable()) return
    target.current = { date }
  }

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) prepare()
    else target.current = null
  }

  function apply(value: EditorDateValue) {
    const current = target.current

    if (!current || !editable || !editor.isEditable()) {
      setOpen(false)

      return
    }

    let changed = false

    editor.update(
      () => {
        if (!editor.isEditable()) return
        const node = $getNodeByKey(nodeKey)

        if (
          !(node instanceof EditorDateNode) ||
          !node.isAttached() ||
          node.getDate() !== current.date
        )
          return

        if (node.getDate() === value) return
        node.setDate(value)
        changed = true
      },
      { discrete: true, tag: HISTORY_PUSH_TAG },
    )
    target.current = null
    setOpen(false)

    if (changed) editor.focus()
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger
        render={<Button size="sm" variant="ghost" />}
        disabled={!editable}
        aria-label={`Choose date ${formatEditorDate(date)}`}
        onFocus={prepare}
      >
        {formatEditorDate(date)}
      </PopoverTrigger>
      <PopoverPopup
        onBlur={(event) => {
          if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
          )
            return
          changeOpen(false)
        }}
      >
        <Calendar
          defaultMonth={calendarDate}
          mode="single"
          onSelect={(selected) => {
            if (!selected) return
            apply(editorDateFromCalendarDate(selected))
          }}
          selected={calendarDate}
        />
      </PopoverPopup>
    </Popover>
  )
}

export class EditorDateNode extends DecoratorNode<ReactNode> {
  __date: EditorDateValue

  static getType() {
    return "editor-date"
  }

  static clone(node: EditorDateNode) {
    return new EditorDateNode(node.__date, node.__key)
  }

  constructor(date: EditorDateValue, key?: NodeKey) {
    super(key)
    this.__date = parseEditorDate(date)
  }

  static importJSON(value: SerializedEditorDateNode) {
    const date = editorDateNodeSchema.parse(value).date

    return $createEditorDateNode(date)
  }

  exportJSON(): SerializedEditorDateNode {
    return {
      ...super.exportJSON(),
      type: "editor-date",
      version: 1,
      date: this.getDate(),
    }
  }

  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      if (!element.hasAttribute("data-editor-date")) return null

      const date = editorDateFromHTMLAttributes({
        "data-editor-date": element.getAttribute("data-editor-date"),
        datetime: element.getAttribute("datetime"),
      })

      return {
        priority: 4 as const,
        conversion(dom: HTMLElement) {
          validateEditorDateHTML(dom.parentElement ?? dom)

          if (dom.tagName !== "TIME")
            throw new Error("Invalid editor date element")

          return { node: $createEditorDateNode(date) }
        },
      }
    }

    return { time: convert }
  }

  getDate() {
    return this.getLatest().__date
  }

  setDate(value: EditorDateValue) {
    this.getWritable().__date = parseEditorDate(value)

    return this
  }

  isInline() {
    return true
  }

  isKeyboardSelectable() {
    return true
  }

  getTextContent() {
    return this.getDate()
  }

  createDOM() {
    const element = document.createElement("span")

    for (const [key, value] of Object.entries(
      editorDateHTMLAttributes(this.getDate()),
    ))
      element.setAttribute(key, value)
    element.contentEditable = "false"

    return element
  }

  updateDOM(previous: EditorDateNode) {
    return previous.__date !== this.__date
  }

  exportDOM() {
    const element = document.createElement("time")
    const date = this.getDate()

    for (const [key, value] of Object.entries(editorDateHTMLAttributes(date)))
      element.setAttribute(key, value)
    element.textContent = date

    return { element }
  }

  decorate() {
    return <EditorDateInline date={this.getDate()} nodeKey={this.getKey()} />
  }
}

export function $createEditorDateNode(value: EditorDateValue) {
  return $applyNodeReplacement(new EditorDateNode(parseEditorDate(value)))
}

export function $isEditorDateNode(
  node: LexicalNode | null | undefined,
): node is EditorDateNode {
  return node instanceof EditorDateNode
}
