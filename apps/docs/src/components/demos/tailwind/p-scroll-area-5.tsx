import { ScrollArea } from "@/components/ui/tailwind/scroll-area"

export default function Particle() {
  return (
    <ScrollArea className="max-w-96 rounded-lg border" scrollbarGutter>
      <div className="flex w-max gap-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            className="bg-muted flex h-20 w-32 shrink-0 items-center justify-center rounded-md"
            key={String(i)}
          >
            <span className="text-sm font-medium">Item {i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
