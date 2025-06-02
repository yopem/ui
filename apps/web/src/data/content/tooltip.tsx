import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@yopem-ui/react"

const tooltipComponent = {
  name: "Tooltip",
  description:
    "A component that displays a tooltip when hovering over an element.",
  code: `
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </div>
  `,
  preview: (
    <div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Add to library</p>
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

export default tooltipComponent
