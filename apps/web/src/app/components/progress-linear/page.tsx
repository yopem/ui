import { ProgressLinear } from "@yopem-ui/react"

export default function ToastComponentPage() {
  return (
    <main className="flex w-full px-4 py-12">
      <div>
        <ProgressLinear defaultValue={64} />
      </div>
    </main>
  )
}
