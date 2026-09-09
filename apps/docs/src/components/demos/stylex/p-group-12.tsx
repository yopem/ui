import * as stylex from "@stylexjs/stylex"
import { MicIcon, PaperclipIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, groupItemStyles } from "@/components/ui/stylex/group"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/stylex/input-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  return (
    <Group aria-label="Message composer" xstyle={demoStyles.report1Manual}>
      <Group aria-label="Attachments">
        <Button
          aria-label="Attach file"
          size="icon"
          variant="outline"
          xstyle={groupItemStyles.item}
        >
          <PaperclipIcon
            aria-hidden="true"
            {...stylex.props(demoStyles.icon)}
          />
        </Button>
      </Group>
      <Group aria-label="Message input">
        <InputGroup xstyle={groupItemStyles.item}>
          <InputGroupInput placeholder="Send a message" />
          <InputGroupAddon align="inline-end">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label="Voice Mode"
                    size="icon-xs"
                    variant="ghost"
                  />
                }
              >
                <MicIcon
                  aria-hidden="true"
                  {...stylex.props(demoStyles.icon)}
                />
              </TooltipTrigger>
              <TooltipContent>Voice Mode</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>
      </Group>
    </Group>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999rem",
  },
})
