"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
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

export default function Particle() {
  return (
    <Group aria-label="URL search">
      <Select defaultValue="both" items={protocols}>
        <SelectTrigger {...stylex.props(demoStyles.selectTrigger)}>
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
        {...stylex.props(demoStyles.demo1)}
        defaultValue="coss.com"
        type="text"
      />
      <GroupSeparator />
      <Select defaultValue={null} items={subdomains}>
        <SelectTrigger {...stylex.props(demoStyles.selectTrigger)}>
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
      <Button aria-label="Search" size="icon" variant="outline">
        <SearchIcon aria-hidden="true" />
      </Button>
    </Group>
  )
}

const demoStyles = stylex.create({
  selectTrigger: { inlineSize: "fit-content", minInlineSize: 0 },
  demo1: {
    flex: "1",
  },
})
