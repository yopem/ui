import { Textarea } from "@/components/ui/tailwind/textarea";

export default function Particle() {
  return (
    <Textarea
      aria-label="Message"
      className="border-transparent bg-muted shadow-none before:hidden"
      placeholder="Type your message here"
    />
  );
}
