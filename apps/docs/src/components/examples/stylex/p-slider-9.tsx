import { Slider } from "@/components/ui/slider"

export default function Example() {
  return (
    <Slider
      aria-label="Dual thumb slider with collision behavior none"
      defaultValue={[25, 75]}
      thumbCollisionBehavior="none"
    />
  )
}
