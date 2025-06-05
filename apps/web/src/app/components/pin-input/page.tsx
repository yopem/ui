import { PinInputBasic } from "@/components/pin-input/pin-input-basic"
import { PinInputBlurred } from "@/components/pin-input/pin-input-blurred"

export default function PinInputComponentPage() {
  return (
    <section className="flex max-w-4xl flex-1 flex-col gap-2 pl-6">
      <PinInputBasic />
      <PinInputBlurred />
    </section>
  )
}
