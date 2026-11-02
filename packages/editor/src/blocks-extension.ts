import type { ElementNode, LexicalNode } from "lexical"

import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  HISTORY_PUSH_TAG,
  HISTORIC_TAG,
  SKIP_DOM_SELECTION_TAG,
  isHTMLElement,
  mergeRegister,
} from "lexical"

import type { EditorCalloutAppearance } from "./blocks-model"

import {
  $shouldCopyToggleStructure,
  $canReplaceEditorBlock,
  $createCalloutNode,
  $createToggleNode,
  $findEditorBlock,
  $isInToggleBody,
  $unwrapEditorBlock,
  CalloutNode,
  ToggleNode,
  ToggleSummaryNode,
  ToggleBodyNode,
  isEditorCalloutIcon,
  isEditorCalloutAppearance,
  validateEditorBlocksHTML,
  validateEditorBlocksJSON,
} from "./blocks-model"

export const INSERT_EDITOR_CALLOUT_COMMAND = createCommand<void>(
  "INSERT_EDITOR_CALLOUT",
)

export const INSERT_EDITOR_TOGGLE_COMMAND = createCommand<void>(
  "INSERT_EDITOR_TOGGLE",
)

export const UPDATE_EDITOR_CALLOUT_COMMAND = createCommand<{
  appearance?: EditorCalloutAppearance
  icon?: string
}>("UPDATE_EDITOR_CALLOUT")

export const CONVERT_EDITOR_BLOCK_COMMAND = createCommand<"callout" | "toggle">(
  "CONVERT_EDITOR_BLOCK",
)

export const REMOVE_EDITOR_BLOCK_COMMAND = createCommand<void>(
  "REMOVE_EDITOR_BLOCK",
)

export const TOGGLE_EDITOR_DISCLOSURE_COMMAND = createCommand<void>(
  "TOGGLE_EDITOR_DISCLOSURE",
)

import { z } from "zod"

import { createEditorBlockPresentationHTMLConfig } from "./block-presentation-extension"
import { EditorCalloutClipboardExtension } from "./blocks-clipboard"

export const EDITOR_BLOCKS_ERROR_COMMAND = createCommand<string>(
  "EDITOR_BLOCKS_ERROR",
)

const clipboardSchema = z.object({ nodes: z.array(z.unknown()).max(10000) })

const styles = stylex.create({
  callout: {
    borderInlineStartWidth: 3,
    borderInlineStartStyle: "solid",
    borderRadius: tokens["--radius-md"],
    padding: `calc(${tokens["--spacing"]} * 4)`,
    display: "flex",
    gap: `calc(${tokens["--spacing"]} * 3)`,
    marginBlock: `calc(${tokens["--spacing"]} * 3)`,
    backgroundColor: tokens["--muted"],
    color: tokens["--foreground"],
  },
  calloutContent: {
    flexGrow: 1,
    minInlineSize: 0,
  },
  neutral: { borderInlineStartColor: tokens["--border"] },
  info: { borderInlineStartColor: tokens["--info"] },
  success: { borderInlineStartColor: tokens["--success"] },
  warning: { borderInlineStartColor: tokens["--warning"] },
  destructive: { borderInlineStartColor: tokens["--destructive"] },
  toggle: {
    display: "grid",
    gridTemplateColumns: "2.75rem minmax(0, 1fr)",
    alignItems: "start",
    borderRadius: tokens["--radius-md"],
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: tokens["--border"],
    padding: `calc(${tokens["--spacing"]} * 3)`,
    marginBlock: `calc(${tokens["--spacing"]} * 3)`,
  },
  title: {
    gridColumn: "2",
    gridRow: "1",
    minInlineSize: 0,
    paddingBlock: `calc(${tokens["--spacing"]} * 3)`,
  },
  disclosure: {
    display: "contents",
    gridColumn: { default: null, "::details-content": "1 / -1" },
    gridRow: { default: null, "::details-content": "2" },
  },
  summary: {
    boxSizing: "border-box",
    gridColumn: "1",
    gridRow: "1",
    minInlineSize: "2.75rem",
    listStylePosition: "inside",
    paddingBlock: `calc(${tokens["--spacing"]} * 3)`,
    cursor: "pointer",
    minBlockSize: "2.75rem",
    outlineColor: tokens["--ring"],
    borderRadius: tokens["--radius-sm"],
  },
  body: {
    gridColumn: "1 / -1",
    gridRow: "2",
    minInlineSize: 0,
    paddingInlineStart: `calc(${tokens["--spacing"]} * 4)`,
    paddingBlock: `calc(${tokens["--spacing"]} * 2)`,
  },
})

