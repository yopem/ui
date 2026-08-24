import { Button } from "@/components/ui/tailwind/button";
import { Group } from "@/components/ui/tailwind/group";
import { Input } from "@/components/ui/tailwind/input";

export default function Particle() {
  return (
    <Group aria-label="Email subscription" className="gap-2">
      <Input
        aria-label="Email"
        className="flex-1"
        placeholder="you@example.com"
        type="email"
      />
      <div>
        <Button variant="outline">Send</Button>
      </div>
    </Group>
  );
}
