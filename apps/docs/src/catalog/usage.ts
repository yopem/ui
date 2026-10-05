// Standalone TSX files use the standard @ alias for src.
const usageSnippetValues = {
  "use-event-callback": `"use client"

import { Button } from "@/components/ui/button"
import { Box } from "@/components/ui/box"
import { VStack } from "@/components/ui/vstack"
import { useEventCallback } from "@/hooks/use-event-callback"
import { useState } from "react"

export function Preview() {
  const [count, setCount] = useState(0)

  const increment = useEventCallback(function () {
    setCount(count + 1)
  })

  return (
    <VStack>
      <Button onClick={increment}>Increment count</Button>
      <Box render={<output />}>Count: {count}</Box>
    </VStack>
  )
}
`,
  "use-media-query": `"use client"

import { Text } from "@/components/ui/text"
import { VStack } from "@/components/ui/vstack"
import { useMediaQuery } from "@/hooks/use-media-query"

export function Preview() {
  const medium = useMediaQuery("md")
  const range = useMediaQuery("sm:max-lg")
  const maximum = useMediaQuery({ max: "md" })
  const raw = useMediaQuery("(min-width: 1280px)")

  return (
    <VStack>
      <Text data-testid="medium-query">Medium viewport: {String(medium)}</Text>
      <Text data-testid="range-query">Small to large: {String(range)}</Text>
      <Text data-testid="maximum-query">Below medium: {String(maximum)}</Text>
      <Text data-testid="raw-query">Raw wide query: {String(raw)}</Text>
    </VStack>
  )
}
`,
  checkmark: `"use client"

import { Text } from "@/components/ui/text"
import { Checkmark } from "@/components/ui/checkmark"

export function Preview() {
  return <Text><Checkmark /> Saved successfully</Text>
}
`,
  clipboard: `"use client"

import { Clipboard } from "@/components/ui/clipboard"

export function Preview() {
  return (
    <>
      <Clipboard value="https://example.com">Copy link</Clipboard>
      <Clipboard aria-label="Unavailable copy" disabled value="not copied">
        Disabled copy
      </Clipboard>
    </>
  )
}
`,
  marquee: `"use client"

import { Box } from "@/components/ui/box"
import { Marquee } from "@/components/ui/marquee"

export function Preview() {
  return <Marquee><Box render={<span />}>Design systems</Box><Box render={<span />}>Accessible components</Box><Box render={<span />}>Reusable source</Box></Marquee>
}
`,
  "native-select": `"use client"

import { NativeSelect } from "@/components/ui/native-select"

export function Preview() {
  return (
    <>
      <label>
        Theme{" "}
        <NativeSelect defaultValue="system">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </NativeSelect>
      </label>
      <label>
        Disabled theme <NativeSelect disabled defaultValue="system">
          <option value="system">System</option>
        </NativeSelect>
      </label>
    </>
  )
}
`,
  rating: `"use client"

import { Rating } from "@/components/ui/rating"

export function Preview() {
  return (
    <>
      <Rating aria-label="Rate this component" defaultValue={3} />
      <Rating aria-label="Disabled rating" defaultValue={2} disabled />
    </>
  )
}
`,
  stat: `"use client"

import { Stat, StatDescription, StatLabel, StatValue } from "@/components/ui/stat"

export function Preview() {
  return <Stat><StatLabel>Requests</StatLabel><StatValue>1,248</StatValue><StatDescription>Last 30 days</StatDescription></Stat>
}
`,
  steps: `"use client"

import { Steps, StepsItem } from "@/components/ui/steps"

export function Preview() {
  return <Steps><StepsItem status="completed">Account</StepsItem><StepsItem status="current">Preferences</StepsItem><StepsItem>Finish</StepsItem></Steps>
}
`,
  "absolute-center": `"use client"

import { Box } from "@/components/ui/box"
import { AbsoluteCenter } from "@/components/ui/absolute-center"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ area: { position: "relative", minBlockSize: "8rem", borderWidth: 1, borderStyle: "solid" } })

export function Preview() {
  return <Box xstyle={styles.area}><AbsoluteCenter>Centered</AbsoluteCenter></Box>
}
`,
  bleed: `"use client"

import { Box } from "@/components/ui/box"
import { Bleed } from "@/components/ui/bleed"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ area: { paddingInline: "2rem" } })

export function Preview() {
  return <Box xstyle={styles.area}><Bleed>Full-width content in a padded section</Bleed></Box>
}
`,
  blockquote: `"use client"

import { Blockquote } from "@/components/ui/blockquote"

export function Preview() {
  return <Blockquote cite="https://example.com">Good design is as little design as possible.</Blockquote>
}
`,
  codeblock: `"use client"

import { Codeblock } from "@/components/ui/codeblock"

export function Preview() {
  return <Codeblock>{"const answer = 42"}</Codeblock>
}
`,
  em: `"use client"

import { Text } from "@/components/ui/text"
import { Em } from "@/components/ui/em"

export function Preview() {
  return <Text>We <Em>do</Em> care about the details.</Text>
}
`,
  float: `"use client"

import { Box } from "@/components/ui/box"
import { Float } from "@/components/ui/float"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ area: { position: "relative", minBlockSize: "8rem", padding: "2rem" } })

export function Preview() {
  return <Box xstyle={styles.area}>Notification card<Float>New</Float></Box>
}
`,
  highlight: `"use client"

import { Highlight } from "@/components/ui/highlight"

export function Preview() {
  return <Highlight query="accessible">Build accessible components for everyone.</Highlight>
}
`,
  mark: `"use client"

import { Text } from "@/components/ui/text"
import { Mark } from "@/components/ui/mark"

export function Preview() {
  return <Text>Remember to <Mark>save your work</Mark>.</Text>
}
`,
  prose: `"use client"

import { Text } from "@/components/ui/text"
import { Heading } from "@/components/ui/heading"
import { Prose } from "@/components/ui/prose"

export function Preview() {
  return <Prose><Heading render={<h2 />}>Readable content</Heading><Text>Give long-form content room to breathe.</Text></Prose>
}
`,
  wrap: `"use client"

import { Box } from "@/components/ui/box"
import { Wrap } from "@/components/ui/wrap"

export function Preview() {
  return <Wrap><Box render={<span />}>Design</Box><Box render={<span />}>Development</Box><Box render={<span />}>Accessibility</Box><Box render={<span />}>Documentation</Box></Wrap>
}
`,
  accordion: `"use client"

import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function Preview() {
  return (
    <Accordion defaultValue={["shipping"]}>
      <AccordionItem value="shipping">
        <AccordionTrigger>When will my order arrive?</AccordionTrigger>
        <AccordionPanel>
          Orders arrive within five business days.
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}
`,
  alert: `"use client"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export function Preview() {
  return (
    <Alert>
      <AlertTitle>Backup complete</AlertTitle>
      <AlertDescription>Your files are ready to download.</AlertDescription>
    </Alert>
  )
}
`,
  "alert-dialog": `"use client"

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function Preview() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>
        Read notice
      </AlertDialogTrigger>
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Scheduled maintenance</AlertDialogTitle>
          <AlertDialogDescription>
            Service will pause tonight at midnight.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose render={<Button />}>Understood</AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
`,
  autocomplete: `"use client"

import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
} from "@/components/ui/autocomplete"

export function Preview() {
  const items = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ]

  return (
    <Autocomplete items={items}>
      <AutocompleteInput aria-label="Fruit" placeholder="Choose a fruit" />
      <AutocompletePopup>
        <AutocompleteEmpty>No fruit found.</AutocompleteEmpty>
        <AutocompleteList>
          {(item) => (
            <AutocompleteItem key={item.value} value={item}>
              {item.label}
            </AutocompleteItem>
          )}
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  )
}
`,
  avatar: `"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

export function Preview() {
  return (
    <Avatar>
      <AvatarImage src="/avatar.jpg" alt="Alex Rivera" />
      <AvatarFallback aria-label="Alex Rivera">AR</AvatarFallback>
    </Avatar>
  )
}
`,
  badge: `"use client"

import { Badge } from "@/components/ui/badge"

export function Preview() {
  return <Badge>Published</Badge>
}
`,
  breadcrumb: `"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function Preview() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<a href="/" />}>Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Settings</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
`,
  button: `"use client"

import { Button } from "@/components/ui/button"

export function Preview() {
  return (
    <Button type="button" onClick={() => window.alert("Hello!")}>
      Say hello
    </Button>
  )
}
`,
  calendar: `"use client"

import { Calendar } from "@/components/ui/calendar"
import { useState } from "react"

export function Preview() {
  const [date, setDate] = useState<Date | undefined>()

  return <Calendar mode="single" selected={date} onSelect={setDate} />
}
`,
  card: `"use client"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card"

export function Preview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Starter plan</CardTitle>
        <CardDescription>For personal projects.</CardDescription>
      </CardHeader>
      <CardPanel>Includes three projects and 1 GB of storage.</CardPanel>
      <CardFooter>No credit card required.</CardFooter>
    </Card>
  )
}
`,
  checkbox: `"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function Preview() {
  return (
    <Label>
      <Checkbox name="terms" />
      Accept terms and conditions
    </Label>
  )
}
`,
  "checkbox-group": `"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { CheckboxGroup } from "@/components/ui/checkbox-group"
import { Label } from "@/components/ui/label"

export function Preview() {
  return (
    <CheckboxGroup aria-label="Email topics" defaultValue={["releases"]}>
      <Label>
        <Checkbox value="releases" /> Product releases
      </Label>
      <Label>
        <Checkbox value="events" /> Events
      </Label>
    </CheckboxGroup>
  )
}
`,
  collapsible: `"use client"

import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function Preview() {
  return (
    <Collapsible>
      <CollapsibleTrigger>Show shipping details</CollapsibleTrigger>
      <CollapsiblePanel>Free shipping on orders over $50.</CollapsiblePanel>
    </Collapsible>
  )
}
`,
  combobox: `"use client"

import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from "@/components/ui/combobox"

export function Preview() {
  const items = [
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ]

  return (
    <Combobox items={items}>
      <ComboboxInput aria-label="Fruit" placeholder="Choose a fruit" />
      <ComboboxPopup>
        <ComboboxEmpty>No fruit found.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}
`,
  command: `"use client"

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
} from "@/components/ui/command"

export function Preview() {
  const items = [
    { label: "New project", value: "new-project" },
    { label: "Open settings", value: "settings" },
  ]

  return (
    <Command items={items}>
      <CommandInput
        aria-label="Search commands"
        placeholder="Search commands"
      />
      <CommandPanel>
        <CommandEmpty>No commands found.</CommandEmpty>
        <CommandList>
          {(item: { label: string; value: string }) => (
            <CommandItem
              key={item.value}
              value={item.value}
              onClick={() => window.alert(item.label)}
            >
              {item.label}
            </CommandItem>
          )}
        </CommandList>
      </CommandPanel>
    </Command>
  )
}
`,
  "context-menu": `"use client"

import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ trigger: { padding: "2rem" } })

export function Preview() {
  return (
    <ContextMenu>
      <ContextMenuTrigger tabIndex={0} xstyle={styles.trigger}>
        Right-click here, or focus and press Shift+F10.
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuGroup>
          <ContextMenuItem onClick={() => window.alert("Copied")}>
            Copy
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuPopup>
    </ContextMenu>
  )
}
`,
  "date-picker": `"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState } from "react"

export function Preview() {
  const [date, setDate] = useState<Date | undefined>()

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        {date ? date.toLocaleDateString() : "Pick a date"}
      </PopoverTrigger>
      <PopoverPopup>
        <PopoverTitle>Choose a date</PopoverTitle>
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </PopoverPopup>
    </Popover>
  )
}
`,
  dialog: `"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function Preview() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        Read notice
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Scheduled maintenance</DialogTitle>
          <DialogDescription>
            Service will pause tonight at midnight.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>Understood</DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
`,
  drawer: `"use client"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function Preview() {
  return (
    <Drawer>
      <DrawerTrigger render={<Button variant="outline" />}>
        Read notice
      </DrawerTrigger>
      <DrawerPopup>
        <DrawerHeader>
          <DrawerTitle>Scheduled maintenance</DrawerTitle>
          <DrawerDescription>
            Service will pause tonight at midnight.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose render={<Button />}>Understood</DrawerClose>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  )
}
`,
  empty: `"use client"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export function Preview() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>No projects yet</EmptyTitle>
        <EmptyDescription>
          Projects you create will appear here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
`,
  field: `"use client"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function Preview() {
  return (
    <Field name="name">
      <FieldLabel>Name</FieldLabel>
      <Input autoComplete="name" />
      <FieldDescription>Shown on your profile.</FieldDescription>
    </Field>
  )
}
`,
  fieldset: `"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Fieldset, FieldsetLegend } from "@/components/ui/fieldset"
import { Input } from "@/components/ui/input"

export function Preview() {
  return (
    <Fieldset>
      <FieldsetLegend>Billing details</FieldsetLegend>
      <Field name="company">
        <FieldLabel>Company</FieldLabel>
        <Input autoComplete="organization" />
      </Field>
    </Fieldset>
  )
}
`,
  form: `"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

export function Preview() {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        window.alert("Email: " + data.get("email"))
      }}
    >
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <Input name="email" type="email" autoComplete="email" required />
        <FieldError>Please enter a valid email.</FieldError>
      </Field>
      <Button type="submit">Subscribe</Button>
    </Form>
  )
}
`,
  frame: `"use client"

import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"

export function Preview() {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Account</FrameTitle>
        <FrameDescription>Your current plan.</FrameDescription>
      </FrameHeader>
      <FramePanel>Starter plan</FramePanel>
      <FrameFooter>Renews monthly.</FrameFooter>
    </Frame>
  )
}
`,
  box: `"use client"

import { Box } from "@/components/ui/box"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ section: { padding: "1rem" } })

export function Preview() {
  return (
    <Box render={<section />} xstyle={styles.section}>
      Content inside a semantic Box.
    </Box>
  )
}
`,
  flex: `"use client"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ row: { alignItems: "center", gap: "1rem" } })

export function Preview() {
  return (
    <Flex xstyle={styles.row}>
      <Box render={<span />}>First</Box>
      <Box render={<span />}>Second</Box>
    </Flex>
  )
}
`,
  vstack: `"use client"

import { Box } from "@/components/ui/box"
import { VStack } from "@/components/ui/vstack"

export function Preview() {
  return (
    <VStack>
      <strong>Account ready</strong>
      <Box render={<span />}>Nothing else is needed.</Box>
    </VStack>
  )
}
`,
  hstack: `"use client"

import { Box } from "@/components/ui/box"
import { HStack } from "@/components/ui/hstack"

export function Preview() {
  return (
    <HStack>
      <Box render={<span />}>Inbox</Box>
      <Box render={<span />} aria-label="unread messages">3</Box>
    </HStack>
  )
}
`,
  stack: `"use client"

import { Box } from "@/components/ui/box"
import { Stack } from "@/components/ui/stack"

export function Preview() {
  return (
    <Stack>
      <strong>Project status</strong>
      <Box render={<span />}>All systems operational.</Box>
    </Stack>
  )
}
`,
  grid: `"use client"

import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ columns: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" } })

export function Preview() {
  return (
    <Grid xstyle={styles.columns}>
      <Box render={<span />}>Design</Box>
      <Box render={<span />}>Engineering</Box>
    </Grid>
  )
}
`,
  center: `"use client"

import { Center } from "@/components/ui/center"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ root: { minBlockSize: "8rem" } })

export function Preview() {
  return <Center xstyle={styles.root}>Centered content</Center>
}
`,
  container: `"use client"

import { Container } from "@/components/ui/container"

export function Preview() {
  return <Container>Content stays centered on wide screens.</Container>
}
`,
  link: `"use client"

import { Link } from "@/components/ui/link"
import { Link as RouterLink } from "@tanstack/react-router"

export function Preview() {
  return (
    <Link render={<RouterLink to="/docs/installation" />}>
      Read the documentation
    </Link>
  )
}

// Next.js: import NextLink from "next/link" and use
// <Link render={<NextLink href="/docs" />}>Read the documentation</Link>
`,
  text: `"use client"

import { Text } from "@/components/ui/text"

export function Preview() {
  return <Text>Keep body copy in a native paragraph.</Text>
}
`,
  heading: `"use client"

import { Heading } from "@/components/ui/heading"

export function Preview() {
  return (
    <>
      <Heading render={<h1 />}>Page title</Heading>
      <Heading>Section title</Heading>
    </>
  )
}
`,
  group: `"use client"

import { Button } from "@/components/ui/button"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"

export function Preview() {
  return (
    <Group aria-label="History">
      <Button xstyle={groupItemStyles.item} variant="outline" onClick={() => window.alert("Undo")}>
        Undo
      </Button>
      <GroupSeparator />
      <Button xstyle={groupItemStyles.item} variant="outline" onClick={() => window.alert("Redo")}>
        Redo
      </Button>
    </Group>
  )
}
`,
  input: `"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function Preview() {
  return (
    <Field>
      <FieldLabel>Email</FieldLabel>
      <Input type="email" autoComplete="email" placeholder="you@example.com" />
    </Field>
  )
}
`,
  "input-group": `"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export function Preview() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="Website address" placeholder="example.com" />
      <InputGroupAddon>
        <InputGroupText>https://</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
`,
  kbd: `"use client"

import { Text } from "@/components/ui/text"
import { Kbd } from "@/components/ui/kbd"

export function Preview() {
  return (
    <Text>
      Press <Kbd>Escape</Kbd> to close.
    </Text>
  )
}
`,
  label: `"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function Preview() {
  return (
    <>
      <Label htmlFor="display-name">Display name</Label>
      <Input id="display-name" autoComplete="nickname" />
    </>
  )
}
`,
  menu: `"use client"

import { Button } from "@/components/ui/button"
import {
  Menu,
  MenuGroup,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/menu"

export function Preview() {
  return (
    <Menu>
      <MenuTrigger render={<Button variant="outline" />}>Actions</MenuTrigger>
      <MenuPopup>
        <MenuGroup>
          <MenuItem onClick={() => window.alert("New project")}>
            New project
          </MenuItem>
          <MenuItem onClick={() => window.alert("Open settings")}>
            Settings
          </MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  )
}
`,
  meter: `"use client"

import {
  Meter,
  MeterIndicator,
  MeterLabel,
  MeterTrack,
  MeterValue,
} from "@/components/ui/meter"

export function Preview() {
  return (
    <Meter value={75}>
      <MeterLabel>Storage used</MeterLabel>
      <MeterValue />
      <MeterTrack>
        <MeterIndicator />
      </MeterTrack>
    </Meter>
  )
}
`,
  navigation: `"use client"

import { Box } from "@/components/ui/box"

export function Preview() {
  return (
    <Box render={<nav />} aria-label="Main navigation">
      <Box render={<ul />}>
        <Box render={<li />}>
          <a href="/" aria-current="page">
            Home
          </a>
        </Box>
        <Box render={<li />}>
          <a href="/projects">Projects</a>
        </Box>
        <Box render={<li />}>
          <a href="/settings">Settings</a>
        </Box>
      </Box>
    </Box>
  )
}
`,
  "number-field": `"use client"

import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field"

export function Preview() {
  return (
    <NumberField defaultValue={1} min={1}>
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label="Decrease quantity" />
        <NumberFieldInput aria-label="Quantity" />
        <NumberFieldIncrement aria-label="Increase quantity" />
      </NumberFieldGroup>
    </NumberField>
  )
}
`,
  "otp-field": `"use client"

import { OTPField, OTPFieldInput } from "@/components/ui/otp-field"

export function Preview() {
  return (
    <fieldset>
      <legend>Verification code</legend>
      <OTPField length={6}>
        <OTPFieldInput aria-label="Digit 1 of 6" />
        <OTPFieldInput aria-label="Digit 2 of 6" />
        <OTPFieldInput aria-label="Digit 3 of 6" />
        <OTPFieldInput aria-label="Digit 4 of 6" />
        <OTPFieldInput aria-label="Digit 5 of 6" />
        <OTPFieldInput aria-label="Digit 6 of 6" />
      </OTPField>
    </fieldset>
  )
}
`,
  pagination: `"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function Preview() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=1" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="?page=2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="?page=3" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
`,
  popover: `"use client"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Preview() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        Shipping info
      </PopoverTrigger>
      <PopoverPopup>
        <PopoverTitle>Delivery</PopoverTitle>
        <PopoverDescription>
          Orders arrive within five business days.
        </PopoverDescription>
        <PopoverClose render={<Button variant="ghost" />}>Close</PopoverClose>
      </PopoverPopup>
    </Popover>
  )
}
`,
  "preview-card": `"use client"

import { Text } from "@/components/ui/text"
import { Heading } from "@/components/ui/heading"
import {
  PreviewCard,
  PreviewCardPopup,
  PreviewCardTrigger,
} from "@/components/ui/preview-card"

export function Preview() {
  return (
    <PreviewCard>
      <PreviewCardTrigger href="https://example.com">
        Visit Example
      </PreviewCardTrigger>
      <PreviewCardPopup>
        <Heading render={<h2 />}>Example</Heading>
        <Text>A sample website for documentation.</Text>
      </PreviewCardPopup>
    </PreviewCard>
  )
}
`,
  progress: `"use client"

import { Progress } from "@/components/ui/progress"

export function Preview() {
  return <Progress aria-label="Upload progress" value={60} />
}
`,
  "radio-group": `"use client"

import { Label } from "@/components/ui/label"
import { Radio, RadioGroup } from "@/components/ui/radio-group"

export function Preview() {
  return (
    <RadioGroup aria-label="Delivery speed" defaultValue="standard">
      <Label>
        <Radio value="standard" /> Standard
      </Label>
      <Label>
        <Radio value="express" /> Express
      </Label>
    </RadioGroup>
  )
}
`,
  "scroll-area": `"use client"

import { Box } from "@/components/ui/box"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ viewport: { blockSize: "12rem" } })

export function Preview() {
  return (
    <ScrollArea xstyle={styles.viewport}>
      <Box render={<ul />} aria-label="Versions">
        {Array.from({ length: 30 }, (_, index) => (
          <Box render={<li />} key={index}>Version 1.{index}</Box>
        ))}
      </Box>
    </ScrollArea>
  )
}
`,
  select: `"use client"

import {
  Select,
  SelectGroup,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function Preview() {
  const items = [
    { label: "Vite", value: "vite" },
    { label: "Astro", value: "astro" },
  ]

  return (
    <Select defaultValue="vite" items={items}>
      <SelectTrigger aria-label="Framework">
        <SelectValue />
      </SelectTrigger>
      <SelectPopup>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectPopup>
    </Select>
  )
}
`,
  separator: `"use client"

import { Text } from "@/components/ui/text"
import { Separator } from "@/components/ui/separator"

export function Preview() {
  return (
    <>
      <Text>Account settings</Text>
      <Separator />
      <Text>Notification settings</Text>
    </>
  )
}
`,
  sheet: `"use client"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function Preview() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        Read notice
      </SheetTrigger>
      <SheetPopup>
        <SheetHeader>
          <SheetTitle>Scheduled maintenance</SheetTitle>
          <SheetDescription>
            Service will pause tonight at midnight.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button />}>Understood</SheetClose>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  )
}
`,
  sidebar: `"use client"

import { Heading } from "@/components/ui/heading"
import { Text } from "@/components/ui/text"
import { Box } from "@/components/ui/box"
import * as stylex from "@stylexjs/stylex"
import { HomeIcon, SettingsIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuText,
  sidebarSlotStyles,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function Preview() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <Box render={<nav />} aria-label="Main navigation">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  render={<a href="/" aria-current="page" />}
                >
                  <HomeIcon {...stylex.props(sidebarSlotStyles.icon)} aria-hidden />
                  <SidebarMenuText>Home</SidebarMenuText>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<a href="/settings" />}>
                  <SettingsIcon {...stylex.props(sidebarSlotStyles.icon)} aria-hidden />
                  <SidebarMenuText>Settings</SidebarMenuText>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </Box>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarTrigger />
        <Heading render={<h1 />}>Home</Heading>
        <Text>Your workspace.</Text>
      </SidebarInset>
    </SidebarProvider>
  )
}
`,
  skeleton: `"use client"

import { Box } from "@/components/ui/box"
import { Skeleton } from "@/components/ui/skeleton"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({ placeholder: { blockSize: "1rem", inlineSize: "12rem" } })

export function Preview() {
  return (
    <Box role="status" aria-label="Loading profile">
      <Skeleton
        aria-hidden="true"
        xstyle={styles.placeholder}
      />
    </Box>
  )
}
`,
  slider: `"use client"

import { Slider } from "@/components/ui/slider"

export function Preview() {
  return <Slider aria-label="Volume" defaultValue={50} />
}
`,
  spinner: `"use client"

import { Spinner } from "@/components/ui/spinner"

export function Preview() {
  return <Spinner aria-label="Loading" />
}
`,
  switch: `"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function Preview() {
  return (
    <Label>
      <Switch name="notifications" /> Enable notifications
    </Label>
  )
}
`,
  table: `"use client"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function Preview() {
  return (
    <Table>
      <TableCaption>Current projects</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Project</TableHead>
          <TableHead scope="col">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Website</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  )
}
`,
  tabs: `"use client"

import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs"

export function Preview() {
  return (
    <Tabs defaultValue="account">
      <TabsList aria-label="Settings">
        <TabsTab value="account">Account</TabsTab>
        <TabsTab value="notifications">Notifications</TabsTab>
      </TabsList>
      <TabsPanel value="account">Manage your profile.</TabsPanel>
      <TabsPanel value="notifications">
        Choose which updates to receive.
      </TabsPanel>
    </Tabs>
  )
}
`,
  textarea: `"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function Preview() {
  return (
    <Field>
      <FieldLabel>Message</FieldLabel>
      <Textarea placeholder="How can we help?" />
    </Field>
  )
}
`,
  toast: `"use client"

import { Button } from "@/components/ui/button"
import {
  toastManager,
  ToastProvider,
} from "@/components/ui/toast"

export default function App() {
  return (
    <ToastProvider>
      <ShowToastButton />
    </ToastProvider>
  )
}

function ShowToastButton() {
  return (
    <Button
      onClick={() =>
        toastManager.add({
          title: "Event created",
          description: "Your event is ready to share.",
        })
      }
    >
      Show toast
    </Button>
  )
}
`,
  toggle: `"use client"

import { Toggle } from "@/components/ui/toggle"

export function Preview() {
  return <Toggle aria-label="Bold">Bold</Toggle>
}
`,
  "toggle-group": `"use client"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export function Preview() {
  return (
    <ToggleGroup aria-label="Text formatting" defaultValue={["bold"]} multiple>
      <ToggleGroupItem value="bold" aria-label="Bold">
        Bold
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Italic">
        Italic
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
`,
  toolbar: `"use client"

import { Button } from "@/components/ui/button"
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
} from "@/components/ui/toolbar"

export function Preview() {
  return (
    <Toolbar aria-label="Document actions">
      <ToolbarGroup>
        <ToolbarButton
          render={<Button variant="outline" />}
          onClick={() => window.alert("Saved")}
        >
          Save
        </ToolbarButton>
        <ToolbarButton
          render={<Button variant="outline" />}
          onClick={() => window.print()}
        >
          Print
        </ToolbarButton>
      </ToolbarGroup>
    </Toolbar>
  )
}
`,
  tooltip: `"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function Preview() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>
          Save
        </TooltipTrigger>
        <TooltipPopup>Save your changes.</TooltipPopup>
      </Tooltip>
    </TooltipProvider>
  )
}
`,
}

export const usageSnippets = new Map(Object.entries(usageSnippetValues))
