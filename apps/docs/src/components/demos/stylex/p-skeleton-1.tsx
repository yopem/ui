"use client"

import * as stylex from "@stylexjs/stylex"
import { UserRoundPlusIcon, UsersRoundIcon } from "lucide-react"
import { useEffect, useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Button } from "@/components/ui/stylex/button"
import { Skeleton } from "@/components/ui/stylex/skeleton"

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
      <Avatar {...stylex.props(demoStyles.demo1)}>
        <AvatarImage alt={user.name} src={user.image} />
        <AvatarFallback>{user.fallback}</AvatarFallback>
      </Avatar>
      <div {...stylex.props(demoStyles.demo2)}>
        <h4 {...stylex.props(demoStyles.demo3)}>{user.name}</h4>
        <div {...stylex.props(demoStyles.demo4)}>
          <span {...stylex.props(demoStyles.demo5)}>{user.role}</span>
          <div {...stylex.props(demoStyles.demo6)}>
            <UsersRoundIcon {...stylex.props(demoStyles.demo7)} />
            <span {...stylex.props(demoStyles.demo5)}>
              {user.followers}
              <span {...stylex.props(demoStyles.demo8)}> followers</span>
            </span>
          </div>
        </div>
      </div>
      <Button size="xs">
        <UserRoundPlusIcon />
        Follow
      </Button>
    </>
  )
}

function UserCardSkeleton() {
  return (
    <>
      <Skeleton {...stylex.props(demoStyles.demo9)} />
      <div {...stylex.props(demoStyles.demo10)}>
        <Skeleton {...stylex.props(demoStyles.demo11)} />
        <div {...stylex.props(demoStyles.demo12)}>
          <Skeleton {...stylex.props(demoStyles.demo13)} />
          <Skeleton {...stylex.props(demoStyles.demo13)} />
        </div>
      </div>
      <Skeleton {...stylex.props(demoStyles.demo14)} />
    </>
  )
}

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo15)}>
      {users.map((user) => (
        <div {...stylex.props(demoStyles.demo16)} key={user.fallback}>
          <UserCard delay={user.delay} user={user} />
        </div>
      ))}
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
  },
  demo2: {
    display: "flex",
    minInlineSize: "0px",
    flex: "1",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo3: {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: "1",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  demo4: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo5: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  demo6: {
    display: "flex",
    minInlineSize: "0px",
    alignItems: "center",
    gap: "0.25rem",
  },
  demo7: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
    flexShrink: "0",
  },
  demo8: {
    display: {
      default: null,
      "@media (max-width: 39.999rem)": "none",
    },
  },
  demo9: {
    inlineSize: "calc(0.25rem * 10)",
    blockSize: "calc(0.25rem * 10)",
    borderRadius: "calc(infinity * 1px)",
  },
  demo10: {
    display: "flex",
    flex: "1",
    flexDirection: "column",
  },
  demo11: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    maxInlineSize: "calc(0.25rem * 54)",
  },
  demo12: {
    display: "flex",
    maxInlineSize: "calc(0.25rem * 54)",
    alignItems: "center",
    gap: "0.25rem",
  },
  demo13: {
    marginBlock: "calc(0.25rem * 0.5)",
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  demo14: {
    blockSize: {
      default: "calc(0.25rem * 7)",
      "@media (min-width: 40rem)": "calc(0.25rem * 6)",
    },
    inlineSize: {
      default: "calc(0.25rem * 19)",
      "@media (min-width: 40rem)": "calc(0.25rem * 17)",
    },
  },
  demo15: {
    display: "flex",
    inlineSize: "100%",
    maxInlineSize: "calc(0.25rem * 92)",
    flexDirection: "column",
    gap: "calc(0.25rem * 6)",
  },
  demo16: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
})
