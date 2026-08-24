import { Group, GroupSeparator } from "@/components/ui/tailwind/group";
import { Label } from "@/components/ui/tailwind/label";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
} from "@/components/ui/tailwind/number-field";

export default function Particle() {
  return (
    <div className="flex flex-col gap-2">
      <Label>Range</Label>
      <Group aria-label="Range input">
        <NumberField aria-label="Min value" render={<NumberFieldGroup />}>
          <NumberFieldInput className="text-left" placeholder="From" />
        </NumberField>
        <GroupSeparator />
        <NumberField aria-label="Max value" render={<NumberFieldGroup />}>
          <NumberFieldInput className="text-left" placeholder="To" />
        </NumberField>
      </Group>
    </div>
  );
}
