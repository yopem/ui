import { Slider } from "@yopem-ui/react"

const sliderComponent = {
  name: "Slider",
  description: "A slider component for selecting values within a range.",
  code: `
    <div>
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  `,
  preview: (
    <div>
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
}

export default sliderComponent
