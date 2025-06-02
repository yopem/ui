import { Input } from "@yopem-ui/react"

const inputComponent = {
  name: "Input",
  description: "A text input component with various states including disabled.",
  code: `
    <div className="flex flex-col space-y-2">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
    </div>
  `,
  preview: (
    <div className="flex flex-col space-y-2">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
    </div>
  ),
}

export default inputComponent
