import { ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import { Group, GroupSeparator } from "@/components/ui/tailwind/group";

export default function Particle() {
  return (
    <Group aria-label="Zoom controls" orientation="vertical">
      <Button aria-label="Zoom in" size="icon" variant="outline">
        <ZoomInIcon />
      </Button>
      <GroupSeparator orientation="horizontal" />
      <Button aria-label="Zoom Out" size="icon" variant="outline">
        <ZoomOutIcon />
      </Button>
    </Group>
  );
}
