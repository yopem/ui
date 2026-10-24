import type {
  BaseSelection,
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
  Spread,
} from "lexical"

import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  $isBlockFullySelected,
  $setDirectionFromDOM,
  $setFormatFromDOM,
  setNodeIndentFromDOM,
  ElementNode,
  isHTMLElement,
  setDOMUnmanaged,
} from "lexical"
import { z } from "zod"

export const editorCalloutAppearances = [
  "neutral",
  "info",
  "success",
  "warning",
  "destructive",
] as const

export type EditorCalloutAppearance = (typeof editorCalloutAppearances)[number]

export type SerializedCalloutNode = Spread<
  {
    type: "editor-callout"
    version: 1
    appearance: EditorCalloutAppearance
    icon: string
  },
  SerializedElementNode
>

export type SerializedToggleNode = Spread<
  { type: "editor-toggle"; version: 1; open: boolean },
  SerializedElementNode
>

const appearanceSchema = z.enum(editorCalloutAppearances)

const iconSchema = z
  .string()
  .max(32)
  .refine(
    (value) =>
      !/[\uD800-\uDFFF]/u.test(value) &&
      !/[<>\p{Cc}\p{Cf}]/u.test(value.replaceAll("\u200d", "")),
  )

const nodeSchema = z.object({
  type: z.string(),
  children: z.array(z.unknown()).max(10000).optional(),
})

const documentSchema = z.object({ root: z.unknown() })

const elementSchema = z.strictObject({
  type: z.string(),
  version: z.literal(1),
  children: z.array(z.unknown()).max(10000),
  direction: z.enum(["ltr", "rtl"]).nullable(),
  format: z.enum(["", "left", "start", "center", "right", "end", "justify"]),
  indent: z.number().int().min(0).max(100),
  textFormat: z.number().int().min(0).max(65535).optional(),
  textStyle: z.string().max(1048576).optional(),
  $: z.record(z.string(), z.json()).optional(),
})

const calloutSchema = elementSchema.extend({
  type: z.literal("editor-callout"),
  appearance: appearanceSchema,
  icon: iconSchema,
})

const toggleSchema = elementSchema.extend({
  type: z.literal("editor-toggle"),
  open: z.boolean(),
  children: z.tuple([
    z.object({ type: z.literal("editor-toggle-summary") }),
    z.object({ type: z.literal("editor-toggle-body") }),
  ]),
})

const partSchema = elementSchema.extend({
  type: z.enum(["editor-toggle-summary", "editor-toggle-body"]),
})

export function isEditorCalloutAppearance(
  value: string | null,
): value is EditorCalloutAppearance {
  return appearanceSchema.safeParse(value).success
}

export function isEditorCalloutIcon(value: string | null): value is string {
  return iconSchema.safeParse(value).success
}

export function validateEditorBlocksJSON(
  value: z.input<typeof documentSchema>,
) {
  let count = 0

  function visit(
    input: Parameters<typeof nodeSchema.parse>[0],
    depth: number,
    parent?: string,
    summary = false,
  ) {
    if (depth > 64 || ++count > 10000)
      throw new Error("Invalid editor block document")
    const node = nodeSchema.parse(input)

    if (
      summary &&
      !["text", "tab", "linebreak", "link", "autolink", "mark"].includes(
        node.type,
      )
    )
      throw new Error("Unsupported summary content")

    if (node.type === "editor-callout") calloutSchema.parse(input)

    if (node.type === "editor-toggle") toggleSchema.parse(input)

    if (
      node.type === "editor-toggle-summary" ||
      node.type === "editor-toggle-body"
    ) {
      partSchema.parse(input)

      if (parent !== "editor-toggle") throw new Error("Orphan toggle part")
    } else if (
      node.type.startsWith("editor-toggle-") ||
      node.type.startsWith("editor-callout-")
    )
      throw new Error("Unsupported editor block")

    for (const child of node.children ?? [])
      visit(
        child,
        depth + 1,
        node.type,
        summary || node.type === "editor-toggle-summary",
      )
  }

  visit(documentSchema.parse(value).root, 0)

  if (JSON.stringify(value).length > 1048576)
    throw new Error("Editor block document is too large")
}

const summaryHTMLTags = new Set([
  "SPAN",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "DEL",
  "CODE",
  "A",
  "BR",
  "MARK",
  "SUB",
  "SUP",
])

