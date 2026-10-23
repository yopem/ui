import { CodeIndentExtension, CodeNode } from "@lexical/code"
import { CodePrismExtension, PrismTokenizer } from "@lexical/code-prism"
import { $isTableCellNode } from "@lexical/table"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import {
  $getNodeByKey,
  $getSelection,
  $getState,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  configExtension,
  defineExtension,
  INSERT_TAB_COMMAND,
  KEY_TAB_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical"

import {
  $getSelectedCode,
  codeLineNumbersState,
  codeWrapState,
} from "./code-model"
import { editorStyles, editorTheme } from "./theme"

const styles = stylex.create({
  block: {
    borderRadius: tokens["--radius-md"],
    display: "block",
    position: "relative",
    overflowX: "auto",
    tabSize: 2,
    whiteSpace: "pre",
  },
  wrap: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
  numbers: {
    paddingInlineStart: "5ch",
    "::before": {
      content: 'attr(data-gutter) / ""',
      position: "absolute",
      insetInlineStart: 0,
      insetBlockStart: `calc(${tokens["--spacing"]} * 2)`,
      inlineSize: "4ch",
      textAlign: "end",
      whiteSpace: "pre",
      color: tokens["--muted-foreground"],
      pointerEvents: "none",
      userSelect: "none",
    },
  },
  comment: { color: tokens["--muted-foreground"], fontStyle: "italic" },
  keyword: { color: tokens["--info-foreground"], fontWeight: 600 },
  string: { color: tokens["--success-foreground"] },
  number: { color: tokens["--warning-foreground"] },
  symbol: { color: tokens["--foreground"] },
  function: { color: tokens["--foreground"], fontWeight: 600 },
  deleted: {
    color: tokens["--destructive-foreground"],
    textDecoration: "line-through",
  },
})

export const EditorCodeExtension = defineExtension({
  name: "@yopem-ui/editor-code",
  dependencies: [
    configExtension(CodePrismExtension, {
      tokenizer: { ...PrismTokenizer, defaultLanguage: null },
    }),
    configExtension(CodeIndentExtension, { tabSize: 2 }),
  ],
  theme: {
    codeHighlight: {
      atrule: stylex.props(styles.keyword).className ?? "",
      attr: stylex.props(styles.keyword).className ?? "",
      "attr-name": stylex.props(styles.keyword).className ?? "",
      "attr-value": stylex.props(styles.string).className ?? "",
      boolean: stylex.props(styles.number).className ?? "",
      builtin: stylex.props(styles.keyword).className ?? "",
      cdata: stylex.props(styles.comment).className ?? "",
      char: stylex.props(styles.string).className ?? "",
      class: stylex.props(styles.function).className ?? "",
      "class-name": stylex.props(styles.function).className ?? "",
      comment: stylex.props(styles.comment).className ?? "",
      constant: stylex.props(styles.number).className ?? "",
      deleted: stylex.props(styles.deleted).className ?? "",
      doctype: stylex.props(styles.comment).className ?? "",
      entity: stylex.props(styles.symbol).className ?? "",
      function: stylex.props(styles.function).className ?? "",
      important: stylex.props(styles.keyword).className ?? "",
      inserted: stylex.props(styles.string).className ?? "",
      keyword: stylex.props(styles.keyword).className ?? "",
      namespace: stylex.props(styles.keyword).className ?? "",
      number: stylex.props(styles.number).className ?? "",
      operator: stylex.props(styles.symbol).className ?? "",
      prolog: stylex.props(styles.comment).className ?? "",
      property: stylex.props(styles.symbol).className ?? "",
      punctuation: stylex.props(styles.symbol).className ?? "",
      regex: stylex.props(styles.string).className ?? "",
      selector: stylex.props(styles.keyword).className ?? "",
      string: stylex.props(styles.string).className ?? "",
      symbol: stylex.props(styles.symbol).className ?? "",
      tag: stylex.props(styles.keyword).className ?? "",
      url: stylex.props(styles.string).className ?? "",
      variable: stylex.props(styles.symbol).className ?? "",
    },
  },
  register(editor) {
    const applied = new Map<
      string,
      { element: HTMLElement; classes: string[]; tabIndex: string | null }
    >()

    const base = editorTheme.code?.split(" ") ?? []

    const unregister = editor.registerMutationListener(
      CodeNode,
      (mutations) => {
        editor.getEditorState().read(() => {
          for (const [key, mutation] of mutations) {
            if (mutation === "destroyed") {
              applied.delete(key)
              continue
            }

            const node = $getNodeByKey(key)
            const element = editor.getElementByKey(key)

            if (!node || !element) continue
            const wrap = $getState(node, codeWrapState)
            const lineNumbers = $getState(node, codeLineNumbersState) && !wrap

            const classes =
              stylex
                .props(
                  editorStyles.code,
                  styles.block,
                  wrap && styles.wrap,
                  lineNumbers && styles.numbers,
                )
                .className?.split(" ") ?? []

            const previous = applied.get(key)

            const tabIndex = previous
              ? previous.tabIndex
              : element.getAttribute("tabindex")

            if (!wrap) element.setAttribute("tabindex", "0")
            else if (tabIndex === null) element.removeAttribute("tabindex")
            else element.setAttribute("tabindex", tabIndex)

            element.classList.remove(
              ...base,
              ...(applied.get(key)?.classes ?? []),
            )
            element.classList.add(...classes)
            element.setAttribute("data-code-wrap", String(wrap))
            element.setAttribute("data-code-line-numbers", String(lineNumbers))
            applied.set(key, { element, classes, tabIndex })
          }
        })
      },
    )

    const unregisterTab = editor.registerCommand(
      KEY_TAB_COMMAND,
      (event) => {
        if (!editor.isEditable()) return false
        const selection = $getSelection()

        if (!$isRangeSelection(selection) || !selection.isCollapsed())
          return false
        const code = $getSelectedCode()

        if (!code?.getParents().some($isTableCellNode)) return false
        event.preventDefault()
        editor.dispatchCommand(
          event.shiftKey ? OUTDENT_CONTENT_COMMAND : INSERT_TAB_COMMAND,
          undefined,
        )

        return true
      },
      COMMAND_PRIORITY_CRITICAL,
    )

    return () => {
      unregisterTab()
      unregister()

      for (const { element, classes, tabIndex } of applied.values()) {
        element.classList.remove(...classes)
        element.classList.add(...base)
        element.removeAttribute("data-code-wrap")
        element.removeAttribute("data-code-line-numbers")

        if (tabIndex === null) element.removeAttribute("tabindex")
        else element.setAttribute("tabindex", tabIndex)
      }

      applied.clear()
    }
  },
})
