import * as stylex from "@stylexjs/stylex"
import { CopyIcon, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"

import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/stylex/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger {...stylex.props(demoStyles.demo1)}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuItem>
          <PencilIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
          Edit
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <CopyIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <ShareIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
          Share
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <TrashIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
          Delete
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
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
