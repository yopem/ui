"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"
import { Input } from "@/components/ui/stylex/input"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const protocols = [
  { label: "http", value: "http" },
  { label: "https", value: "https" },
  { label: "http + https", value: "both" },
]

const subdomains = [
  { label: "Subdomains", value: null },
  { label: "www", value: "www" },
  { label: "api", value: "api" },
  { label: "cdn", value: "cdn" },
]

export default function Example() {
  return (
    <Group aria-label="URL search">
      <Select defaultValue="both" items={protocols}>
        <SelectTrigger
          xstyle={[groupItemStyles.item, exampleStyles.selectTrigger]}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {protocols.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <GroupSeparator />
      <Input
        aria-label="URL"
        defaultValue="coss.com"
        type="text"
        controlXstyle={[groupItemStyles.item, exampleStyles.example1]}
      />
      <GroupSeparator />
      <Select defaultValue={null} items={subdomains}>
        <SelectTrigger
          xstyle={[groupItemStyles.item, exampleStyles.selectTrigger]}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectPopup>
          {subdomains.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectPopup>
      </Select>
      <GroupSeparator />
      <Button
        aria-label="Search"
        size="icon"
        variant="outline"
        xstyle={groupItemStyles.item}
      >
        <SearchIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
      </Button>
    </Group>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
  example1: {
    flex: "1",
  },
})
