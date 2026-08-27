import { ChevronDownIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/tailwind/collapsible"
import { Frame, FrameHeader, FramePanel } from "@/components/ui/tailwind/frame"

export default function Particle() {
  return (
    <Frame className="w-full">
      <Collapsible>
        <FrameHeader className="flex-row items-center justify-between px-2 py-2">
          <CollapsibleTrigger
            className="data-panel-open:[&_svg]:rotate-180"
            render={<Button variant="ghost" />}
          >
            <ChevronDownIcon className="size-4" />
            Section header
          </CollapsibleTrigger>
          <Button aria-label="Delete" size="icon" variant="ghost">
            <TrashIcon />
          </Button>
        </FrameHeader>
        <CollapsiblePanel>
          <FramePanel>
            <h2 className="text-sm font-semibold">Section title</h2>
            <p className="text-muted-foreground text-sm">Section description</p>
          </FramePanel>
        </CollapsiblePanel>
      </Collapsible>
    </Frame>
  )
}
