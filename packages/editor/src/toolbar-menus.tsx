"use client"

import type { ComponentProps, MouseEvent } from "react"

import { useStableCallback } from "@base-ui/utils/useStableCallback"
import { $isListNode } from "@lexical/list"
import { $isHeadingNode } from "@lexical/rich-text"
import { Button } from "@registry/components/ui/button"
import {
  Menu,
  MenuCheckboxItem,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "@registry/components/ui/menu"
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarSeparator,
} from "@registry/components/ui/toolbar"
import * as stylex from "@stylexjs/stylex"
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  HISTORY_PUSH_TAG,
  mergeRegister,
  type TextFormatType,
} from "lexical"
import {
  BoldIcon,
  CodeIcon,
  EllipsisIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  LinkIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  Redo2Icon,
  TableIcon,
  TablePropertiesIcon,
  UnderlineIcon,
  Undo2Icon,
} from "lucide-react"
import { useRef, useState, useSyncExternalStore } from "react"

import type { EditorBlockButtonProps, EditorListButtonProps } from "./controls"

import {
  $createEditorBlock,
  $setEditorBlockType,
  editorBlockLabels,
  editorListCommands,
  editorListLabels,
  EditorFormatButton,
  EditorHistoryButton,
  EditorIndentButton,
  EditorListButton,
  EditorTableButton,
  EditorToolbar,
} from "./controls"
import { EditorLinkControl } from "./link-control"
import { useEditor, useEditorState } from "./root"
import { createEditorSelectionBookmark } from "./selection-bookmark"
import { EditorTableMenu } from "./table-controls"

type Block = EditorBlockButtonProps["block"]

type List = EditorListButtonProps["listType"]

export type EditorToolbarMenuAction =
  | `insert:${Block | List}`
  | `turn:${Block | List}`
  | `format:${"strikethrough" | "subscript" | "superscript" | "highlight"}`

export type EditorToolbarMenuProps = ComponentProps<typeof ToolbarButton> & {
  authorizeAction?: (action: EditorToolbarMenuAction) => boolean
}

export type EditorToolbarButtonsProps = ComponentProps<typeof ToolbarGroup> &
  Pick<EditorToolbarMenuProps, "authorizeAction">

const blocks: readonly (readonly [Block, string])[] = [
  ["paragraph", editorBlockLabels.paragraph],
  ["h1", editorBlockLabels.h1],
  ["h2", editorBlockLabels.h2],
  ["h3", editorBlockLabels.h3],
  ["h4", editorBlockLabels.h4],
  ["h5", editorBlockLabels.h5],
  ["h6", editorBlockLabels.h6],
  ["quote", editorBlockLabels.quote],
  ["code", editorBlockLabels.code],
]

const lists: readonly (readonly [List, string])[] = [
  ["bullet", editorListLabels.bullet],
  ["number", editorListLabels.number],
  ["check", editorListLabels.check],
]

const blockChoices = [...blocks, ...lists]

const moreFormats = [
  "strikethrough",
  "subscript",
  "superscript",
  "highlight",
] as const

const moreLabels = {
  strikethrough: "Strikethrough",
  subscript: "Subscript",
  superscript: "Superscript",
  highlight: "Highlight",
}

const styles = stylex.create({
  fixed: { position: "sticky", insetBlockStart: 0, zIndex: 10 },
  group: { flexWrap: "wrap", minInlineSize: 0, maxInlineSize: "100%" },
})

function $canInsertBlock() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return false
  const start = selection.anchor.getNode().getTopLevelElement()
  const end = selection.focus.getNode().getTopLevelElement()

  return start !== null && start === end
}

function $currentBlock() {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) return ""
  const node = selection.anchor.getNode()
  const parents = [node, ...node.getParents()]
  const list = parents.find($isListNode)

  if (list) return list.getListType()

  const block = parents.find(
    (parent) =>
      $isElementNode(parent) &&
      !parent.isInline() &&
      parent.getType() !== "root",
  )

  return block && $isHeadingNode(block)
    ? block.getTag()
    : (block?.getType() ?? "")
}

