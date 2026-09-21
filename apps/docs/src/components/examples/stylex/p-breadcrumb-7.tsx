import * as stylex from "@stylexjs/stylex"
import { DatabaseIcon } from "lucide-react"

// next/link replaced -> anchor
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/stylex/breadcrumb"
import { Link } from "@/components/ui/stylex/link"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"
const items = [
  { label: "Orion", value: "orion" },
  { label: "Sigma", value: "sigma" },
  { label: "Dorado", value: "dorado" },
]

export default function Example() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link aria-label="Home" href="/" />}>
            Databases
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Select
            aria-label="Select database"
            defaultValue="orion"
            items={items}
          >
            <SelectTrigger aria-label="Select database" size="sm">
              <DatabaseIcon {...stylex.props(exampleStyles.icon)} />
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              {items.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
  },
})
