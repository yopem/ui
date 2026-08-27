"use client"

import * as stylex from "@stylexjs/stylex"
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  CircleQuestionMarkIcon,
  CornerDownLeftIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"
// next/link replaced -> anchor
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { useAutocompleteFilter } from "@/components/ui/stylex/autocomplete"
import { Button } from "@/components/ui/stylex/button"
import {
  Command,
  CommandCollection,
  CommandCreateHandle,
  CommandDialog,
  CommandDialogPopup,
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
} from "@/components/ui/stylex/command"
import { EmptyMedia } from "@/components/ui/stylex/empty"
import { Input } from "@/components/ui/stylex/input"
import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"
import { ScrollArea } from "@/components/ui/stylex/scroll-area"
import { Skeleton } from "@/components/ui/stylex/skeleton"
import { Spinner } from "@/components/ui/stylex/spinner"

interface Item {
  value: string
  label: string
  shortcut?: string
  keywords?: string[]
}

interface Group {
  value: string
  items: Item[]
}

const commandGroups: Group[] = [
  {
    items: [
      {
        keywords: ["dash"],
        label: "Dashboard",
        shortcut: "d",
        value: "dashboard",
      },
      {
        keywords: ["proj"],
        label: "Projects",
        shortcut: "p",
        value: "projects",
      },
      { keywords: ["team"], label: "Team", shortcut: "t", value: "team" },
    ],
    value: "Pages",
  },
  {
    items: [
      {
        keywords: ["prof"],
        label: "Profile",
        shortcut: "p s",
        value: "profile",
      },
      {
        keywords: ["acc"],
        label: "Account",
        shortcut: "a s",
        value: "account",
      },
      {
        keywords: ["pref"],
        label: "Preferences",
        shortcut: "p r",
        value: "preferences",
      },
    ],
    value: "Settings",
  },
  {
    items: [
      {
        keywords: ["docs"],
        label: "Documentation",
        shortcut: "d o",
        value: "docs",
      },
      {
        keywords: ["sup"],
        label: "Support",
        shortcut: "s u",
        value: "support",
      },
      {
        keywords: ["feed"],
        label: "Feedback",
        shortcut: "f b",
        value: "feedback",
      },
    ],
    value: "Help",
  },
]

const MOCK_AI_RESPONSE = `To create a new project, navigate to the Projects page and click the "New Project" button in the top right corner. You'll be prompted to enter a project name and description.

Once created, you can invite team members by clicking the "Share" button and entering their email addresses. Team members will receive an invitation link via email or you can add them manually by clicking the "Add Team Member" button in the project settings.

You can customize project settings at any time by clicking the settings icon in the project header. For more information, see the Project Settings documentation.`

const MOCK_REFERENCE_LINKS = [
  { title: "Creating Projects", url: "/docs/projects/create" },
  { title: "Team Collaboration", url: "/docs/team/collaborate" },
  { title: "Project Settings", url: "/docs/projects/settings" },
]

export const commandHandle: ReturnType<typeof CommandCreateHandle> =
  CommandCreateHandle()

interface AIState {
  mode: boolean
  query: string
  submittedQuery: string
  response: string
  referenceLinks: { title: string; url: string }[]
  isGenerating: boolean
  error: string | null
}

const initialAIState: AIState = {
  error: null,
  isGenerating: false,
  mode: false,
  query: "",
  referenceLinks: [],
  response: "",
  submittedQuery: "",
}

function markdownToSafeHTML(markdown: string): string {
  // Simple markdown to HTML converter for demo purposes
  return markdown
    .split("\n\n")
    .map(
      (para) =>
        `<p class="${stylex.props(demoStyles.responseParagraph).className}">${para}</p>`,
    )
    .join("")
}

