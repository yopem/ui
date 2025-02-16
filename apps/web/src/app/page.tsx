import { Badge, Button } from "@yopem-ui/react"

export default function Home() {
  return (
    <main className="mx-auto flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl">Hello, World!</h1>
      <Button>Click me</Button>
      <Badge>Badge</Badge>
    </main>
  )
}
