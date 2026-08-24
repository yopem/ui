import { MicIcon, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import { Group } from "@/components/ui/tailwind/group";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tailwind/tooltip";

export default function Particle() {
  return (
    <Group
      aria-label="Message composer"
      className="[--radius-lg:9999px] [--radius:9999rem]"
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
  );
}
