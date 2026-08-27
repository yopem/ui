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

export default function Particle() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            aria-label="Home"
            render={<a aria-label="Home" href="/" />}
          >
            <HomeIcon aria-hidden="true" {...stylex.props(demoStyles.demo1)} />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> · </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a aria-label="Home" href="/docs/" />}>
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator> · </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 4)",
    blockSize: "calc(0.25rem * 4)",
  },
})
