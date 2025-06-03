import Link from "next/link"
import clsx from "clsx"

import ToastBasic from "@/components/toast/toast-basic"
import ToastError from "@/components/toast/toast-error"
import ToastInfo from "@/components/toast/toast-info"
import ToastSuccess from "@/components/toast/toast-success"
import { components } from "@/data/components"

interface Props {
  params: { slug: string }
}

export default function ToastComponentPage({ params }: Props) {
  return (
    <main className="flex w-full px-4 py-12">
      {/* Sidebar */}
      <aside className="sticky top-20 h-[calc(100vh-5rem)] w-64 overflow-y-auto border-r border-gray-200 pr-6">
        <nav className="space-y-1">
          <Link
            href="/"
            className="block rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            🏠 Home
          </Link>

          <hr className="my-2 border-gray-200" />

          {components.map((c) => (
            <Link
              key={c.slug}
              href={`/components/${c.slug}`}
              className={clsx(
                "block rounded px-3 py-2 text-sm hover:bg-gray-100",
                {
                  "bg-gray-100 font-semibold text-blue-600":
                    c.slug === params.slug,
                },
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <section className="flex max-w-4xl flex-1 flex-col gap-2 pl-6">
        <ToastBasic />
        <ToastSuccess />
        <ToastError />
        <ToastInfo />
      </section>
    </main>
  )
}
