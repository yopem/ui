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
import { Button, buttonVariants } from "@/components/ui/stylex/button"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
} from "@/components/ui/stylex/combobox"
import { Group, GroupSeparator, GroupText } from "@/components/ui/stylex/group"

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
    <Avatar {...stylex.props(demoStyles.avatar)}>
      {avatarUrl ? <AvatarImage alt={name} src={avatarUrl} /> : null}
      <AvatarFallback {...stylex.props(demoStyles.demo1)}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

export default function Particle() {
  const [selectedMembers, setSelectedMembers] = useState<FilterOption[]>(
    members.slice(0, 2),
  )

  const renderTriggerContent = () => {
    if (selectedMembers.length === 0) return "Select"
    const firstMember = selectedMembers[0]
    const remainingCount = selectedMembers.length - 1

    return (
      <div {...stylex.props(demoStyles.demo2)}>
        <MemberAvatar
          avatarUrl={firstMember?.avatar}
          name={firstMember?.label ?? ""}
        />
        <span {...stylex.props(demoStyles.demo3)}>{firstMember?.label}</span>
        {remainingCount > 0 && (
          <Badge {...stylex.props(demoStyles.demo4)} variant="secondary">
            +{remainingCount}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Group>
      <GroupText
        className={buttonVariants({
          size: "sm",
          variant: "outline",
        })}
        {...stylex.props(demoStyles.groupText)}
      >
        <FunnelIcon />
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
              {...stylex.props(
                selectedMembers.length === 0 && demoStyles.emptyTrigger,
              )}
              size="sm"
              variant="outline"
            />
          }
        >
          {renderTriggerContent()}
          {selectedMembers.length === 0 && (
            <ChevronsUpDownIcon {...stylex.props(demoStyles.demo5)} />
          )}
        </ComboboxTrigger>
        <ComboboxPopup aria-label="Select member">
          <div {...stylex.props(demoStyles.demo6)}>
            <ComboboxInput
              {...stylex.props(demoStyles.demo7)}
              placeholder="Search members..."
              showTrigger={false}
              startAddon={<SearchIcon />}
            />
          </div>
          <ComboboxEmpty>No members found.</ComboboxEmpty>
          <ComboboxList>
            {(option: FilterOption) => (
              <ComboboxItem key={option.id} value={option}>
                <div {...stylex.props(demoStyles.demo2)}>
                  <MemberAvatar avatarUrl={option.avatar} name={option.label} />
                  <span>{option.label}</span>
                </div>
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
      >
        <XIcon />
      </Button>
    </Group>
  )
}

const demoStyles = stylex.create({
  avatar: { blockSize: "1.25rem", inlineSize: "1.25rem" },
  groupText: { color: "var(--foreground)", pointerEvents: "none" },
  emptyTrigger: {
    justifyContent: "space-between",
  },
  demo1: {
    fontSize: "0.5rem",
  },
  demo2: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo3: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  demo4: {
    fontVariantNumeric: "   tabular-nums ",
  },
  demo5: {
    marginInlineEnd: "calc(0.25rem * -1)",
  },
  demo6: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    padding: "calc(0.25rem * 2)",
  },
  demo7: {
    borderRadius: "calc(var(--radius) - 2px)",
    "::before": {
      content: '""',
      borderRadius: "calc(calc(var(--radius) - 2px) - 1px)",
    },
  },
})
