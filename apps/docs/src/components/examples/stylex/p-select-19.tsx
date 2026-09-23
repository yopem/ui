"use client"

import * as stylex from "@stylexjs/stylex"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Box } from "@/components/ui/box"
import {
  Select,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
      <SelectTrigger aria-label="Select user">
        <SelectValue>
          {(item) => (
            <Box as="span" {...stylex.props(exampleStyles.example1)}>
              <Avatar {...stylex.props(exampleStyles.example2)}>
                <AvatarImage alt="" src={item.avatar} />
                <AvatarFallback {...stylex.props(exampleStyles.example3)}>
                  {item.initials}
                </AvatarFallback>
              </Avatar>
              <Box as="span" {...stylex.props(exampleStyles.example4)}>
                {item.label}
              </Box>
            </Box>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          <SelectGroupLabel>Impersonate user</SelectGroupLabel>
          {users.map((item) => (
            <SelectItem key={item.value} value={item}>
              <Box as="span" {...stylex.props(exampleStyles.example1)}>
                <Avatar {...stylex.props(exampleStyles.example2)}>
                  <AvatarImage alt="" src={item.avatar} />
                  <AvatarFallback {...stylex.props(exampleStyles.example5)}>
                    {item.initials}
                  </AvatarFallback>
                </Avatar>
                <Box as="span" {...stylex.props(exampleStyles.example4)}>
                  {item.label}
                </Box>
              </Box>
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
