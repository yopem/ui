import ToastBasic from "@/components/toast/toast-basic"
import ToastError from "@/components/toast/toast-error"

export default function ToastComponentPage() {
  return (
    <main className="flex w-full px-4 py-12">
      <ToastBasic />
      <ToastError />
    </main>
  )
}
