import type { ReactNode } from "react"

import { Box } from "@registry/components/ui/box"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@registry/components/ui/toggle-group"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { TerminalIcon } from "lucide-react"
import { createContext, useContext, useState } from "react"

const managers = ["Bun", "npm", "pnpm", "Yarn"] as const

type PackageManager = (typeof managers)[number]

const PackageManagerContext = createContext<PackageManager>("Bun")

const PackageManagerSelectionContext = createContext<
  ((manager: PackageManager) => void) | null
>(null)

const managerValues = {
  Bun: ["Bun"],
  npm: ["npm"],
  pnpm: ["pnpm"],
  Yarn: ["Yarn"],
}

export function PackageManagerProvider({ children }: { children: ReactNode }) {
  const [manager, select] = useState<PackageManager>("Bun")

  return (
    <PackageManagerContext value={manager}>
      <PackageManagerSelectionContext value={select}>
        {children}
      </PackageManagerSelectionContext>
    </PackageManagerContext>
  )
}

export function PackageManagerSwitcher() {
  const hydrated = useHydrated()
  const manager = useContext(PackageManagerContext)
  const select = useContext(PackageManagerSelectionContext)

  const handleChange = useEventCallback((values: string[]) => {
    const selected = managers.find((item) => item === values[0])

    if (selected) select?.(selected)
  })

  return (
    <Box xstyle={styles.switcher}>
      <TerminalIcon
        {...stylex.props(styles.icon)}
        data-slot="terminal-icon"
        aria-hidden="true"
      />
      <ToggleGroup
        xstyle={styles.group}
        aria-label="Package manager"
        disabled={!hydrated}
        size="sm"
        value={managerValues[manager]}
        onValueChange={handleChange}
      >
        {managers.map((item) => (
          <ToggleGroupItem
            key={item}
            value={item}
            aria-label={item}
            xstyle={styles.item}
          >
            {item.toLowerCase()}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Box>
  )
}

const commandPattern =
  /^(\s*)(bunx(?:\s+--(?:bun|no-install))?|npx(?:\s+--no-install)?|npm exec(?:\s+--no)?(?:\s+--)?|(?:bun|npm|pnpm|yarn) (?:add|install|i|run)|(?:pnpm|yarn) (?:dlx|exec))(?=\s|$)(.*)$/

export function isPackageManagerCommand(code: string) {
  return code.split("\n").some((line) => commandPattern.test(line))
}

export function convertPackageManagerCommand(
  code: string,
  manager: PackageManager,
) {
  const runner = {
    Bun: "bunx",
    npm: "npx",
    pnpm: "pnpm dlx",
    Yarn: "yarn dlx",
  }[manager]

  const add = {
    Bun: "bun add",
    npm: "npm install",
    pnpm: "pnpm add",
    Yarn: "yarn add",
  }[manager]

  const executable = manager.toLowerCase()

  return code
    .split("\n")
    .map((line) => {
      const match = commandPattern.exec(line)

      if (!match) return line
      const [, indent, source, argumentsText] = match

      if (!source || argumentsText === undefined) return line

      if (source.endsWith(" run"))
        return `${indent}${executable} run${argumentsText}`

      if (/ (?:add|install|i)$/.test(source)) {
        const args = argumentsText.replace(
          /(^|\s)(?:-d|-D|--dev|--save-dev)(?=\s|$)/g,
          (_, space: string) => `${space}${manager === "Bun" ? "-d" : "-D"}`,
        )

        const hasPackages = /(?:^|\s)[^-\s]\S*/.test(args)

        return `${indent}${hasPackages || source.endsWith(" add") ? add : `${executable} install`}${args}`
      }

      if (
        /^(?:pnpm|yarn) exec$|^npm exec --no(?: --)?$| --no-install$/.test(
          source,
        )
      ) {
        const localRunner = {
          Bun: "bunx --no-install",
          npm: "npx --no-install",
          pnpm: "pnpm exec",
          Yarn: "yarn exec",
        }[manager]

        return `${indent}${localRunner}${argumentsText}`
      }

      const selectedRunner =
        manager === "Bun" && /^\s+@yopem-ui\/cli(?=\s|$)/.test(argumentsText)
          ? "bunx --bun"
          : runner

      return `${indent}${selectedRunner}${argumentsText}`
    })
    .join("\n")
}

export function usePackageManagerCommand(code: string) {
  return convertPackageManagerCommand(code, useContext(PackageManagerContext))
}

const styles = stylex.create({
  switcher: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    minInlineSize: 0,
  },
  icon: {
    blockSize: "1rem",
    inlineSize: "1rem",
    flexShrink: 0,
    color: tokens["--muted-foreground"],
  },
  group: { gap: "0.125rem" },
  item: {
    fontFamily: tokens["--font-mono"],
    fontSize: "0.8125rem",
    fontWeight: 400,
    blockSize: "1.75rem",
    minInlineSize: "1.75rem",
    paddingInline: "0.5rem",
    borderRadius: tokens["--radius-sm"],
    borderColor: {
      default: "transparent",
      "[data-pressed]": tokens["--border"],
    },
    backgroundColor: {
      default: "transparent",
      ":hover": tokens["--accent"],
      "[data-pressed]": tokens["--background"],
    },
    color: {
      default: tokens["--muted-foreground"],
      "[data-pressed]": tokens["--foreground"],
    },
  },
})
