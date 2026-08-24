import { Button } from "@/components/ui/tailwind/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group";

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput placeholder="Type to search…" type="search" />
      <InputGroupAddon align="inline-end">
        <Button size="xs" variant="secondary">
          Search
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
