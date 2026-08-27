import { Input } from "@/components/ui/tailwind/input"

export default function Particle() {
  return (
    <Input
      aria-label="Email"
      className="bg-muted border-transparent shadow-none before:hidden"
      placeholder="Email"
      type="email"
    />
  )
}
