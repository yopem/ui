import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/tailwind/field";
import { Slider } from "@/components/ui/tailwind/slider";

export default function Particle() {
  return (
    <Field className="items-stretch gap-3">
      <FieldLabel>Country</FieldLabel>
      <Slider defaultValue={50} />
      <FieldDescription>This is an optional field</FieldDescription>
    </Field>
  );
}
