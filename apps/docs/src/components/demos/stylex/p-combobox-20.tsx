"use client"

import * as stylex from "@stylexjs/stylex"
import { SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/stylex/combobox"

interface TeamMember {
  avatar: string
  initials: string
  label: string
  priority: "Lowest" | "Low" | "Medium" | "High" | "Highest"
  value: string
  weight: number
}

const teamMembers: TeamMember[] = [
  {
    avatar:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=72&h=72&dpr=2&q=80",
    initials: "JH",
    label: "Jenny Hamilton",
    priority: "Highest",
    value: "jenny",
    weight: 200,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=72&h=72&dpr=2&q=80",
    initials: "PS",
    label: "Paul Smith",
    priority: "Medium",
    value: "paul",
    weight: 100,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=72&h=72&dpr=2&q=80",
    initials: "LW",
    label: "Luna Wyen",
    priority: "High",
    value: "luna",
    weight: 150,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=72&h=72&dpr=2&q=80",
    initials: "AC",
    label: "Alex Chen",
    priority: "Low",
    value: "alex",
    weight: 100,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=72&h=72&dpr=2&q=80",
    initials: "SJ",
    label: "Sarah Johnson",
    priority: "Medium",
    value: "sarah",
    weight: 50,
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=72&h=72&dpr=2&q=80",
    initials: "ED",
    label: "Emma Davis",
    priority: "Lowest",
    value: "emma",
    weight: 100,
  },
]

export default function Particle() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<TeamMember[]>(
    teamMembers.slice(0, 2),
  )

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Combobox
        autoHighlight
        items={teamMembers}
        multiple
        onOpenChange={setOpen}
        onValueChange={(value) => {
          setSelected(value)
          setOpen(false)
        }}
        open={open}
        value={selected}
      >
        <ComboboxInput
          aria-label="Add team members"
          placeholder="Add team members…"
          startAddon={<SearchIcon />}
        />
        <ComboboxPopup>
          <ComboboxEmpty>No team members found.</ComboboxEmpty>
          <ComboboxList>
            {(item: TeamMember) => (
              <ComboboxItem key={item.value} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      {selected.length > 0 && (
        <ul {...stylex.props(demoStyles.report1)}>
          {selected.map((member, memberIndex) => (
            <li
              {...stylex.props(
                demoStyles.demo2,
                memberIndex < selected.length - 1 && demoStyles.divider,
              )}
              key={member.value}
            >
              <Avatar {...stylex.props(demoStyles.demo3)}>
                <AvatarImage alt={member.label} src={member.avatar} />
                <AvatarFallback {...stylex.props(demoStyles.demo4)}>
                  {member.initials}
                </AvatarFallback>
              </Avatar>
              <span {...stylex.props(demoStyles.demo5)}>{member.label}</span>
              <Badge
                {...stylex.props(demoStyles.demo6)}
                size="sm"
                variant="outline"
              >
                {member.priority}
              </Badge>
              <span {...stylex.props(demoStyles.demo7)}>{member.weight}%</span>
              <Button
                aria-label={`Remove ${member.label}`}
                onClick={() =>
                  setSelected((current) =>
                    current.filter((item) => item.value !== member.value),
                  )
                }
                size="icon-xs"
                variant="ghost"
              >
                <XIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    inlineSize: "100%",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    padding: "0.25rem",
    paddingInlineStart: "calc(0.25rem * 2)",
    fontSize: {
      default: "1rem",
      "@media (min-width: 40rem)": "0.875rem",
    },
    lineHeight: {
      default: "calc(1.5 / 1)",
      "@media (min-width: 40rem)": "calc(1.25 / 0.875)",
    },
  },
  divider: {
    borderBlockEnd: "1px solid var(--border)",
  },
  demo3: {
    inlineSize: "calc(0.25rem * 5)",
    blockSize: "calc(0.25rem * 5)",
  },
  demo4: {
    fontSize: ".625rem",
  },
  demo5: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: "500",
  },
  demo6: {
    marginInlineStart: "auto",
  },
  demo7: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
    fontVariantNumeric: "   tabular-nums ",
  },
  report1: {
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
})
