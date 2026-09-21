import * as stylex from "@stylexjs/stylex"
import { HomeIcon } from "lucide-react"

// next/link replaced -> anchor
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/stylex/breadcrumb"
import { Link } from "@/components/ui/stylex/link"
export default function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            aria-label="Home"
            render={<Link aria-label="Home" href="/" />}
          >
            <HomeIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.example1)}
            />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link aria-label="Home" href="/docs/" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const exampleStyles = stylex.create({
  example1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
