// next/link replaced -> anchor
import {
  ContextMenu,
  ContextMenuLinkItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/tailwind/context-menu";

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-32 w-full max-w-sm items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuLinkItem render={<a href="/docs" />}>
          Docs
        </ContextMenuLinkItem>
        <ContextMenuLinkItem render={<a href="/particles" />}>
          Particles
        </ContextMenuLinkItem>
      </ContextMenuPopup>
    </ContextMenu>
  );
}
