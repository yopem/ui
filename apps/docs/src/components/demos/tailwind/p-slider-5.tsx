import { Slider } from "@/components/ui/tailwind/slider"
import { cn } from "@/lib/utils"

const max = 12
const skipInterval = 2
const ticks = [...Array(max + 1)].map((_, i) => i)

export default function Particle() {
  return (
    <div>
      <Slider aria-label="Value selector" defaultValue={5} max={max} />
      <fieldset
        aria-label="Value scale from 0 to 12"
        className="text-muted-foreground mt-3 flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium"
      >
        {ticks.map((_, i) => (
          <span
            className="flex w-0 flex-col items-center justify-center gap-2"
            key={String(i)}
          >
            <span
              className={cn(
                "bg-muted-foreground/72 h-1 w-px",
                i % skipInterval !== 0 && "h-0.5",
              )}
            />
            <span className={cn(i % skipInterval !== 0 && "opacity-0")}>
              {i}
            </span>
          </span>
        ))}
      </fieldset>
    </div>
  )
}
