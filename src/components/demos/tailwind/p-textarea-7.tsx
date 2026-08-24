import { useId } from "react";
import { Label } from "@/components/ui/tailwind/label";
import { Textarea } from "@/components/ui/tailwind/textarea";

export default function Particle() {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        Message <span className="text-destructive">*</span>
      </Label>
      <Textarea id={id} placeholder="Type your message here" required />
    </div>
  );
}
