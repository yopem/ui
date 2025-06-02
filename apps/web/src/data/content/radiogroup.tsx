import { RadioGroup, RadioGroupItem } from "@yopem-ui/react"

const radioGroupComponent = {
  name: "RadioGroup",
  description:
    "A component for selecting a single option from a group of radio buttons.",
  code: `
    <div>
      <RadioGroup defaultValue="comfortable">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="default" id="r1" />
          <label htmlFor="r1">Default</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="comfortable" id="r2" />
          <label htmlFor="r2">Comfortable</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="compact" id="r3" />
          <label htmlFor="r3">Compact</label>
        </div>
      </RadioGroup>
    </div>
  `,
  preview: (
    <div>
      <RadioGroup defaultValue="comfortable">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="default" id="r1" />
          <label htmlFor="r1">Default</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="comfortable" id="r2" />
          <label htmlFor="r2">Comfortable</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="compact" id="r3" />
          <label htmlFor="r3">Compact</label>
        </div>
      </RadioGroup>
    </div>
  ),
}

export default radioGroupComponent
