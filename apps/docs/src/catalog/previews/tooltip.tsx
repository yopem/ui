import { Button } from "@registry/components/ui/button"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@registry/components/ui/tooltip"

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