export const EditorBlocksExtension = defineExtension({
  name: "@yopem-ui/editor/blocks",
  dependencies: [EditorCalloutClipboardExtension],
  nodes: [CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode],
  init(editorConfig) {
    const previousExclude = editorConfig.dom?.$shouldExclude
    editorConfig.dom = {
      ...editorConfig.dom,
      $shouldExclude(node, selection, editor) {
        if (
          node instanceof ToggleNode ||
          node instanceof ToggleSummaryNode ||
          node instanceof ToggleBodyNode
        )
          return (
            (previousExclude?.(node, selection, editor) ?? false) ||
            !$shouldCopyToggleStructure(node, selection)
          )

        return previousExclude
          ? previousExclude(node, selection, editor)
          : $isElementNode(node) && node.excludeFromCopy("html")
      },
    }
    editorConfig.html = createEditorBlockPresentationHTMLConfig(
      [CalloutNode, ToggleNode, ToggleSummaryNode, ToggleBodyNode],
      editorConfig.html,
    )
  },
  register(editor) {
    const localDisclosure = new Map<string, boolean>()
    const ownedClasses = new WeakMap<HTMLElement, string[]>()

    function applyClasses(element: HTMLElement, className = "") {
      const previous = ownedClasses.get(element) ?? []
      element.classList.remove(...previous)
      const current = className.split(" ").filter(Boolean)
      element.classList.add(...current)
      ownedClasses.set(element, current)
    }

    function selectedBlock() {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) {
        const nodes = selection?.getNodes() ?? []
        const block = $findEditorBlock(nodes[0] ?? null)

        return block && nodes.every((node) => $findEditorBlock(node)?.is(block))
          ? block
          : null
      }

      const block = $findEditorBlock(selection.anchor.getNode())

      return block && $findEditorBlock(selection.focus.getNode())?.is(block)
        ? block
        : null
    }

    function disclose(node: ToggleNode, open: boolean) {
      if (!open) {
        const selection = $getSelection()

        if (
          selection &&
          (selection.getNodes().some((child) => $isInToggleBody(child, node)) ||
            ($isRangeSelection(selection) &&
              [selection.anchor, selection.focus].some((point) =>
                $isInToggleBody(point.getNode(), node),
              )))
        )
          node.getSummary().selectEnd()
      }

      node.setOpen(open)
    }

    function insert(kind: "callout" | "toggle") {
      if (!editor.isEditable()) return false
      const selection = $getSelection()

      if (!$isRangeSelection(selection) || !selection.isCollapsed())
        return false
      const anchor = selection.anchor.getNode()
      let block = $isElementNode(anchor) ? anchor : anchor.getParent()

      if (!block || block instanceof ToggleSummaryNode) return false

      while (
        block.getParent() &&
        block.getParent()?.getType() !== "root" &&
        !(block.getParent() instanceof ToggleBodyNode) &&
        !(block.getParent() instanceof CalloutNode)
      )
        block = block.getParentOrThrow()

      if (
        block.getType() === "root" ||
        block instanceof ToggleNode ||
        block instanceof ToggleBodyNode
      )
        return false

      const node =
        kind === "callout"
          ? $createCalloutNode().append($createParagraphNode())
          : $createToggleNode()

      block.insertAfter(node)

      if (node instanceof ToggleNode) {
        node.getBody().append($createParagraphNode())
        node.getSummary().selectEnd()
      } else node.selectStart()

      return true
    }

    function updateDisclosure(element: HTMLElement) {
      const key = editor.read(() => {
        const node = $getNearestNodeFromDOMNode(element)
        const toggle = node instanceof ToggleBodyNode ? node.getParent() : null

        return toggle instanceof ToggleNode ? toggle.getKey() : null
      })

      if (!key) return
      const open = !element.hasAttribute("open")

      if (!editor.isEditable()) {
        localDisclosure.set(key, open)
        const selection = element.ownerDocument.getSelection()
        const content = element.lastElementChild

        if (
          !open &&
          content &&
          selection &&
          [selection.anchorNode, selection.focusNode].some(
            (node) => node && content.contains(node),
          )
        ) {
          if (isHTMLElement(element.firstElementChild))
            element.firstElementChild.focus()
          selection.removeAllRanges()
        }

        element.toggleAttribute("open", open)

        return
      }

      editor.update(
        () => {
          const node = $getNodeByKey(key)

          if (node instanceof ToggleNode && node.isAttached())
            disclose(node, open)
        },
        { tag: [HISTORY_PUSH_TAG, SKIP_DOM_SELECTION_TAG] },
      )
    }

    function click(event: MouseEvent) {
      if (event.defaultPrevented || !isHTMLElement(event.target)) return

      if (event.target.closest("a[href], button, input, select, textarea"))
        return
      const control = event.target.closest("[data-editor-toggle-control]")
      const title = event.target.closest("[data-editor-toggle-summary]")

      const details =
        control?.parentElement ??
        (!editor.isEditable() ? title?.parentElement?.lastElementChild : null)

      if (
        !isHTMLElement(details) ||
        details.tagName !== "DETAILS" ||
        !details.hasAttribute("data-editor-toggle-body")
      )
        return
      event.preventDefault()
      updateDisclosure(details)
    }

    function keydown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        !isHTMLElement(event.target) ||
        !event.target.hasAttribute("data-editor-toggle-control") ||
        (event.key !== "Enter" && event.key !== " ")
      )
        return
      const details = event.target.parentElement

      if (
        !isHTMLElement(details) ||
        details.tagName !== "DETAILS" ||
        !details.hasAttribute("data-editor-toggle-body")
      )
        return
      event.preventDefault()
      event.stopPropagation()
      updateDisclosure(details)
    }

    function paintNode(node: LexicalNode) {
      const element = editor.getElementByKey(node.getKey())

      if (!element) return

      if (node instanceof CalloutNode) {
        applyClasses(
          element,
          stylex.props(styles.callout, styles[node.getAppearance()]).className,
        )
        const content = element.lastElementChild

        if (isHTMLElement(content))
          applyClasses(content, stylex.props(styles.calloutContent).className)
      }

      if (node instanceof ToggleNode) {
        applyClasses(element, stylex.props(styles.toggle).className)
        const body = editor.getElementByKey(node.getBody().getKey())

        if (body?.tagName === "DETAILS") {
          const open = localDisclosure.get(node.getKey()) ?? node.getOpen()

          if (body.hasAttribute("open") !== open)
            body.toggleAttribute("open", open)
          body.firstElementChild?.setAttribute(
            "aria-label",
            node.getSummary().getTextContent().trim() || "Toggle content",
          )
        }
      }

      if (node instanceof ToggleSummaryNode)
        applyClasses(element, stylex.props(styles.title).className)

      if (node instanceof ToggleBodyNode) {
        applyClasses(element, stylex.props(styles.disclosure).className)

        if (isHTMLElement(element.firstElementChild))
          applyClasses(
            element.firstElementChild,
            stylex.props(styles.summary).className,
          )

        if (isHTMLElement(element.lastElementChild))
          applyClasses(
            element.lastElementChild,
            stylex.props(styles.body).className,
          )
      }
    }

    function paintTree(node: ElementNode = $getRoot()) {
      paintNode(node)

      for (const child of node.getChildren())
        if ($isElementNode(child)) paintTree(child)
    }

    return mergeRegister(
      () => localDisclosure.clear(),
      editor.registerEditableListener(() => {
        localDisclosure.clear()
        editor.getEditorState().read(() => paintTree())
      }),
      editor.registerNodeTransform(ToggleNode, (node) => {
        const children = node.getChildren()

        const summary =
          children.find((child) => child instanceof ToggleSummaryNode) ??
          $applyNodeReplacement(new ToggleSummaryNode())

        const body =
          children.find((child) => child instanceof ToggleBodyNode) ??
          $applyNodeReplacement(new ToggleBodyNode())

        if (!node.getFirstChild()?.is(summary)) node.splice(0, 0, [summary])

        if (!node.getLastChild()?.is(body)) node.append(body)

        for (const child of node.getChildren()) {
          if (child.is(summary) || child.is(body)) continue

          if (child instanceof ToggleSummaryNode) {
            body.append(
              $createParagraphNode()
                .updateFromJSON(child.exportJSON())
                .append(...child.getChildren()),
            )
            child.remove()
          } else if (child instanceof ToggleBodyNode) {
            body.append(...child.getChildren())
            child.remove()
          } else if ($isElementNode(child) && !child.isInline())
            body.append(child)
          else body.append($createParagraphNode().append(child))
        }
      }),
      editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (event.defaultPrevented) return false

          if (!("clipboardData" in event) || !event.clipboardData) return false

          try {
            const html = event.clipboardData.getData("text/html")

            const json = event.clipboardData.getData(
              "application/x-lexical-editor",
            )

            if (html.length > 1048576 || json.length > 1048576)
              throw new Error("Clipboard content is too large")

            if (json) {
              const value = clipboardSchema.parse(JSON.parse(json))
              validateEditorBlocksJSON({
                root: { type: "root", children: value.nodes },
              })
            }

            if (html) {
              const view = editor.getRootElement()?.ownerDocument.defaultView

              if (!view) return false
              validateEditorBlocksHTML(
                new view.DOMParser().parseFromString(html, "text/html"),
              )
            }
          } catch {
            event.preventDefault()
            editor.dispatchCommand(
              EDITOR_BLOCKS_ERROR_COMMAND,
              "Cannot paste unsupported block content.",
            )

            return true
          }

          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
      editor.registerCommand(
        INSERT_EDITOR_CALLOUT_COMMAND,
        () => insert("callout"),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        INSERT_EDITOR_TOGGLE_COMMAND,
        () => insert("toggle"),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        UPDATE_EDITOR_CALLOUT_COMMAND,
        (value) => {
          if (!editor.isEditable()) return false

          if (
            (value.appearance !== undefined &&
              !isEditorCalloutAppearance(value.appearance)) ||
            (value.icon !== undefined && !isEditorCalloutIcon(value.icon))
          )
            return false
          const node = selectedBlock()

          if (!(node instanceof CalloutNode)) return false

          if (value.appearance !== undefined)
            node.setAppearance(value.appearance)

          if (value.icon !== undefined) node.setIcon(value.icon)

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CONVERT_EDITOR_BLOCK_COMMAND,
        (kind) => {
          if (!editor.isEditable() || (kind !== "callout" && kind !== "toggle"))
            return false
          const node = selectedBlock()

          if (
            !node ||
            (kind === "callout" && node instanceof CalloutNode) ||
            (kind === "toggle" && node instanceof ToggleNode)
          )
            return false

          if (!$canReplaceEditorBlock(node)) return false

          if (node instanceof CalloutNode) {
            const next = $createToggleNode().updateFromJSON(node.exportJSON())
            next.getBody().append(...node.getChildren())
            node.replace(next)
            next.getSummary().selectEnd()
          } else {
            const next = $createCalloutNode().updateFromJSON(node.exportJSON())
            const summary = node.getSummary()
            next.append(
              $createParagraphNode()
                .updateFromJSON(summary.exportJSON())
                .append(...summary.getChildren()),
              ...node.getBody().getChildren(),
            )
            node.replace(next)
            next.selectStart()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        REMOVE_EDITOR_BLOCK_COMMAND,
        () => {
          if (!editor.isEditable()) return false
          const node = selectedBlock()

          return node ? $unwrapEditorBlock(node) : false
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        TOGGLE_EDITOR_DISCLOSURE_COMMAND,
        () => {
          if (!editor.isEditable()) return false
          const node = selectedBlock()

          if (!(node instanceof ToggleNode)) return false
          disclose(node, !node.getOpen())

          return true
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerRootListener((root, previous) => {
        previous?.removeEventListener("click", click)
        previous?.removeEventListener("keydown", keydown, true)
        root?.addEventListener("click", click)
        root?.addEventListener("keydown", keydown, true)

        localDisclosure.clear()

        if (root) editor.getEditorState().read(() => paintTree())
      }),
      editor.registerUpdateListener(
        ({
          editorState,
          prevEditorState,
          dirtyElements,
          dirtyLeaves,
          tags,
        }) => {
          const changed =
            dirtyLeaves.size > 0 ||
            Array.from(dirtyElements).some(
              ([key, intentional]) => key !== "root" && intentional,
            ) ||
            editorState.read(() => $getRoot()) !==
              prevEditorState.read(() => $getRoot())

          const resetKeys = changed ? Array.from(localDisclosure.keys()) : []

          if (changed) localDisclosure.clear()
          editorState.read(() => {
            if (
              tags.has(HISTORIC_TAG) ||
              (dirtyElements.size === 1 && dirtyElements.has("root"))
            ) {
              paintTree()

              return
            }

            const keys = new Set([...dirtyElements.keys(), ...dirtyLeaves])

            for (const key of keys) {
              const node = $getNodeByKey(key)

              if (!node) continue
              paintNode(node)

              for (const parent of node.getParents())
                if (parent instanceof ToggleNode) paintNode(parent)
            }

            if (changed)
              for (const key of resetKeys) {
                const node = $getNodeByKey(key)

                if (node) paintNode(node)
              }
          })
        },
      ),
    )
  },
})
