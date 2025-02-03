import { Badge, Button } from "@yopem-ui/react"

export default function Home() {
  return (
    <div>
      <main>
        <h1>Halo, Dunia!</h1>
        <div className="my-2 flex">
          <Button>Tombol!</Button>
          <Badge>Badge</Badge>
          <button className="rounded-xl bg-amber-200 px-6 py-3 text-white">
            button
          </button>
        </div>
      </main>
    </div>
  )
}
