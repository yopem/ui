import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@registry/components/ui/context-menu"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  contextMenuTrigger: {
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

export function Preview() {
  return (
    <ContextMenu>
      <ContextMenuTrigger xstyle={styles.contextMenuTrigger}>
        Right-click a field note
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuItem>Open note</ContextMenuItem>
        <ContextMenuItem>Duplicate note</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Copy note link</ContextMenuItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}
