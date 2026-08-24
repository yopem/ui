import { Button } from "@/components/ui/tailwind/button";
import { Textarea } from "@/components/ui/tailwind/textarea";

export default function Particle() {
  return (
    <div className="flex flex-col gap-2">
      <Textarea placeholder="Type your message here" />
      <Button className="self-start">Send</Button>
    </div>
  );
}
