import { Textarea } from "@/components/ui/tailwind/textarea"

export default function Particle() {
  return (
    <Textarea
      className="*:field-sizing-fixed *:min-h-0"
      placeholder="Type your message here"
      rows={2}
    />
  )
}
