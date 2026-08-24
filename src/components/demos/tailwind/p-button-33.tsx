import { Button } from "@/components/ui/tailwind/button";

export default function Particle() {
  return (
    <div className="inline-flex items-center gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button>Save</Button>
    </div>
  );
}
