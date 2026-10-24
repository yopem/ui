import type { LexicalEditor } from "lexical"

import { DOMRenderExtension, domOverride } from "@lexical/html"
import { $isListItemNode, $isListNode, ListItemNode } from "@lexical/list"
import {
  $addUpdateTag,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  $nodesOfType,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_LEFT_COMMAND,
  configExtension,
  defineExtension,
  mergeRegister,
  setDOMUnmanaged,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SELECTION_FOCUS_TAG,
} from "lexical"

function getControl(dom: HTMLElement) {
  const first = dom.firstChild

  return first instanceof HTMLInputElement &&
    first.dataset.slot === "editor-checklist-checkbox"
    ? first
    : null
}

function syncControl(
  node: ListItemNode,
  dom: HTMLElement,
  editor: LexicalEditor,
  controlClassName: string,
) {
  const checked = node.getChecked()
  let control = getControl(dom)

  dom.removeAttribute("role")
  dom.removeAttribute("aria-checked")
  dom.removeAttribute("tabindex")

  if (checked === undefined || $isListNode(node.getFirstChild())) {
    control?.remove()

    return
  }

  if (!control) {
    control = dom.ownerDocument.createElement("input")
    control.type = "checkbox"
    control.dataset.slot = "editor-checklist-checkbox"
    control.contentEditable = "false"

    if (controlClassName) control.classList.add(...controlClassName.split(" "))
    setDOMUnmanaged(control, { captureSelection: true })
    dom.prepend(control)
  }

  control.checked = checked
  control.disabled = !editor.isEditable()
  control.setAttribute("aria-checked", String(checked))
  control.setAttribute(
    "aria-label",
    node.getTextContent().trim() || "Checklist item",
  )
}

export function createChecklistAccessibilityExtension(
  controlClassName: string,
) {
  return defineExtension({
    name: "@yopem-ui/editor/checklist-accessibility",
    dependencies: [
      configExtension(DOMRenderExtension, {
        overrides: [
          domOverride([ListItemNode], {
            $createDOM(node, $next, editor) {
              const dom = $next()
              syncControl(node, dom, editor, controlClassName)

              return dom
            },
            $updateDOM(node, _previous, dom, $next, editor) {
              const replace = $next()

              if (!replace) syncControl(node, dom, editor, controlClassName)

              return replace
            },
            $getDOMSlot(_node, dom, $next) {
              const slot = $next()
              const control = getControl(dom)

              return control ? slot.withAfter(control) : slot
            },
            $decorateDOM(node, _previous, dom, editor) {
              syncControl(node, dom, editor, controlClassName)
            },
          }),
        ],
      }),
    ],
    register(editor) {
      let cleanupRoot: (() => void) | undefined

      return mergeRegister(
        editor.registerCommand(
          KEY_ARROW_LEFT_COMMAND,
          (event) => {
            const selection = $getSelection()

            if (
              !$isRangeSelection(selection) ||
              !selection.isCollapsed() ||
              selection.anchor.offset !== 0
            )
              return false
            const anchor = selection.anchor.getNode()

            const item = $isListItemNode(anchor)
              ? anchor
              : anchor.getParents().find($isListItemNode)

            if (
              !item ||
              (anchor !== item && item.getFirstDescendant() !== anchor)
            )
              return false
            const dom = editor.getElementByKey(item.getKey())
            const control = dom && getControl(dom)

            if (!control || control.disabled) return false
            event.preventDefault()
            control.focus({ preventScroll: true })

            return true
          },
          COMMAND_PRIORITY_HIGH,
        ),
        editor.registerEditableListener(() => {
          editor.getEditorState().read(() => {
            for (const node of $nodesOfType(ListItemNode)) {
              const dom = editor.getElementByKey(node.getKey())
              const control = dom && getControl(dom)

              if (control) control.disabled = !editor.isEditable()
            }
          })
        }),
        editor.registerRootListener((root) => {
          cleanupRoot?.()
          cleanupRoot = undefined

          if (!root) return

          function change(event: Event) {
            const target = event.target

            if (
              !(target instanceof HTMLInputElement) ||
              !target.parentElement ||
              getControl(target.parentElement) !== target
            )
              return
            const item = target.parentElement
            editor.update(() => {
              const node = $getNearestNodeFromDOMNode(item)

              if (!$isListItemNode(node)) return

              if (editor.isEditable()) {
                $addUpdateTag(SKIP_DOM_SELECTION_TAG)
                $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
                node.setChecked(target.checked)
              } else {
                target.checked = node.getChecked() === true
              }
            })
          }

          function keydown(event: KeyboardEvent) {
            const target = event.target

            if (
              !(target instanceof HTMLInputElement) ||
              !target.parentElement ||
              getControl(target.parentElement) !== target
            )
              return

            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.stopPropagation()

              const item = target.parentElement

              const list = editor.read("latest", () => {
                const node = $getNearestNodeFromDOMNode(item)

                const parent = $isListItemNode(node)
                  ? node.getParents().filter($isListNode).at(-1)
                  : null

                return parent ? editor.getElementByKey(parent.getKey()) : null
              })

              const controls = Array.from(
                list?.querySelectorAll<HTMLInputElement>(
                  'input[data-slot="editor-checklist-checkbox"]',
                ) ?? [],
              )

              const next =
                controls[
                  controls.indexOf(target) +
                    (event.key === "ArrowDown" ? 1 : -1)
                ]

              if (next?.parentElement) {
                event.preventDefault()
                const item = next.parentElement
                next.focus()
                editor.update(() => {
                  const node = $getNearestNodeFromDOMNode(item)

                  if ($isListItemNode(node)) {
                    $addUpdateTag(SKIP_DOM_SELECTION_TAG)
                    $addUpdateTag(SKIP_SELECTION_FOCUS_TAG)
                    node.selectStart()
                  }
                })
              }
            } else if (event.key === "Escape") {
              event.stopPropagation()
              event.preventDefault()
              root?.focus({ preventScroll: true })
              editor.focus()
            } else if (
              [
                " ",
                "Tab",
                "Alt",
                "Control",
                "Meta",
                "Shift",
                "CapsLock",
              ].includes(event.key)
            ) {
              event.stopPropagation()
            } else {
              root?.focus({ preventScroll: true })
              editor.focus()
            }
          }

          root.addEventListener("change", change)
          root.addEventListener("keydown", keydown, true)

          cleanupRoot = () => {
            root.removeEventListener("change", change)
            root.removeEventListener("keydown", keydown, true)
          }
        }),
        () => cleanupRoot?.(),
      )
    },
  })
}
