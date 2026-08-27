import * as stylex from "@stylexjs/stylex"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuGroupLabel,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/stylex/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger {...stylex.props(demoStyles.demo1)}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuGroup>
          <ContextMenuGroupLabel>File</ContextMenuGroupLabel>
          <ContextMenuItem>Rename</ContextMenuItem>
          <ContextMenuItem>Duplicate</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuGroupLabel>Share</ContextMenuGroupLabel>
          <ContextMenuItem>Send copy</ContextMenuItem>
          <ContextMenuItem>Export</ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

const demoStyles = stylex.create({
  demo1: {
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