export default function PCommand2() {
  const [open, setOpen] = useState(false)
  const [aiState, setAIState] = useState<AIState>(initialAIState)
  const [searchQuery, setSearchQuery] = useState("")
  const aiInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [commandResetKey, setCommandResetKey] = useState(0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const resetAIState = useCallback(() => {
    abortControllerRef.current?.abort()
    setAIState(initialAIState)
  }, [])

  const handleItemClick = useCallback(() => {
    setOpen(false)
  }, [])

  const handleBackToSearch = useCallback(() => {
    resetAIState()
    setSearchQuery("")
    setCommandResetKey((k) => k + 1)
    searchInputRef.current?.focus()
  }, [resetAIState])

  const handleGenerateAI = useCallback(
    async (queryOverride?: string) => {
      const query = queryOverride || aiState.query
      if (!query.trim()) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      setAIState((prev) => ({
        ...prev,
        error: null,
        isGenerating: true,
        query: "",
        referenceLinks: [],
        response: "",
        submittedQuery: query,
      }))

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(resolve, 1500)
          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout)
            reject(new Error("aborted"))
          })
        })

        if (controller.signal.aborted) return

        setAIState((prev) => ({
          ...prev,
          isGenerating: false,
          referenceLinks: MOCK_REFERENCE_LINKS,
          response: MOCK_AI_RESPONSE,
        }))
      } catch (error) {
        if (error instanceof Error && error.message === "aborted") {
          return
        }

        if (controller.signal.aborted) return

        setAIState((prev) => ({
          ...prev,
          error: "Failed to generate response. Please try again.",
          isGenerating: false,
        }))
      }
    },
    [aiState.query],
  )

  const handleAskAI = useCallback(() => {
    const currentQuery = searchQuery
    setSearchQuery("")

    if (currentQuery.trim()) {
      setAIState((prev) => ({ ...prev, mode: true }))
      handleGenerateAI(currentQuery)
    } else {
      setAIState((prev) => ({ ...prev, mode: true, query: "" }))
      aiInputRef.current?.focus()
    }
  }, [searchQuery, handleGenerateAI])

  const { contains } = useAutocompleteFilter({ sensitivity: "base" })

  const filterItem = useCallback(
    (itemValue: unknown, query: string): boolean => {
      if (typeof itemValue !== "object" || itemValue === null) {
        return false
      }

      const item = itemValue as Item

      if (contains(item.label, query)) {
        return true
      }

      if (contains(item.value, query)) {
        return true
      }

      if (item.keywords?.some((keyword) => contains(keyword, query))) {
        return true
      }

      return false
    },
    [contains],
  )

  useEffect(() => {
    if (!open || !aiState.mode) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        handleBackToSearch()
      }
    }

    document.addEventListener("keydown", handleEscape, true)
    return () => document.removeEventListener("keydown", handleEscape, true)
  }, [open, aiState.mode, handleBackToSearch])

  useEffect(() => {
    if (aiState.mode && !aiState.isGenerating) {
      aiInputRef.current?.focus()
    }
  }, [aiState.mode, aiState.isGenerating])

  const hasResults = useMemo(
    () =>
      !searchQuery.trim() ||
      commandGroups.some((group) =>
        group.items.some((item) => filterItem(item, searchQuery)),
      ),
    [searchQuery, filterItem],
  )

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setOpen(newOpen)
      if (!newOpen) {
        setSearchQuery("")
        resetAIState()
      }
    },
    [resetAIState],
  )

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        Cmdk with AI
      </Button>
      <CommandDialog
        handle={commandHandle}
        onOpenChange={handleOpenChange}
        open={open}
      >
        <CommandDialogPopup>
          {!aiState.mode ? (
            <Command
              filter={filterItem}
              items={commandGroups}
              key={commandResetKey}
            >
              <div {...stylex.props(demoStyles.report1)}>
                <CommandInput
                  {...stylex.props(demoStyles.commandInput)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Tab") {
                      e.preventDefault()
                      handleAskAI()
                    }
                    if (
                      e.key === "Enter" &&
                      !hasResults &&
                      searchQuery.trim()
                    ) {
                      e.preventDefault()
                      handleAskAI()
                    }
                  }}
                  placeholder="Type a command or search..."
                  ref={searchInputRef}
                  value={searchQuery}
                />
                <Button
                  {...stylex.props(demoStyles.demo1)}
                  onClick={handleAskAI}
                  size="sm"
                  variant="ghost"
                >
                  <SparklesIcon {...stylex.props(demoStyles.demo2)} />
                  Ask AI
                  <Kbd {...stylex.props(demoStyles.demo3)}>Tab</Kbd>
                </Button>
              </div>
              <CommandPanel>
                <CommandEmpty {...stylex.props(demoStyles.demo4)}>
                  {searchQuery.trim() && (
                    <div {...stylex.props(demoStyles.demo5)}>
                      <EmptyMedia variant="icon">
                        <SearchIcon />
                      </EmptyMedia>
                      <p>No results found.</p>
                      <p>
                        Press <Kbd>Enter</Kbd> to ask AI about:
                        <br />{" "}
                        <strong {...stylex.props(demoStyles.demo6)}>
                          {searchQuery}
                        </strong>
                      </p>
                    </div>
                  )}
                </CommandEmpty>
                <CommandList>
                  {(group: Group) => (
                    <Fragment key={group.value}>
                      <CommandGroup items={group.items}>
                        <CommandGroupLabel>{group.value}</CommandGroupLabel>
                        <CommandCollection>
                          {(item: Item) => (
                            <CommandItem
                              key={item.value}
                              onClick={handleItemClick}
                              value={item}
                            >
                              <span {...stylex.props(demoStyles.demo7)}>
                                {item.label}
                              </span>
                              {item.shortcut && (
                                <CommandShortcut>
                                  {item.shortcut}
                                </CommandShortcut>
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
                {hasResults ? (
                  <>
                    <div {...stylex.props(demoStyles.demo8)}>
                      <div {...stylex.props(demoStyles.demo9)}>
                        <KbdGroup>
                          <Kbd>
                            <ArrowUpIcon />
                          </Kbd>
                          <Kbd>
                            <ArrowDownIcon />
                          </Kbd>
                        </KbdGroup>
                        <span>Navigate</span>
                      </div>
                      <div {...stylex.props(demoStyles.demo9)}>
                        <Kbd>
                          <CornerDownLeftIcon />
                        </Kbd>
                        <span>Open</span>
                      </div>
                    </div>
                    <div {...stylex.props(demoStyles.demo9)}>
                      <Kbd>Esc</Kbd>
                      <span>Close</span>
                    </div>
                  </>
                ) : (
                  <div {...stylex.props(demoStyles.demo10)}>
                    <Kbd>Esc</Kbd>
                    <span>Close</span>
                  </div>
                )}
              </CommandFooter>
            </Command>
          ) : (
            <Command>
              <div {...stylex.props(demoStyles.report2)}>
                <div {...stylex.props(demoStyles.demo11)}>
                  <div {...stylex.props(demoStyles.demo12)}>
                    <div
                      aria-hidden="true"
                      {...stylex.props(demoStyles.report3)}
                      data-slot="autocomplete-start-addon"
                    >
                      <SparklesIcon {...stylex.props(demoStyles.addonIcon)} />
                    </div>
                    <Input
                      aria-label="AI query input"
                      {...stylex.props(demoStyles.report4)}
                      disabled={aiState.isGenerating}
                      onChange={(e) =>
                        setAIState((prev) => ({
                          ...prev,
                          query: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !aiState.isGenerating) {
                          handleGenerateAI()
                        }
                        if (e.key === "Escape") {
                          e.preventDefault()
                          handleBackToSearch()
                        }
                      }}
                      placeholder="Ask AI anything…"
                      ref={aiInputRef}
                      size="lg"
                      value={aiState.query}
                    />
                  </div>
                </div>
                <Button
                  {...stylex.props(demoStyles.demo1)}
                  onClick={handleBackToSearch}
                  size="sm"
                  variant="ghost"
                >
                  <ArrowLeftIcon {...stylex.props(demoStyles.demo2)} />
                  Back to search
                  <Kbd {...stylex.props(demoStyles.demo3)}>Esc</Kbd>
                </Button>
              </div>
              <CommandPanel>
                <ScrollArea overscrollContain scrollbarGutter scrollFade>
                  <div {...stylex.props(demoStyles.demo13)}>
                    {!aiState.isGenerating &&
                      !aiState.response &&
                      !aiState.error && (
                        <div {...stylex.props(demoStyles.demo14)}>
                          <p {...stylex.props(demoStyles.demo15)}>
                            Ask AI anything and press <Kbd>Enter</Kbd> to get
                            started.
                          </p>
                        </div>
                      )}

                    {aiState.error && (
                      <div
                        aria-live="polite"
                        {...stylex.props(demoStyles.demo16)}
                        role="alert"
                      >
                        {aiState.error}
                      </div>
                    )}

                    {aiState.isGenerating && (
                      <div {...stylex.props(demoStyles.demo17)}>
                        <div {...stylex.props(demoStyles.demo18)}>
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo20)} />
                        </div>
                        <div {...stylex.props(demoStyles.demo18)}>
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo21)} />
                        </div>
                        <div {...stylex.props(demoStyles.demo18)}>
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo19)} />
                          <Skeleton {...stylex.props(demoStyles.demo22)} />
                        </div>
                      </div>
                    )}

                    {aiState.response && !aiState.isGenerating && (
                      <>
                        <div
                          aria-live="polite"
                          {...stylex.props(demoStyles.report5)}
                          dangerouslySetInnerHTML={{
                            __html: markdownToSafeHTML(aiState.response),
                          }}
                        />
                        {aiState.referenceLinks.length > 0 && (
                          <div {...stylex.props(demoStyles.demo23)}>
                            {aiState.referenceLinks.map((link, index) => (
                              <Button
                                key={`${link.url}-${index}`}
                                render={
                                  <a aria-label={link.title} href={link.url} />
                                }
                                size="sm"
                                variant="secondary"
                              >
                                {link.title}
                              </Button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </CommandPanel>

              <CommandFooter>
                {aiState.isGenerating ? (
                  <div aria-live="polite" {...stylex.props(demoStyles.demo9)}>
                    <div {...stylex.props(demoStyles.demo24)}>
                      <Spinner {...stylex.props(demoStyles.demo25)} />
                    </div>
                    <span {...stylex.props(demoStyles.report6)}>
                      Generating response…
                    </span>
                  </div>
                ) : aiState.response ? (
                  <div {...stylex.props(demoStyles.demo9)}>
                    <div {...stylex.props(demoStyles.demo24)}>
                      <CircleQuestionMarkIcon
                        {...stylex.props(demoStyles.demo25)}
                      />
                    </div>
                    You asked: <span>&quot;{aiState.submittedQuery}&quot;</span>
                  </div>
                ) : (
                  <div {...stylex.props(demoStyles.demo9)}>
                    <Kbd>
                      <CornerDownLeftIcon />
                    </Kbd>
                    <span>Ask AI</span>
                  </div>
                )}
              </CommandFooter>
            </Command>
          )}
        </CommandDialogPopup>
      </CommandDialog>
    </>
  )
}

const pulse = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.5 },
})

const demoStyles = stylex.create({
  commandInput: {
    flexGrow: 1,
  },
  addonIcon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    marginInline: "-0.125rem",
  },
  responseParagraph: {
    lineHeight: "1.625",
    marginBlockStart: 0,
  },
  demo1: {
    marginInlineEnd: "calc(0.25rem * 2.5)",
    borderRadius: "calc(var(--radius) - 2px)",
    fontSize: {
      default: "0.875rem",
      "@media (min-width: 40rem)": "0.75rem",
    },
    lineHeight: {
      default: "calc(1.25 / 0.875)",
      "@media (min-width: 40rem)": "calc(1 / 0.75)",
    },
    color: {
      default: null,
      ":not(:hover)": "var(--muted-foreground)",
      "@media (hover: none)": "var(--muted-foreground)",
    },
  },
  demo2: {
    inlineSize: {
      default: "calc(0.25rem * 4)",
      "@media (min-width: 40rem)": "calc(0.25rem * 3.5)",
    },
    blockSize: {
      default: "calc(0.25rem * 4)",
      "@media (min-width: 40rem)": "calc(0.25rem * 3.5)",
    },
  },
  demo3: {
    marginInlineStart: "calc(0.25rem * 0.5)",
    marginInlineEnd: "calc(0.25rem * -1.5)",
  },
  demo4: {
    paddingBlock: {
      default: null,
      ":not(:empty)": "calc(0.25rem * 12)",
    },
  },
  demo5: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
    overflowWrap: "break-word",
  },
  demo6: {
    fontWeight: "500",
    color: "var(--foreground)",
  },
  demo7: {
    flex: "1",
  },
  demo8: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
  },
  demo9: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo10: {
    marginInlineStart: "auto",
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  demo11: {
    flexGrow: 1,
    paddingInline: "calc(0.25rem * 2.5)",
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  demo12: {
    position: "relative",
    inlineSize: "100%",
  },
  demo13: {
    padding: "calc(0.25rem * 5)",
  },
  demo14: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "calc(0.25rem * 12)",
  },
  demo15: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo16: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--destructive)",
  },
  demo17: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo18: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  demo19: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "100%",
  },
  demo20: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(1 / 2 * 100%)",
  },
  demo21: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(3 / 4 * 100%)",
  },
  demo22: {
    blockSize: "calc(0.25rem * 4)",
    inlineSize: "calc(3 / 5 * 100%)",
  },
  demo23: {
    marginBlockStart: "calc(0.25rem * 4)",
    display: "flex",
    flexWrap: "wrap",
    gap: "calc(0.25rem * 2)",
  },
  demo24: {
    display: "flex",
    blockSize: "calc(0.25rem * 5)",
    alignItems: "center",
    justifyContent: "center",
  },
  demo25: {
    inlineSize: "calc(0.25rem * 3)",
    blockSize: "calc(0.25rem * 3)",
  },
  report1: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  report2: {
    display: "flex",
    alignItems: "center",
  },
  report3: {
    pointerEvents: "none",
    position: "absolute",
    insetBlock: "0px",
    insetInlineStart: "1px",
    zIndex: "10",
    display: "flex",
    alignItems: "center",
    paddingInlineStart: "calc(calc(0.25rem * 3) - 1px)",
    opacity: "80%",
  },
  report4: {
    borderColor: "transparent",
    backgroundColor: "transparent",
    boxShadow: "0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000",
    "::before": {
      content: '""',
      display: "none",
    },
  },
  report5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  report6: {
    animation: `${pulse} 2s cubic-bezier(.4, 0, .6, 1) infinite`,
  },
})
