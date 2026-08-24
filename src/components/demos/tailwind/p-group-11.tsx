import { ChevronDownIcon, GitForkIcon } from "lucide-react";
import { Badge } from "@/components/ui/tailwind/badge";
import { Button } from "@/components/ui/tailwind/button";
import { Group, GroupSeparator } from "@/components/ui/tailwind/group";
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover";

export default function Particle() {
  return (
    <Group aria-label="Repository actions">
      <Button variant="outline">
        <GitForkIcon aria-hidden="true" />
        Fork
        <Badge variant="secondary">48</Badge>
      </Button>
      <GroupSeparator />
      <Popover>
        <PopoverTrigger
          render={
            <Button aria-label="Send options" size="icon" variant="outline" />
          }
        >
          <ChevronDownIcon aria-hidden="true" />
        </PopoverTrigger>
        <PopoverPopup align="end" className="w-64">
          <PopoverTitle className="text-base">Existing forks</PopoverTitle>
          <PopoverDescription>
            You don't have any forks of this repository.
          </PopoverDescription>
        </PopoverPopup>
      </Popover>
    </Group>
  );
}
