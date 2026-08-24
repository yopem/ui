import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/tailwind/field";
import { Input } from "@/components/ui/tailwind/input";

export default function Particle() {
  return (
    <Field disabled>
      <FieldLabel>Email</FieldLabel>
      <Input disabled placeholder="Enter your email" type="email" />
      <FieldDescription>This field is currently disabled.</FieldDescription>
    </Field>
  );
}
