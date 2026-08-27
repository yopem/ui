import * as stylex from "@stylexjs/stylex"
import { MicIcon, PaperclipIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group } from "@/components/ui/stylex/group"
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
    <Group
      aria-label="Message composer"
      {...stylex.props(demoStyles.report1Manual)}
    >
      <Group aria-label="Attachments">
        <Button aria-label="Attach file" size="icon" variant="outline">
          <PaperclipIcon aria-hidden="true" />
        </Button>
      </Group>
      <Group aria-label="Message input">
        <InputGroup>
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
                <MicIcon aria-hidden="true" />
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
  report1Manual: {
    "--radius-lg": "9999px",
    "--radius": "9999rem",
  },
})
