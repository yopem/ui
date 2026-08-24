// next/link replaced -> anchor
import { Button } from "@/components/ui/tailwind/button";

export default function Particle() {
  return <Button render={<a href="/" />}>Link</Button>;
}
