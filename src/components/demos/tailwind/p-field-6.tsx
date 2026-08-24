import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/tailwind/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/tailwind/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/tailwind/input-group";

export default function Particle() {
  return (
    <Field>
      <FieldLabel>Subscribe</FieldLabel>
      <InputGroup>
        <InputGroupInput placeholder="Your best email" type="email" />
        <InputGroupAddon align="inline-end">
          <Button aria-label="Subscribe" size="icon-xs" variant="ghost">
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </InputGroupAddon>
      </InputGroup>
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  );
}
