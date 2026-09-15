"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/stylex/select"

const users = [
  {
    avatar:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=72&h=72&dpr=2&q=80",
    initials: "JH",
    label: "Jenny Hamilton",
    value: "jenny",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=72&h=72&dpr=2&q=80",
    initials: "PS",
    label: "Paul Smith",
    value: "paul",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=72&h=72&dpr=2&q=80",
    initials: "LW",
    label: "Luna Wyen",
    value: "luna",
  },
]

export default function Example() {
  return (
    <Select
      aria-label="Select user"
      defaultValue={users[0]}
      itemToStringValue={(item) => item.value}
    >
      <SelectTrigger>
        <SelectValue>
          {(item) => (
            <span {...stylex.props(exampleStyles.example1)}>
              <Avatar {...stylex.props(exampleStyles.example2)}>
                <AvatarImage alt={item.label} src={item.avatar} />
                <AvatarFallback {...stylex.props(exampleStyles.example3)}>
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <span {...stylex.props(exampleStyles.example4)}>
                {item.label}
              </span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectGroupLabel>Impersonate user</SelectGroupLabel>
          {users.map((item) => (
            <SelectItem key={item.value} value={item}>
              <span {...stylex.props(exampleStyles.example1)}>
                <Avatar {...stylex.props(exampleStyles.example2)}>
                  <AvatarImage alt={item.label} src={item.avatar} />
                  <AvatarFallback {...stylex.props(exampleStyles.example5)}>
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <span {...stylex.props(exampleStyles.example4)}>
                  {item.label}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectPopup>
    </Select>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    inlineSize: "calc(0.25rem * 5)",
    blockSize: "calc(0.25rem * 5)",
  },
  example3: {
    fontSize: ".625rem",
  },
  example4: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  example5: {
    fontSize: "10px",
  },
})
