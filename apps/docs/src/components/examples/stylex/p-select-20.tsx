"use client"

import * as stylex from "@stylexjs/stylex"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Box } from "@/components/ui/stylex/box"
import {
  Select,
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
    username: "@jennycodes",
    value: "jenny",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=72&h=72&dpr=2&q=80",
    initials: "PS",
    label: "Paul Smith",
    username: "@paulsmith",
    value: "paul",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1655874819398-c6dfbec68ac7?w=72&h=72&dpr=2&q=80",
    initials: "LW",
    label: "Luna Wyen",
    username: "@wyen.luna",
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
      <SelectTrigger
        {...stylex.props(exampleStyles.example1)}
        aria-label="Select user"
      >
        <SelectValue>
          {(item) => (
            <Box as="span" {...stylex.props(exampleStyles.example2)}>
              <Avatar {...stylex.props(exampleStyles.example3)}>
                <AvatarImage alt={item.label} src={item.avatar} />
                <AvatarFallback>{item.initials}</AvatarFallback>
              </Avatar>
              <Box as="span" {...stylex.props(exampleStyles.example4)}>
                <Box as="span" {...stylex.props(exampleStyles.example5)}>
                  {item.label}
                </Box>
                <Box as="span" {...stylex.props(exampleStyles.example6)}>
                  {item.username}
                </Box>
              </Box>
            </Box>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {users.map((item) => (
          <SelectItem
            {...stylex.props(exampleStyles.example7)}
            key={item.value}
            value={item}
          >
            <Box as="span" {...stylex.props(exampleStyles.example2)}>
              <Avatar {...stylex.props(exampleStyles.example3)}>
                <AvatarImage alt={item.label} src={item.avatar} />
                <AvatarFallback>{item.initials}</AvatarFallback>
              </Avatar>
              <Box as="span" {...stylex.props(exampleStyles.example8)}>
                <Box as="span" {...stylex.props(exampleStyles.example5)}>
                  {item.label}
                </Box>
                <Box as="span" {...stylex.props(exampleStyles.example6)}>
                  {item.username}
                </Box>
              </Box>
            </Box>
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}

const exampleStyles = stylex.create({
  example1: {
    blockSize: "auto",
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  example2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    inlineSize: "calc(0.25rem * 8)",
    blockSize: "calc(0.25rem * 8)",
  },
  example4: {
    display: "flex",
    flexDirection: "column",
    textAlign: "left",
  },
  example5: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: "500",
  },
  example6: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example7: {
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  example8: {
    display: "flex",
    flexDirection: "column",
  },
})
