import { Button } from "@/components/ui/button"
import { Tooltip, TooltipPopup, TooltipTrigger } from "@/components/ui/tooltip"

export function Preview() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Hover me
      </TooltipTrigger>
      <TooltipPopup>Helpful hint</TooltipPopup>
    </Tooltip>
  )
}
