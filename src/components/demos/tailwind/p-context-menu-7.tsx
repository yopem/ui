import {
  ContextMenu,
  ContextMenuPopup,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuTrigger,
} from "@/components/ui/tailwind/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="text-muted-foreground flex h-32 w-full max-w-sm items-center justify-center rounded-lg border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuRadioGroup defaultValue="system">
          <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
          <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
          <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuPopup>
    </ContextMenu>
  )
}
