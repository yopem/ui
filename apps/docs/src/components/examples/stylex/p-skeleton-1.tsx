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
      <Avatar {...stylex.props(exampleStyles.example1)}>
        <AvatarImage alt={user.name} src={user.image} />
        <AvatarFallback>{user.fallback}</AvatarFallback>
      </Avatar>
      <Flex {...stylex.props(exampleStyles.example2)}>
        <Heading as="h4" {...stylex.props(exampleStyles.example3)}>
          {user.name}
        </Heading>
        <Flex {...stylex.props(exampleStyles.example4)}>
          <Box as="span" {...stylex.props(exampleStyles.example5)}>
            {user.role}
          </Box>
          <Flex {...stylex.props(exampleStyles.example6)}>
            <UsersRoundIcon {...stylex.props(exampleStyles.example7)} />
            <Box as="span" {...stylex.props(exampleStyles.example5)}>
              {user.followers}
              <Box as="span" {...stylex.props(exampleStyles.example8)}>
                {" "}
                followers
              </Box>
            </Box>
          </Flex>
        </Flex>
      </Flex>
      <Button size="xs">
        <UserRoundPlusIcon {...stylex.props(exampleStyles.icon)} />
        Follow
      </Button>
    </>
  )
}

function UserCardSkeleton() {
  return (
    <>
      <Skeleton {...stylex.props(exampleStyles.example9)} />
      <Flex {...stylex.props(exampleStyles.example10)}>
        <Skeleton {...stylex.props(exampleStyles.example11)} />
        <Flex {...stylex.props(exampleStyles.example12)}>
          <Skeleton {...stylex.props(exampleStyles.example13)} />
          <Skeleton {...stylex.props(exampleStyles.example13)} />
        </Flex>
      </Flex>
      <Skeleton {...stylex.props(exampleStyles.example14)} />
    </>
  )
}

export default function Example() {
  return (
    <Flex {...stylex.props(exampleStyles.example15)}>
      {users.map((user) => (
        <Flex {...stylex.props(exampleStyles.example16)} key={user.fallback}>
          <UserCard delay={user.delay} user={user} />
        </Flex>
      ))}
    </Flex>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
  },
  example2: {
    display: "flex",
    minInlineSize: "0px",
    flex: "1",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: "1",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  example5: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  example6: {
    display: "flex",
    minInlineSize: "0px",
    alignItems: "center",
    gap: "0.25rem",
  },
  example7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
    flexShrink: "0",
  },
  example8: {
    display: {
      default: null,
      "@media (max-width: 39.999rem)": "none",
    },
  },
  example9: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  example10: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
  },
  example11: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  example12: {
    display: "flex",
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  example13: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  example14: {
    blockSize: {
      default: "calc(0.25rem * 7)",
      "@media (min-width: 40rem)": "calc(0.25rem * 6)",
    },
    inlineSize: {
      default: "calc(0.25rem * 19)",
      "@media (min-width: 40rem)": "calc(0.25rem * 17)",
    },
  },
  example15: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
  example16: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
})