export function validateEditorBlocksHTML(root: ParentNode & Node) {
  if (
    (root.querySelector("html")?.textContent?.length ??
      root.textContent?.length ??
      0) > 1048576
  )
    throw new Error("Editor HTML is too large")

  if (root.querySelectorAll("*").length > 10000)
    throw new Error("Editor HTML is too large")

  const elements = Array.from(root.querySelectorAll("*"))

  if (isHTMLElement(root)) elements.unshift(root)

  for (const element of elements) {
    let depth = 0

    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    )
      if (++depth > 64) throw new Error("Editor HTML is too deep")

    if (
      element.hasAttribute("data-editor-callout") &&
      (element.tagName !== "ASIDE" ||
        !isEditorCalloutAppearance(element.getAttribute("data-appearance")) ||
        !isEditorCalloutIcon(element.getAttribute("data-icon")))
    )
      throw new Error("Invalid callout HTML")

    const parent = element.parentElement

    const legacy =
      parent?.tagName === "DETAILS" && parent.hasAttribute("data-editor-toggle")

    const title =
      element.hasAttribute("data-editor-toggle-summary") ||
      (element.tagName === "SUMMARY" && legacy)

    if (
      title &&
      Array.from(element.querySelectorAll("*")).some(
        (child) => !summaryHTMLTags.has(child.tagName),
      )
    )
      throw new Error("Unsupported summary HTML")

    if (element.hasAttribute("data-editor-toggle")) {
      const children = element.children
      const canonical = element.tagName === "SECTION"

      if (
        Array.from(element.childNodes).some(
          (child) => child.nodeType === 3 && child.textContent?.trim(),
        ) ||
        children.length !== 2 ||
        (canonical
          ? children[0]?.tagName !== "DIV" ||
            !children[0].hasAttribute("data-editor-toggle-summary") ||
            children[1]?.tagName !== "DETAILS"
          : element.tagName !== "DETAILS" ||
            children[0]?.tagName !== "SUMMARY" ||
            children[1]?.tagName !== "DIV") ||
        !children[1]?.hasAttribute("data-editor-toggle-body")
      )
        throw new Error("Invalid toggle HTML")
    }

    if (
      element.hasAttribute("data-editor-toggle-summary") &&
      (element.tagName !== "DIV" ||
        parent?.tagName !== "SECTION" ||
        !parent.hasAttribute("data-editor-toggle") ||
        parent.firstElementChild !== element)
    )
      throw new Error("Orphan toggle title HTML")

    if (element.hasAttribute("data-editor-toggle-body")) {
      if (
        !parent?.hasAttribute("data-editor-toggle") ||
        parent.lastElementChild !== element
      )
        throw new Error("Orphan toggle HTML")

      if (parent.tagName === "SECTION") {
        if (
          element.tagName !== "DETAILS" ||
          element.children.length !== 2 ||
          element.children[0]?.tagName !== "SUMMARY" ||
          !element.children[0].hasAttribute("data-editor-toggle-control") ||
          element.children[1]?.tagName !== "DIV" ||
          !element.children[1].hasAttribute("data-editor-toggle-content") ||
          Array.from(element.childNodes).some(
            (child) => child.nodeType === 3 && child.textContent?.trim(),
          )
        )
          throw new Error("Invalid toggle body HTML")
      }
    }

    if (
      element.hasAttribute("data-editor-toggle-control") &&
      (element.tagName !== "SUMMARY" ||
        parent?.tagName !== "DETAILS" ||
        !parent.hasAttribute("data-editor-toggle-body") ||
        parent.firstElementChild !== element ||
        element.childNodes.length !== 0)
    )
      throw new Error("Invalid toggle control HTML")

    if (
      element.hasAttribute("data-editor-toggle-content") &&
      (element.tagName !== "DIV" ||
        parent?.tagName !== "DETAILS" ||
        !parent.hasAttribute("data-editor-toggle-body") ||
        parent.lastElementChild !== element)
    )
      throw new Error("Orphan toggle content HTML")
  }
}

