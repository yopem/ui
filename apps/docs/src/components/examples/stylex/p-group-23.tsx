"use client"

import * as stylex from "@stylexjs/stylex"
import { ChevronsUpDownIcon, FunnelIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Badge } from "@/components/ui/stylex/badge"
import { Box } from "@/components/ui/stylex/box"
import { Button } from "@/components/ui/stylex/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
} from "@/components/ui/stylex/combobox"
import { Flex } from "@/components/ui/stylex/flex"
import {
  Group,
  GroupSeparator,
  GroupText,
  groupItemStyles,
} from "@/components/ui/stylex/group"
interface FilterOption {
  id: string
  label: string
  avatar?: string
}

const members: FilterOption[] = [
  {
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces",
    id: "alex-chen",
    label: "Alex Chen",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces",
    id: "sarah-johnson",
    label: "Sarah Johnson",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces",
    id: "marcus-williams",
    label: "Marcus Williams",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=faces",
    id: "emma-davis",
    label: "Emma Davis",
  },
  {
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=faces",
    id: "james-miller",
    label: "James Miller",
  },
]

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() ?? ""
  }
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts[parts.length - 1]?.charAt(0) ?? ""
  return (first + last).toUpperCase()
}

function MemberAvatar({
  name,
  avatarUrl,
}: {
  name: string
  avatarUrl?: string
}) {
  return (
    <Avatar xstyle={exampleStyles.avatar}>
      {avatarUrl ? <AvatarImage alt={name} src={avatarUrl} /> : null}
      <AvatarFallback xstyle={exampleStyles.example1}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export default function Example() {
  const [selectedMembers, setSelectedMembers] = useState<FilterOption[]>(() =>
    members.slice(0, 2),
  )

  const renderTriggerContent = () => {
    if (selectedMembers.length === 0) return "Select"
    const firstMember = selectedMembers[0]
    const remainingCount = selectedMembers.length - 1

    return (
      <Flex {...stylex.props(exampleStyles.example2)}>
        <MemberAvatar
          avatarUrl={firstMember?.avatar}
          name={firstMember?.label ?? ""}
        />
        <Box as="span" {...stylex.props(exampleStyles.example3)}>
          {firstMember?.label}
        </Box>
        {remainingCount > 0 && (
          <Badge variant="secondary" xstyle={exampleStyles.example4}>
            +{remainingCount}
          </Badge>
        )}
      </Flex>
    )
  }

  return (
    <Group>
      <GroupText xstyle={exampleStyles.groupText}>
        <FunnelIcon {...stylex.props(exampleStyles.icon)} />
        Member
      </GroupText>
      <GroupSeparator />
      <Combobox
        autoHighlight
        items={members}
        multiple
        onValueChange={(value) => {
          if (Array.isArray(value)) {
            setSelectedMembers(value)
          }
        }}
        value={selectedMembers}
      >
        <ComboboxTrigger
          render={
            <Button
              size="sm"
              variant="outline"
              xstyle={[
                groupItemStyles.item,
                selectedMembers.length === 0 && exampleStyles.emptyTrigger,
              ]}
            />
          }
        >
          {renderTriggerContent()}
          {selectedMembers.length === 0 && (
            <ChevronsUpDownIcon
              {...stylex.props(exampleStyles.icon, exampleStyles.example5)}
            />
          )}
        </ComboboxTrigger>
        <ComboboxPopup aria-label="Select member">
          <Box {...stylex.props(exampleStyles.example6)}>
            <ComboboxInput
              placeholder="Search members..."
              showTrigger={false}
              startAddon={<SearchIcon {...stylex.props(exampleStyles.icon)} />}
              xstyle={exampleStyles.example7}
            />
          </Box>
          <ComboboxEmpty>No members found.</ComboboxEmpty>
          <ComboboxList>
            {(option: FilterOption) => (
              <ComboboxItem key={option.id} value={option}>
                <Flex {...stylex.props(exampleStyles.example2)}>
                  <MemberAvatar avatarUrl={option.avatar} name={option.label} />
                  <Box as="span">{option.label}</Box>
                </Flex>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxPopup>
      </Combobox>
      <GroupSeparator />
      <Button
        aria-label="Remove filter"
        onClick={() => setSelectedMembers([])}
        size="icon-sm"
        variant="outline"
        xstyle={groupItemStyles.item}
      >
        <XIcon {...stylex.props(exampleStyles.icon)} />
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
  avatar: { blockSize: "1.25rem", inlineSize: "1.25rem" },
  groupText: {
    color: "var(--foreground)",
    pointerEvents: "none",
    blockSize: { default: "2rem", "@media (min-width: 640px)": "1.75rem" },
    gap: "0.375rem",
    paddingInline: "calc(0.625rem - 1px)",
  },
  emptyTrigger: {
    justifyContent: "space-between",
  },
  example1: {
    fontSize: "0.5rem",
  },
  example2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example3: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  example4: {
    fontVariantNumeric: "   tabular-nums ",
  },
  example5: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
  example6: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    padding: "calc(0.25rem * 2)",
  },
  example7: {
    borderRadius: "calc(var(--radius) - 2px)",
    "::before": {
      content: '""',
      borderRadius: "calc(calc(var(--radius) - 2px) - 1px)",
    },
  },
})
