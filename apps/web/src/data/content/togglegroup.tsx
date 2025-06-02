import { ToggleGroup, ToggleGroupItem } from "@yopem-ui/react"

const toggleGroupComponent = {
  name: "ToggleGroup",
  description: "A group of toggle buttons with different variants and modes.",
  code: `
    <div>
      <ToggleGroup>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          Italic
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          Underline
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  `,
  preview: (
    <div>
      <ToggleGroup>
        <ToggleGroupItem value="bold" aria-label="Toggle bold">
          Bold
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Toggle italic">
          Italic
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Toggle underline">
          Underline
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
}

export default toggleGroupComponent
