import { Slider } from "@/components/ui/stylex/slider"

export default function Particle() {
  return (
    <Slider
      aria-label="Dual thumb slider with collision behavior swap"
      defaultValue={[25, 75]}
      thumbCollisionBehavior="swap"
    />
  )
}
