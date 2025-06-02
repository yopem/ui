import Link from "next/link"
import clsx from "clsx"

import { CheckboxMenu } from "@/components/menu/CheckboxMenu"
import { GroupMenu } from "@/components/menu/GroupMenu"
import { NestedMenu } from "@/components/menu/NestedMenu"
import { RadioGroupContent } from "@/components/menu/RadioGroupContent"
import { components } from "@/data/component"

interface Props {
  params: { slug: string }
}

export default function MenuComponentPage({ params }: Props) {
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
      <section className="flex max-w-4xl flex-1 gap-2 pl-6">
        <RadioGroupContent />
        <NestedMenu />
        <GroupMenu />
        <CheckboxMenu />
      </section>
    </main>
  )
}
