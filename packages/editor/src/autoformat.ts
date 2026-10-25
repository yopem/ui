import {
  $createHorizontalRuleNode,
  HorizontalRuleExtension,
  HorizontalRuleNode,
} from "@lexical/extension"
import {
  CHECK_LIST,
  registerMarkdownShortcuts,
  type ElementTransformer,
  type TextMatchTransformer,
  type Transformer,
} from "@lexical/markdown"
import { $createQuoteNode, QuoteNode } from "@lexical/rich-text"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $createParagraphNode,
  $getEditor,
  defineExtension,
  mergeRegister,
  PASTE_TAG,
  HISTORY_PUSH_TAG,
  type LexicalEditor,
  type EditorState,
  type TextNode,
} from "lexical"

const styles = stylex.create({
  rule: {
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: tokens["--border"],
    marginBlock: `calc(${tokens["--spacing"]} * 4)`,
  },
  selected: {
    outlineWidth: 2,
    outlineStyle: "solid",
    outlineColor: tokens["--ring"],
    outlineOffset: 2,
  },
})

const substitutions = [
  ["->", "→"],
  ["<-", "←"],
  ["=>", "⇒"],
  ["≤=", "⇐"],
  ["!>", "≯"],
  ["!<", "≮"],
  [">=", "≥"],
  ["<=", "≤"],
  ["!>=", "≱"],
  ["!<=", "≰"],
  ["≯=", "≱"],
  ["≮=", "≰"],
  ["!=", "≠"],
  ["==", "≡"],
  ["!==", "≢"],
  ["≠=", "≢"],
  ["~=", "≈"],
  ["!~=", "≉"],
  ["1/2", "½"],
  ["1/3", "⅓"],
  ["1/4", "¼"],
  ["1/5", "⅕"],
  ["1/6", "⅙"],
  ["1/7", "⅐"],
  ["1/8", "⅛"],
  ["1/9", "⅑"],
  ["1/10", "⅒"],
  ["2/3", "⅔"],
  ["2/5", "⅖"],
  ["3/4", "¾"],
  ["3/5", "⅗"],
  ["3/8", "⅜"],
  ["4/5", "⅘"],
  ["5/6", "⅚"],
  ["5/8", "⅝"],
  ["7/8", "⅞"],
  ["(tm)", "™"],
  ["(TM)", "™"],
  ["(r)", "®"],
  ["(R)", "®"],
  ["(c)", "©"],
  ["(C)", "©"],
  ["&trade;", "™"],
  ["&reg;", "®"],
  ["&copy;", "©"],
  ["&sect;", "§"],
  ["+-", "±"],
  ["%%", "‰"],
  ["%%%", "‱"],
  ["‰%", "‱"],
  ["~0", "₀"],
  ["~1", "₁"],
  ["~2", "₂"],
  ["~3", "₃"],
  ["~4", "₄"],
  ["~5", "₅"],
  ["~6", "₆"],
  ["~7", "₇"],
  ["~8", "₈"],
  ["~9", "₉"],
  ["~+", "₊"],
  ["~-", "₋"],
  ["^0", "⁰"],
  ["^1", "¹"],
  ["^2", "²"],
  ["^3", "³"],
  ["^4", "⁴"],
  ["^5", "⁵"],
  ["^6", "⁶"],
  ["^7", "⁷"],
  ["^8", "⁸"],
  ["^9", "⁹"],
  ["^o", "°"],
  ["^+", "⁺"],
  ["^-", "⁻"],
] as const

const blockedStates = new WeakMap<LexicalEditor, WeakSet<EditorState>>()

function canTransformInput() {
  const editor = $getEditor()

  return (
    editor.isEditable() &&
    !editor.isComposing() &&
    !blockedStates.get(editor)?.has(editor.getEditorState())
  )
}

function replaceTypedText(node: TextNode, text: string) {
  if (canTransformInput() && !node.hasFormat("code")) node.setTextContent(text)
  node.selectEnd()

  return node
}

