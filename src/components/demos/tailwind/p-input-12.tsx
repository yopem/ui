import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group";
import { Spinner } from "@/components/ui/tailwind/spinner";

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupInput disabled placeholder="Processing…" type="search" />
      <InputGroupAddon>
        <Spinner />
      </InputGroupAddon>
    </InputGroup>
  );
}