export class CalloutNode extends ElementNode {
  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    return (
      $isRangeSelection(selection) && $isBlockFullySelected(this, selection)
    )
  }

  isShadowRoot() {
    return true
  }

  __appearance: EditorCalloutAppearance
  __icon: string
  static getType() {
    return "editor-callout"
  }
  static clone(node: CalloutNode) {
    return new CalloutNode(node.__appearance, node.__icon, node.__key)
  }
  constructor(
    appearance: EditorCalloutAppearance = "info",
    icon = "💡",
    key?: NodeKey,
  ) {
    super(key)

    if (!isEditorCalloutAppearance(appearance) || !isEditorCalloutIcon(icon))
      throw new Error("Invalid callout metadata")
    this.__appearance = appearance
    this.__icon = icon
  }
  getAppearance() {
    return this.getLatest().__appearance
  }
  getIcon() {
    return this.getLatest().__icon
  }
  setAppearance(value: EditorCalloutAppearance) {
    if (!isEditorCalloutAppearance(value))
      throw new Error("Invalid callout appearance")
    this.getWritable().__appearance = value

    return this
  }
  setIcon(value: string) {
    if (!isEditorCalloutIcon(value)) throw new Error("Invalid callout icon")
    this.getWritable().__icon = value

    return this
  }
  createDOM() {
    const element = document.createElement("aside")
    element.setAttribute("data-editor-callout", "")
    element.setAttribute("data-appearance", this.getAppearance())
    element.setAttribute("data-icon", this.getIcon())
    const icon = document.createElement("span")
    setDOMUnmanaged(icon)
    icon.contentEditable = "false"
    icon.setAttribute("aria-hidden", "true")
    icon.textContent = this.getIcon()
    element.append(icon, document.createElement("div"))

    return element
  }
  getDOMSlot(element: HTMLElement) {
    const content = element.lastElementChild

    if (!(content instanceof HTMLElement))
      throw new Error("Missing callout slot")

    return super.getDOMSlot(element).withElement(content)
  }
  updateDOM(previous: CalloutNode, element: HTMLElement) {
    if (previous.__appearance !== this.__appearance)
      element.setAttribute("data-appearance", this.__appearance)

    if (previous.__icon !== this.__icon) {
      element.setAttribute("data-icon", this.__icon)

      if (element.firstElementChild)
        element.firstElementChild.textContent = this.__icon
    }

    return false
  }
  exportJSON(): SerializedCalloutNode {
    return {
      ...super.exportJSON(),
      type: "editor-callout",
      version: 1,
      appearance: this.getAppearance(),
      icon: this.getIcon(),
    }
  }
  static importJSON(value: SerializedCalloutNode) {
    validateEditorBlocksJSON({ root: value })

    return $createCalloutNode(value.appearance, value.icon).updateFromJSON(
      value,
    )
  }
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (output.element && "replaceChildren" in output.element)
      output.element.replaceChildren()

    if (output.element && "style" in output.element)
      output.element.style.textAlign = this.getFormatType()

    return output
  }

  static importDOM(): DOMConversionMap {
    return {
      aside: (element) =>
        element.hasAttribute("data-editor-callout")
          ? {
              priority: 2,
              conversion(dom) {
                validateEditorBlocksHTML(dom.parentElement ?? dom)
                const appearance = dom.getAttribute("data-appearance")
                const icon = dom.getAttribute("data-icon")

                if (
                  !isEditorCalloutAppearance(appearance) ||
                  !isEditorCalloutIcon(icon)
                )
                  throw new Error("Invalid callout HTML")

                return {
                  node: importBlockElement(
                    $createCalloutNode(appearance, icon),
                    dom,
                  ),
                }
              },
            }
          : null,
    }
  }
}

