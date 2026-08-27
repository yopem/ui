import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/tailwind/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="text-muted-foreground flex h-32 w-full max-w-sm items-center justify-center rounded-lg border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuCheckboxItem defaultChecked>
          Show hidden files
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem>Compact view</ContextMenuCheckboxItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}
