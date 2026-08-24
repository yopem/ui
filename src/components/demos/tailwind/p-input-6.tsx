import { useId } from "react"

import { Input } from "@/components/ui/tailwind/input"
import { Label } from "@/components/ui/tailwind/label"

export default function Particle() {
  const id = useId()
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        aria-label="Email"
        id={id}
        placeholder="you@example.com"
        type="email"
      />
    </div>
  )
}