export class ToggleNode extends ElementNode {
  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    return $shouldCopyToggleStructure(this, selection)
  }

  __open: boolean
  excludeFromCopy(destination?: "clone" | "html") {
    return (
      destination === "clone" &&
      !$shouldCopyToggleStructure(this, $getSelection())
    )
  }

  static getType() {
    return "editor-toggle"
  }
  static clone(node: ToggleNode) {
    return new ToggleNode(node.__open, node.__key)
  }
  constructor(open = true, key?: NodeKey) {
    super(key)
    z.boolean().parse(open)
    this.__open = open
  }
  getOpen() {
    return this.getLatest().__open
  }
  setOpen(value: boolean) {
    z.boolean().parse(value)
    this.getWritable().__open = value

    return this
  }
  getSummary() {
    const node = this.getFirstChild()

    if (!(node instanceof ToggleSummaryNode))
      throw new Error("Missing toggle summary")

    return node
  }
  getBody() {
    const node = this.getLastChild()

    if (!(node instanceof ToggleBodyNode))
      throw new Error("Missing toggle body")

    return node
  }
  createDOM() {
    const element = document.createElement("section")
    element.setAttribute("data-editor-toggle", "")

    return element
  }
  updateDOM() {
    return false
  }
  exportJSON(): SerializedToggleNode {
    return {
      ...super.exportJSON(),
      type: "editor-toggle",
      version: 1,
      open: this.getOpen(),
    }
  }
  static importJSON(value: SerializedToggleNode) {
    validateEditorBlocksJSON({ root: value })

    return $applyNodeReplacement(new ToggleNode(value.open)).updateFromJSON(
      value,
    )
  }
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (output.element && "style" in output.element)
      output.element.style.textAlign = this.getFormatType()

    return output
  }
  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      return element.hasAttribute("data-editor-toggle")
        ? {
            priority: 2 as const,
            conversion(dom: HTMLElement) {
              validateEditorBlocksHTML(dom.parentElement ?? dom)

              const disclosure =
                dom.tagName === "DETAILS" ? dom : dom.lastElementChild

              return {
                node: importBlockElement(
                  $applyNodeReplacement(
                    new ToggleNode(disclosure?.hasAttribute("open") ?? false),
                  ),
                  dom,
                ),
              }
            },
          }
        : null
    }

    return { details: convert, section: convert }
  }
}

export class ToggleSummaryNode extends ElementNode {
  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    return $shouldCopyToggleStructure(this, selection)
  }

  excludeFromCopy(destination?: "clone" | "html") {
    return (
      destination === "clone" &&
      !$shouldCopyToggleStructure(this, $getSelection())
    )
  }

  static getType() {
    return "editor-toggle-summary"
  }
  static clone(node: ToggleSummaryNode) {
    return new ToggleSummaryNode(node.__key)
  }
  createDOM() {
    const element = document.createElement("div")
    element.setAttribute("data-editor-toggle-summary", "")

    return element
  }
  updateDOM() {
    return false
  }
  static importJSON(value: SerializedElementNode) {
    partSchema.parse(value)

    return $applyNodeReplacement(new ToggleSummaryNode()).updateFromJSON(value)
  }
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (output.element && "replaceChildren" in output.element)
      output.element.replaceChildren()

    if (output.element && "style" in output.element)
      output.element.style.textAlign = this.getFormatType()

    return output
  }
  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      return element.parentElement?.hasAttribute("data-editor-toggle") &&
        (element.tagName === "SUMMARY" ||
          element.hasAttribute("data-editor-toggle-summary"))
        ? {
            priority: 2 as const,
            conversion: (dom: HTMLElement) => ({
              node: importBlockElement(
                $applyNodeReplacement(new ToggleSummaryNode()),
                dom,
              ),
            }),
          }
        : null
    }

    return { summary: convert, div: convert }
  }
  insertNewAfter(_selection: RangeSelection) {
    const parent = this.getParent()

    if (!(parent instanceof ToggleNode)) return null
    parent.setOpen(true)
    const body = parent.getBody()

    if (body.isEmpty()) body.append($createParagraphNode())
    body.selectStart()

    return null
  }
}

export class ToggleBodyNode extends ElementNode {
  extractWithChild(
    _child: LexicalNode,
    selection: BaseSelection | null,
    _destination: "clone" | "html",
  ) {
    return $shouldCopyToggleStructure(this, selection)
  }

  isShadowRoot() {
    return true
  }

  excludeFromCopy(destination?: "clone" | "html") {
    return (
      destination === "clone" &&
      !$shouldCopyToggleStructure(this, $getSelection())
    )
  }

