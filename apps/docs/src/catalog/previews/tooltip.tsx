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
      <TooltipPopup>Keep this note in your field notebook.</TooltipPopup>
    </Tooltip>
  )
}
