"use client"

import { Box } from "@registry/components/ui/box"
import { Button } from "@registry/components/ui/button"
import {
  Command,
  CommandCollection,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "@registry/components/ui/command"
import { Flex } from "@registry/components/ui/flex"
import { Kbd, KbdGroup } from "@registry/components/ui/kbd"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { ArrowDownIcon, ArrowUpIcon, CornerDownLeftIcon } from "lucide-react"
import { Fragment, useRef, useState } from "react"

const styles = stylex.create({
  span: { flex: "1" },
  flex: { alignItems: "center", gap: "calc(0.25rem * 4)" },
  flex2: { alignItems: "center", gap: "calc(0.25rem * 2)" },
  flex3: { alignItems: "center", gap: "calc(0.25rem * 2)" },
  flex4: { alignItems: "center", gap: "calc(0.25rem * 2)" },
})

export interface Item {
  value: string
  label: string
  shortcut?: string
}

export interface Group {
  value: string
  items: Item[]
}

const suggestions: Item[] = [
  { label: "Linear", shortcut: "⌘L", value: "linear" },
  { label: "Figma", shortcut: "⌘F", value: "figma" },
  { label: "Slack", shortcut: "⌘S", value: "slack" },
  { label: "YouTube", shortcut: "⌘Y", value: "youtube" },
  { label: "Raycast", shortcut: "⌘R", value: "raycast" },
]

const commands: Item[] = [
  { label: "Clipboard History", shortcut: "⌘⇧C", value: "clipboard-history" },
  { label: "Import Extension", shortcut: "⌘I", value: "import-extension" },
  { label: "Create Snippet", shortcut: "⌘N", value: "create-snippet" },
  { label: "System Preferences", shortcut: "⌘,", value: "system-preferences" },
  { label: "Window Management", shortcut: "⌘⇧W", value: "window-management" },
]

const groupedItems: Group[] = [
  { items: suggestions, value: "Suggestions" },
  { items: commands, value: "Commands" },
]

export function Preview() {
  const hydrated = useHydrated()
  const [open, setOpen] = useState(false)

  const handleItemClick = useEventCallback(function () {
    setOpen(false)
  })

  const shortcutCleanupRef = useRef<(() => void) | null>(null)

  const registerTrigger = useEventCallback(function (
    node: HTMLButtonElement | null,
  ) {
    shortcutCleanupRef.current?.()
    shortcutCleanupRef.current = null

    if (!node) return

    function handleShortcut(event: KeyboardEvent) {
      if (event.key === "j" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", handleShortcut)
    shortcutCleanupRef.current = () =>
      document.removeEventListener("keydown", handleShortcut)
  })

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandDialogTrigger
        disabled={!hydrated}
        ref={registerTrigger}
        render={<Button variant="outline" />}
      >
        Open Command Palette
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>J</Kbd>
        </KbdGroup>
      </CommandDialogTrigger>
      <CommandDialogPopup>
        <Command items={groupedItems}>
          <CommandInput placeholder="Search for apps and commands..." />
          <CommandPanel>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandList>
              {(group: Group, _index: number) => (
                <Fragment key={group.value}>
                  <CommandGroup items={group.items}>
                    <CommandGroupLabel>{group.value}</CommandGroupLabel>
                    <CommandCollection>
                      {(item: Item) => (
                        <CommandItem
                          key={item.value}
                          onClick={handleItemClick}
                          value={item.value}
                        >
                          <Box as="span" xstyle={styles.span}>
                            {item.label}
                          </Box>
                          {item.shortcut && (
                            <CommandShortcut>{item.shortcut}</CommandShortcut>
                          )}
                        </CommandItem>
                      )}
                    </CommandCollection>
                  </CommandGroup>
                  <CommandSeparator />
                </Fragment>
              )}
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <Flex xstyle={styles.flex}>
              <Flex xstyle={styles.flex2}>
                <KbdGroup>
                  <Kbd>
                    <ArrowUpIcon {...stylex.props(previewStyles.icon)} />
                  </Kbd>
                  <Kbd>
                    <ArrowDownIcon {...stylex.props(previewStyles.icon)} />
                  </Kbd>
                </KbdGroup>
                <Box as="span">Navigate</Box>
              </Flex>
              <Flex xstyle={styles.flex3}>
                <Kbd>
                  <CornerDownLeftIcon {...stylex.props(previewStyles.icon)} />
                </Kbd>
                <Box as="span">Open</Box>
              </Flex>
            </Flex>
            <Flex xstyle={styles.flex4}>
              <Kbd>Esc</Kbd>
              <Box as="span">Close</Box>
            </Flex>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  )
}

const previewStyles = stylex.create({
  icon: {
    blockSize: "0.75rem",
    inlineSize: "0.75rem",
    flexShrink: 0,
    pointerEvents: "none",
  },
})
