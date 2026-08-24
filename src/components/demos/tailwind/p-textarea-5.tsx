import { useId } from "react";
import { Label } from "@/components/ui/tailwind/label";
import { Textarea } from "@/components/ui/tailwind/textarea";

export default function Particle() {
  const id = useId();
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={id}>Message</Label>
      <Textarea id={id} placeholder="Type your message here" />
    </div>
  );
}
