import { Button } from "@/components/ui/tailwind/button";
import { Group, GroupSeparator } from "@/components/ui/tailwind/group";
import { Input } from "@/components/ui/tailwind/input";

export default function Particle() {
  return (
    <Group aria-label="Email subscription">
      <Input aria-label="Email" placeholder="Email" type="email" />
      <GroupSeparator />
      <Button variant="outline">Subscribe</Button>
    </Group>
  );
}
