import { Field, FieldLabel } from "@/components/ui/tailwind/field"
import { Slider, SliderValue } from "@/components/ui/tailwind/slider"

export default function Particle() {
  return (
    <Field>
      <Slider defaultValue={50}>
        <div className="mb-2 flex items-center justify-between gap-1">
          <FieldLabel className="text-sm font-medium">Opacity</FieldLabel>
          <SliderValue />
        </div>
      </Slider>
    </Field>
  )
}
