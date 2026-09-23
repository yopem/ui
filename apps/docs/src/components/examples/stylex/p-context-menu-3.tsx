import * as stylex from "@stylexjs/stylex"

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSub,
  ContextMenuSubPopup,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export default function Example() {
  return (
    <ContextMenu>
      <ContextMenuTrigger {...stylex.props(exampleStyles.example1)}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubPopup>
            <ContextMenuItem>Email link</ContextMenuItem>
            <ContextMenuItem>Messages</ContextMenuItem>
            <ContextMenuItem>Notes</ContextMenuItem>
          </ContextMenuSubPopup>
        </ContextMenuSub>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    blockSize: "calc(0.25rem * 32)",
    inlineSize: "100%",
    maxInlineSize: "24rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "dashed",
    borderWidth: "1px",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