  static getType() {
    return "editor-toggle-body"
  }
  static clone(node: ToggleBodyNode) {
    return new ToggleBodyNode(node.__key)
  }
  createDOM() {
    const element = document.createElement("details")
    element.setAttribute("data-editor-toggle-body", "")
    const toggle = this.getParent()
    element.open = toggle instanceof ToggleNode ? toggle.getOpen() : true
    const control = document.createElement("summary")
    control.setAttribute("data-editor-toggle-control", "")
    control.setAttribute(
      "aria-label",
      toggle instanceof ToggleNode
        ? toggle.getSummary().getTextContent().trim() || "Toggle content"
        : "Toggle content",
    )
    control.contentEditable = "false"
    setDOMUnmanaged(control)
    const content = document.createElement("div")
    content.setAttribute("data-editor-toggle-content", "")
    element.append(control, content)

    return element
  }
  getDOMSlot(element: HTMLElement) {
    const content = element.lastElementChild

    if (!isHTMLElement(content)) throw new Error("Missing toggle body slot")

    return super.getDOMSlot(element).withElement(content)
  }
  updateDOM() {
    return false
  }
  static importJSON(value: SerializedElementNode) {
    partSchema.parse(value)

    return $applyNodeReplacement(new ToggleBodyNode()).updateFromJSON(value)
  }
  static importDOM(): DOMConversionMap {
    function convert(element: HTMLElement) {
      return element.hasAttribute("data-editor-toggle-body") &&
        element.parentElement?.hasAttribute("data-editor-toggle")
        ? {
            priority: 2 as const,
            conversion: (dom: HTMLElement) => ({
              node: importBlockElement(
                $applyNodeReplacement(new ToggleBodyNode()),
                dom,
              ),
            }),
          }
        : null
    }

    return {
      div: convert,
      details: convert,
      summary: (element) =>
        element.hasAttribute("data-editor-toggle-control")
          ? {
              priority: 2,
              conversion: () => ({ node: null, forChild: () => null }),
            }
          : null,
    }
  }
  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const output = super.exportDOM(editor)

    if (isHTMLElement(output.element)) {
      output.element.replaceChildren()
      output.element.style.textAlign = this.getFormatType()
    }

    const previousAfter = output.after
    const toggle = this.getParent()

    const title =
      toggle instanceof ToggleNode
        ? toggle.getSummary().getTextContent().trim() || "Toggle content"
        : "Toggle content"

    return {
      ...output,
      after(element) {
        const result = previousAfter ? previousAfter(element) : element

        if (isHTMLElement(result)) {
          const control = result.ownerDocument.createElement("summary")
          control.setAttribute("data-editor-toggle-control", "")
          control.setAttribute("contenteditable", "false")
          control.setAttribute("aria-label", title)
          const content = result.ownerDocument.createElement("div")
          content.setAttribute("data-editor-toggle-content", "")
          content.append(...result.childNodes)
          result.append(control, content)
        }

        return result
      },
    }
  }
}

export function $createCalloutNode(
  appearance: EditorCalloutAppearance = "info",
  icon = "💡",
) {
  return $applyNodeReplacement(new CalloutNode(appearance, icon))
}

export function $createToggleNode(open = true) {
  return $applyNodeReplacement(new ToggleNode(open)).append(
    $applyNodeReplacement(new ToggleSummaryNode()),
    $applyNodeReplacement(new ToggleBodyNode()),
  )
}

export function $findEditorBlock(
  node: LexicalNode | null,
): CalloutNode | ToggleNode | null {
  for (let current = node; current; current = current.getParent())
    if (current instanceof CalloutNode || current instanceof ToggleNode)
      return current

  return null
}

export function $unwrapEditorBlock(node: CalloutNode | ToggleNode) {
  const children =
    node instanceof ToggleNode
      ? [node.getSummary(), ...node.getBody().getChildren()]
      : node.getChildren()

  for (const child of children) {
    if (child instanceof ToggleSummaryNode) {
      const paragraph = $createParagraphNode()
        .updateFromJSON(child.exportJSON())
        .append(...child.getChildren())

      node.insertBefore(paragraph)
    } else node.insertBefore(child)
  }

  node.remove()
}

export function $isInToggleBody(node: LexicalNode, toggle: ToggleNode) {
  const body = toggle.getBody()

  return node.is(body) || body.isParentOf(node)
}

function importBlockElement<T extends ElementNode>(node: T, dom: HTMLElement) {
  setNodeIndentFromDOM(dom, node)

  return $setFormatFromDOM($setDirectionFromDOM(node, dom), dom)
}

export function $shouldCopyToggleStructure(
  node: ToggleNode | ToggleSummaryNode | ToggleBodyNode,
  selection: BaseSelection | null,
): boolean {
  if (!selection) return true
  const toggle = node instanceof ToggleNode ? node : node.getParent()

  if (!(toggle instanceof ToggleNode)) return false

  if ($isNodeSelection(selection))
    return [toggle, ...toggle.getParents()].some((parent) =>
      selection.has(parent.getKey()),
    )

  if ($isRangeSelection(selection))
    return $isBlockFullySelected(toggle, selection)

  return (
    toggle.isSelected(selection) &&
    toggle.getSummary().isSelected(selection) &&
    toggle.getBody().isSelected(selection)
  )
}
