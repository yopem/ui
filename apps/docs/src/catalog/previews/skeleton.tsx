"use client"

import * as stylex from "@stylexjs/stylex"
import { UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Heading } from "@/components/ui/heading"
import { Skeleton } from "@/components/ui/skeleton"
const users = [
  {
    delay: 3000,
    fallback: "SJ",
    followers: "15k",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&dpr=2&q=80",
    name: "Sarah Johnson",
    role: "Design Engineer",
  },
  {
    delay: 4000,
    fallback: "MA",
    followers: "8k",
    image:
      "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=80&h=80&dpr=2&q=80",
    name: "Mark Bennett Andersson",
    role: "Product Designer",
  },
  {
    delay: 3400,
    fallback: "AR",
    followers: "12k",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&dpr=2&q=80",
    name: "Alex Rivera",
    role: "UI/UX Designer",
  },
]

function UserCard({ delay, user }: { delay: number; user: (typeof users)[0] }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isLoaded) {
    return <UserCardSkeleton />
  }

  return (
    <>
      <Avatar {...stylex.props(previewStyles.preview1)}>
        <AvatarImage alt={user.name} src={user.image} />
        <AvatarFallback>{user.fallback}</AvatarFallback>
      </Avatar>
      <Flex {...stylex.props(previewStyles.preview2)}>
        <Heading as="h4" {...stylex.props(previewStyles.preview3)}>
          {user.name}
        </Heading>
        <Flex {...stylex.props(previewStyles.preview4)}>
          <Box as="span" {...stylex.props(previewStyles.preview5)}>
            {user.role}
          </Box>
          <Flex {...stylex.props(previewStyles.preview6)}>
            <UsersRoundIcon {...stylex.props(previewStyles.preview7)} />
            <Box as="span" {...stylex.props(previewStyles.preview5)}>
              {user.followers}
              <Box as="span" {...stylex.props(previewStyles.preview8)}>
                {" "}
                followers
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>
      <Button size="xs">
        <UserRoundPlusIcon {...stylex.props(previewStyles.icon)} />
        Follow
      </Button>
    </>
  )
}

function UserCardSkeleton() {
  return (
    <>
      <Skeleton {...stylex.props(previewStyles.preview9)} />
      <Flex {...stylex.props(previewStyles.preview10)}>
        <Skeleton {...stylex.props(previewStyles.preview11)} />
        <Flex {...stylex.props(previewStyles.preview12)}>
          <Skeleton {...stylex.props(previewStyles.preview13)} />
          <Skeleton {...stylex.props(previewStyles.preview13)} />
        </Flex>
      </Flex>
      <Skeleton {...stylex.props(previewStyles.preview14)} />
    </>
  )
}

export function Preview() {
  return (
    <Flex {...stylex.props(previewStyles.preview15)}>
      {users.map((user) => (
        <Flex {...stylex.props(previewStyles.preview16)} key={user.fallback}>
          <UserCard delay={user.delay} user={user} />
        </Flex>
      ))}
    </Flex>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  preview1: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
  },
  preview2: {
    display: "flex",
    minInlineSize: "0px",
    flex: "1",
    flexDirection: "column",
    gap: "0.25rem",
  },
  preview3: {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: "1",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  preview4: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  preview5: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  preview6: {
    display: "flex",
    minInlineSize: "0px",
    alignItems: "center",
    gap: "0.25rem",
  },
  preview7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
    flexShrink: "0",
  },
  preview8: {
    display: {
      default: null,
      "@media (max-width: 39.999rem)": "none",
    },
  },
  preview9: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  preview10: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
  },
  preview11: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  preview12: {
    display: "flex",
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  preview13: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  preview14: {
    blockSize: {
      default: "calc(0.25rem * 7)",
      "@media (min-width: 40rem)": "calc(0.25rem * 6)",
    },
    inlineSize: {
      default: "calc(0.25rem * 19)",
      "@media (min-width: 40rem)": "calc(0.25rem * 17)",
    },
  },
  preview15: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
  preview16: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
})
