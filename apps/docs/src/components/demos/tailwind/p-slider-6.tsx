import { Slider } from "@/components/ui/tailwind/slider"

export default function Particle() {
  return (
    <div>
      <div
        aria-hidden="true"
        className="text-muted-foreground mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium"
      >
        <span>Low</span>
        <span>High</span>
      </div>
      <Slider
        aria-label="Intensity level from low to high"
        defaultValue={50}
        step={10}
      />
    </div>
  )
}
