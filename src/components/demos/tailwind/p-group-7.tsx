import { Group, GroupSeparator, GroupText } from "@/components/ui/tailwind/group";
import { Input } from "@/components/ui/tailwind/input";
import { Label } from "@/components/ui/tailwind/label";

export default function Particle() {
  return (
    <Group aria-label="Domain input">
      <GroupText render={<Label aria-label="Domain" htmlFor="domain" />}>
        https://
      </GroupText>
      <GroupSeparator />
      <Input
        aria-label="Domain"
        defaultValue="coss.com"
        id="domain"
        type="text"
      />
    </Group>
  );
}
