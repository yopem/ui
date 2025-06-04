import { ProgressLinear } from "@yopem-ui/react"

export default function ToastComponentPage() {
  return (
    <main className="flex w-full px-4 py-12">
      <div className="flex h-10 w-full max-w-2xl">
        <ProgressLinear label="Loading..." showValueText value={42} max={100} />
      </div>
    </main>
  )
}