function createSubstitution(
  pattern: string,
  replacement: string,
): TextMatchTransformer {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const boundary = pattern.includes("/") ? "(?<![\\p{L}\\p{N}])" : ""

  return {
    dependencies: [],
    type: "text-match",
    trigger: pattern.slice(-1),
    regExp: new RegExp(`${boundary}${escaped}$`, "u"),
    replace(node) {
      return replaceTypedText(node, replacement)
    },
  }
}

function createQuoteSubstitution(
  character: string,
  open: string,
  close: string,
): TextMatchTransformer {
  return {
    dependencies: [],
    type: "text-match",
    trigger: character,
    regExp: new RegExp(`${character}$`, "u"),
    replace(node) {
      const previous =
        node.getPreviousSibling()?.getTextContent().slice(-1) ?? ""

      return replaceTypedText(
        node,
        !previous || /[\s([{]/u.test(previous) ? open : close,
      )
    },
  }
}

const nestedQuote: ElementTransformer = {
  dependencies: [QuoteNode],
  type: "element",
  regExp: /^>{2,6}\s/,
  export: () => null,
  replace(parent, children, match) {
    if (!canTransformInput()) return false
    const depth = match[0].trim().length
    const outer = $createQuoteNode()
    let inner = outer

    for (let index = 1; index < depth; index += 1) {
      const child = $createQuoteNode()
      inner.append(child)
      inner = child
    }

    inner.append(...children)
    parent.replace(outer)
    inner.selectEnd()
  },
}

const horizontalRule: ElementTransformer = {
  dependencies: [HorizontalRuleNode],
  type: "element",
  regExp: /^(?:---|\*\*\*|___)\s?$/,
  triggerOnEnter: true,
  export: () => null,
  replace(parent, children) {
    if (!canTransformInput()) return false
    const rule = $createHorizontalRuleNode()
    const next = $createParagraphNode().append(...children)
    parent.replace(rule)
    rule.insertAfter(next)
    next.selectStart()
  },
}

const guillemets: TextMatchTransformer[] = (
  [
    [">", "»"],
    ["<", "«"],
  ] as const
).map(([character, glyph]) => ({
  dependencies: [],
  type: "text-match",
  trigger: character,
  regExp: new RegExp(`(?<=[\\p{L}\\p{N}\\s])${character}${character}$`, "u"),
  replace(node: TextNode) {
    return replaceTypedText(node, glyph)
  },
}))

const checkList: ElementTransformer = {
  ...CHECK_LIST,
  replace(parent, children, match, isImport) {
    return canTransformInput()
      ? CHECK_LIST.replace(parent, children, match, isImport)
      : false
  },
}

const additionalTransformers: Transformer[] = [
  horizontalRule,
  nestedQuote,
  checkList,
  ...[...substitutions]
    .sort((left, right) => right[0].length - left[0].length)
    .map(([pattern, replacement]) => createSubstitution(pattern, replacement)),
  ...guillemets,
  createQuoteSubstitution('"', "“", "”"),
  createQuoteSubstitution("'", "‘", "’"),
]

export const EditorAutoformatExtension = defineExtension({
  name: "@yopem-ui/editor/autoformat",
  dependencies: [HorizontalRuleExtension],
  theme: {
    hr: stylex.props(styles.rule).className,
    hrSelected: stylex.props(styles.selected).className,
  },
  register(editor) {
    const blocked = new WeakSet<EditorState>()
    blockedStates.set(editor, blocked)

    return mergeRegister(
      () => {
        blockedStates.delete(editor)
      },
      editor.registerUpdateListener(({ editorState, tags }) => {
        if (tags.has(PASTE_TAG) || tags.has(HISTORY_PUSH_TAG))
          blocked.add(editorState)
      }),
      registerMarkdownShortcuts(editor, additionalTransformers),
    )
  },
})
