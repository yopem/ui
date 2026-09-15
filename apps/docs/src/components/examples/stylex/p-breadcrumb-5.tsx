import * as stylex from "@stylexjs/stylex"
import { ComponentIcon, HomeIcon } from "lucide-react"

// next/link replaced -> anchor
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/stylex/breadcrumb"

export default function Particle() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            {...stylex.props(exampleStyles.example1)}
            render={<a aria-label="Home" href="/" />}
          >
            <HomeIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.example2)}
            />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink
            {...stylex.props(exampleStyles.example1)}
            render={<a aria-label="Docs" href="/docs/" />}
          >
            <ComponentIcon
              aria-hidden="true"
              {...stylex.props(exampleStyles.example2)}
            />
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
    display: "inline-flex",
    alignItems: "center",
    gap: "calc(0.25rem * 1.5)",
  },
  example2: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
