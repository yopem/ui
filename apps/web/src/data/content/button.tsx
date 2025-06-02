import { Button } from "@yopem-ui/react"

const buttonComponent = {
  name: "Button",
  description: "A versatile button component with various variants and styles.",
  code: `
    <div className="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button asChild variant="link">
        <a href="#">Link</a>
      </Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  `,
  preview: (
    <div className="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button asChild variant="link">
        <a href="#">Link</a>
      </Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
}

export default buttonComponent
