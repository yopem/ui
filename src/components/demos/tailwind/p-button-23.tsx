import { ThumbsUpIcon } from "lucide-react"

import { Button } from "@/components/ui/tailwind/button"

export default function Particle() {
  return (
    <Button className="pe-0" variant="outline">
      <ThumbsUpIcon aria-hidden="true" />
      Like
      <span className="text-muted-foreground before:bg-input relative ms-1 px-3 text-xs font-medium before:absolute before:inset-0 before:left-0 before:w-px">
        86
      </span>
    </Button>
  )
}
