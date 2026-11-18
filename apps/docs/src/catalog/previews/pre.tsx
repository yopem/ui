import { Pre } from "@registry/components/ui/pre"

export function Preview() {
  return (
    <Pre title="Station report">
      <code>
        {"Station report\n  North platform\n    Track 2\n\nDeparture: 08:30"}
      </code>
    </Pre>
  )
}
