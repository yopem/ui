import { ProgressLinear } from "@yopem-ui/react"

const progressComponent = {
  name: "Progress",
  description:
    "A component for displaying progress with customizable min and max values.",
  code: `
    <div>
      <ProgressLinear defaultValue={20} min={10} max={30} />
    </div>
  `,
  preview: (
    <div>
      <ProgressLinear defaultValue={20} min={10} max={30} />
    </div>
  ),
}

export default progressComponent