function EditorNativeMenu({
  kind,
  children,
  disabled,
  onClick,
  onMouseDown,
  onFocus,
  authorizeAction,
  "aria-label": label,
  ...props
}: EditorToolbarMenuProps & { kind: "insert" | "turn" | "more" }) {
  const editor = useEditor()
  const state = useEditorState()
  const [bookmark] = useState(() => createEditorSelectionBookmark(editor))
  const [open, setOpen] = useState(false)
  const returnToEditor = useRef(false)

  const subscribeBookmark = useStableCallback(function subscribeBookmark(
    notify: () => void,
  ) {
    return mergeRegister(
      bookmark.subscribe(notify),
      editor.registerEditableListener(() => {
        bookmark.clear()
        returnToEditor.current = false
        setOpen(false)
      }),
    )
  })

  const available = useSyncExternalStore(
    subscribeBookmark,
    bookmark.getSnapshot,
    bookmark.getServerSnapshot,
  )

  const [target, setTarget] = useState<{
    block: string
    insertable: boolean
    formats: readonly TextFormatType[]
  }>({ block: "", insertable: false, formats: [] })

  const subscribe = useStableCallback(function subscribe(notify: () => void) {
    return editor.registerUpdateListener(notify)
  })

  const current = useSyncExternalStore(
    subscribe,
    () => editor.getEditorState().read($currentBlock),
    () => "",
  )

  const currentBlock = open ? target.block : current

  const name =
    label ??
    (kind === "insert" ? "Insert" : kind === "turn" ? "Turn into" : "More")

  const currentBlockLabel =
    blockChoices.find(([block]) => block === currentBlock)?.[1] ?? "Block"

  const triggerLabel =
    kind === "turn" && label === undefined
      ? `${name}: ${currentBlockLabel}`
      : name

  function capture() {
    editor.getEditorState().read(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection)) {
        bookmark.capture()
        setTarget({
          block: $currentBlock(),
          insertable: $canInsertBlock(),
          formats: moreFormats.filter((format) => selection.hasFormat(format)),
        })
      }
    })
  }

  function permitted(action: EditorToolbarMenuAction) {
    return (
      disabled !== true &&
      editor.isEditable() &&
      (!authorizeAction || authorizeAction(action) === true)
    )
  }

  function apply(
    event: MouseEvent<HTMLElement>,
    action: EditorToolbarMenuAction,
    command: () => void,
  ) {
    if (
      event.defaultPrevented ||
      !permitted(action) ||
      !bookmark.getSnapshot() ||
      editor._updating ||
      editor._dirtyElements.size > 0 ||
      editor._dirtyLeaves.size > 0
    )
      return
    let applied = false
    editor.update(
      () => {
        if (
          !permitted(action) ||
          event.defaultPrevented ||
          !editor.isEditable() ||
          editor._dirtyElements.size > 0 ||
          editor._dirtyLeaves.size > 0 ||
          !bookmark.restore()
        )
          return
        command()
        applied = true
      },
      { tag: HISTORY_PUSH_TAG, discrete: true },
    )

    if (!applied) return
    bookmark.clear()
    returnToEditor.current = true
    setOpen(false)
  }

  function insert(block: Block | List) {
    const selection = $getSelection()

    if (!$isRangeSelection(selection)) return
    const anchor = selection.anchor.getNode()
    const focus = selection.focus.getNode()
    const start = anchor.getTopLevelElement()
    const end = focus.getTopLevelElement()

    if (!start || start !== end) return
    const isList = block === "bullet" || block === "number" || block === "check"
    const node = $createEditorBlock(isList ? "paragraph" : block)
    start.insertAfter(node)
    node.selectStart()

    if (isList) editor.dispatchCommand(editorListCommands[block], undefined)
  }

  return (
    <Menu
      open={open && state.editable && !disabled}
      onOpenChange={(next) => {
        if (next) {
          returnToEditor.current = false
          capture()
        } else bookmark.clear()
        setOpen(next)
      }}
    >
      <MenuTrigger
        aria-label={label ?? triggerLabel}
        disabled={disabled === true || !state.editable}
        render={
          <ToolbarButton
            render={<Button variant="ghost" size="sm" />}
            {...props}
          />
        }
        onClick={onClick}
        onFocus={(event) => {
          onFocus?.(event)

          if (!event.defaultPrevented) capture()
        }}
        onMouseDown={(event) => {
          onMouseDown?.(event)

          if (!event.defaultPrevented) {
            capture()
            event.preventDefault()
          }
        }}
      >
        {children ?? triggerLabel}
      </MenuTrigger>
      <MenuPopup
        aria-label={name}
        portalProps={{ role: "region", "aria-label": name }}
        finalFocus={() => {
          if (!returnToEditor.current) return true
          returnToEditor.current = false
          editor.focus()

          return false
        }}
      >
        {kind === "insert" ? (
          blockChoices.map(([block, text]) => (
            <MenuItem
              key={block}
              disabled={
                !available ||
                !target.insertable ||
                !permitted(`insert:${block}`)
              }
              onClick={(event) =>
                apply(event, `insert:${block}`, () => insert(block))
              }
            >
              {text}
            </MenuItem>
          ))
        ) : kind === "turn" ? (
          <MenuRadioGroup value={currentBlock}>
            {blocks.map(([block, text]) => (
              <MenuRadioItem
                key={block}
                value={block}
                disabled={!available || !permitted(`turn:${block}`)}
                onClick={(event) =>
                  apply(event, `turn:${block}`, () =>
                    $setEditorBlockType(block),
                  )
                }
              >
                {text}
              </MenuRadioItem>
            ))}
            {lists.map(([list, text]) => (
              <MenuRadioItem
                key={list}
                value={list}
                disabled={!available || !permitted(`turn:${list}`)}
                onClick={(event) =>
                  apply(event, `turn:${list}`, () => {
                    editor.dispatchCommand(editorListCommands[list], undefined)
                  })
                }
              >
                {text}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        ) : (
          moreFormats.map((format) => (
            <MenuCheckboxItem
              key={format}
              checked={target.formats.includes(format)}
              disabled={!available || !permitted(`format:${format}`)}
              onClick={(event) =>
                apply(event, `format:${format}`, () => {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
                })
              }
            >
              {moreLabels[format]}
            </MenuCheckboxItem>
          ))
        )}
      </MenuPopup>
    </Menu>
  )
}

export function EditorInsertMenu(props: EditorToolbarMenuProps) {
  return <EditorNativeMenu {...props} kind="insert" />
}

export function EditorTurnIntoMenu(props: EditorToolbarMenuProps) {
  return <EditorNativeMenu {...props} kind="turn" />
}

export function EditorMoreMenu(props: EditorToolbarMenuProps) {
  return <EditorNativeMenu {...props} kind="more" />
}

export function EditorFixedToolbar({
  xstyle,
  ...props
}: ComponentProps<typeof EditorToolbar>) {
  return <EditorToolbar {...props} xstyle={[styles.fixed, xstyle]} />
}

export function EditorListToolbarButtons({
  xstyle,
  ...props
}: ComponentProps<typeof ToolbarGroup>) {
  return (
    <ToolbarGroup aria-label="Lists" {...props} xstyle={[styles.group, xstyle]}>
      <EditorListButton
        listType="bullet"
        aria-label="Bullet list"
        title="Bullet list"
      >
        <ListIcon aria-hidden="true" size={16} />
      </EditorListButton>
      <EditorListButton
        listType="number"
        aria-label="Numbered list"
        title="Numbered list"
      >
        <ListOrderedIcon aria-hidden="true" size={16} />
      </EditorListButton>
      <EditorListButton
        listType="check"
        aria-label="Checklist"
        title="Checklist"
      >
        <ListChecksIcon aria-hidden="true" size={16} />
      </EditorListButton>
    </ToolbarGroup>
  )
}

export function EditorFloatingToolbarButtons({
  children,
  xstyle,
  authorizeAction,
  ...props
}: EditorToolbarButtonsProps) {
  return (
    <ToolbarGroup
      aria-label="Text formatting"
      {...props}
      xstyle={[styles.group, xstyle]}
    >
      <EditorFormatButton format="bold" title="Bold">
        <BoldIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton format="italic" title="Italic">
        <ItalicIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton format="underline" title="Underline">
        <UnderlineIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorFormatButton format="code" title="Inline code">
        <CodeIcon aria-hidden="true" size={16} />
      </EditorFormatButton>
      <EditorLinkControl aria-label="Link" title="Link">
        <LinkIcon aria-hidden="true" size={16} />
      </EditorLinkControl>
      <EditorMoreMenu authorizeAction={authorizeAction} title="More">
        <EllipsisIcon aria-hidden="true" size={16} />
      </EditorMoreMenu>
      {children}
    </ToolbarGroup>
  )
}

export function EditorFixedToolbarButtons({
  children,
  xstyle,
  authorizeAction,
  ...props
}: EditorToolbarButtonsProps) {
  return (
    <ToolbarGroup
      aria-label="Document formatting"
      {...props}
      xstyle={[styles.group, xstyle]}
    >
      <ToolbarGroup aria-label="History">
        <EditorHistoryButton action="undo" aria-label="Undo" title="Undo">
          <Undo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
        <EditorHistoryButton action="redo" aria-label="Redo" title="Redo">
          <Redo2Icon aria-hidden="true" size={16} />
        </EditorHistoryButton>
      </ToolbarGroup>
      <ToolbarSeparator />
      <EditorInsertMenu authorizeAction={authorizeAction} />
      <EditorTurnIntoMenu authorizeAction={authorizeAction} />
      <ToolbarSeparator />
      <EditorFloatingToolbarButtons authorizeAction={authorizeAction} />
      <ToolbarSeparator />
      <EditorListToolbarButtons />
      <EditorIndentButton
        direction="outdent"
        aria-label="Outdent"
        title="Outdent"
      >
        <IndentDecreaseIcon aria-hidden="true" size={16} />
      </EditorIndentButton>
      <EditorIndentButton direction="indent" aria-label="Indent" title="Indent">
        <IndentIncreaseIcon aria-hidden="true" size={16} />
      </EditorIndentButton>
      <ToolbarSeparator />
      <EditorTableButton aria-label="Insert table" title="Insert table">
        <TableIcon aria-hidden="true" size={16} />
      </EditorTableButton>
      <EditorTableMenu aria-label="Table actions" title="Table actions">
        <TablePropertiesIcon aria-hidden="true" size={16} />
      </EditorTableMenu>
      {children}
    </ToolbarGroup>
  )
}
