"use client"

import * as React from "react"
import Link from "next/link"
import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  createListCollection,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  Menu,
  MenuContent,
  MenuItemGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  PinInput,
  PinInputControl,
  PinInputHiddenInput,
  PinInputInput,
  PinInputLabel,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ProgressLinear,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValueText,
  Skeleton,
  Slider,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

export default function Home() {
  const collection = createListCollection({
    items: ["light", "dark", "system"],
  })

  return (
    <main className="flex-start container mx-auto flex flex-col justify-start space-y-8 px-4 py-8 sm:px-6">
      <h1 className="text-4xl">Hello, World!</h1>

      {/* Accordion */}
      <div className="max-w-md rounded border p-4">
        <Accordion collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionItemTrigger>Is it accessible?</AccordionItemTrigger>
            <AccordionItemContent>
              Yes. It adheres to the WAI-ARIA design pattern.
            </AccordionItemContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionItemTrigger>Is it styled?</AccordionItemTrigger>
            <AccordionItemContent>
              Yes. It comes with default styles that matches the other
              components&apos; aesthetic.
            </AccordionItemContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionItemTrigger>Is it animated?</AccordionItemTrigger>
            <AccordionItemContent>
              Yes. It&apos;s animated by default, but you can disable it if you
              prefer.
            </AccordionItemContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Alert */}
      <div className="flex flex-col space-y-4">
        <Alert variant="default">
          <Icon name="Terminal" className="size" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the cli.
          </AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <Icon name="Terminal" className="size" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You can add components to your app using the cli.
          </AlertDescription>
        </Alert>
      </div>

      {/* Avatar */}
      <Avatar>
        <AvatarImage
          src="https://github.com/karyanayandi.png"
          alt="@karyanayandi"
        />
        <AvatarFallback>KY</AvatarFallback>
      </Avatar>

      {/* Badge */}
      <div className="space-x-2">
        <Badge>Default</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </div>

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis className="size-4" />
            <span className="sr-only">Toggle menu</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs/components">Components</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Button */}
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button asChild variant="link">
          <a href="#">Link</a>
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>

      {/* Card */}
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Create project</CardTitle>
          <CardDescription>
            Deploy your new project in one-click.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="name">Name</label>
                <Input id="name" placeholder="Name of your project" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="framework">Framework</label>
                <Input id="framework" placeholder="Framework" />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Deploy</Button>
        </CardFooter>
      </Card>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <label
          htmlFor="terms"
          className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Accept terms and conditions
        </label>
      </div>

      {/* Collapsible */}
      <Collapsible className="w-[350px] space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold">
            @peduarte starred 3 repositories
          </h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0">
              <Icon name="ChevronsUpDown" className="size-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <div className="rounded-md border px-4 py-3 font-mono text-sm">
          @ark-ui/react
        </div>
        <CollapsibleContent className="space-y-2">
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @ark-ui/vue
          </div>
          <div className="rounded-md border px-4 py-3 font-mono text-sm">
            @ark-ui/solid
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Dialog */}
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hover Card */}
      <div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button variant="link">@nextjs</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <Avatar>
                <AvatarImage src="https://github.com/vercel.png" />
                <AvatarFallback>VC</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">@nextjs</h4>
                <p className="text-sm">
                  The React Framework – created and maintained by @vercel.
                </p>
                <div className="flex items-center pt-2">
                  <Icon
                    name="CalendarDays"
                    className="mr-2 size-4 opacity-70"
                  />{" "}
                  <span className="text-muted-foreground text-xs">
                    Joined December 2021
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>{" "}
      </div>

      {/* Input */}
      <div className="flex flex-col space-y-2">
        <Input placeholder="Default" />
        <Input placeholder="Disabled" disabled />
      </div>

      {/* Menu FIX: not working */}
      <div>
        <Menu>
          <MenuTrigger asChild>
            <Button variant="outline">Open</Button>
          </MenuTrigger>
          <MenuContent className="w-56">
            <MenuItemGroup>
              <MenuRadioItem value="top">
                <Link href="/">Top</Link>
              </MenuRadioItem>
              <MenuRadioItem value="bottom">Bottom</MenuRadioItem>
              <MenuSeparator />
              <MenuRadioItem value="right">Right</MenuRadioItem>
            </MenuItemGroup>
          </MenuContent>
        </Menu>
      </div>

      {/* Pin Input FIX: style not working */}
      <div>
        <PinInput defaultValue={["1", "2", "3"]}>
          <PinInputLabel>Label</PinInputLabel>
          <PinInputControl>
            {[0, 1, 2].map((id, index) => (
              <PinInputInput key={id} index={index} />
            ))}
          </PinInputControl>
          <PinInputHiddenInput />
        </PinInput>
      </div>

      {/* Popover FIX: not working */}
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="leading-none font-medium">Dimensions</h4>
                <p className="text-muted-foreground text-sm">
                  Set the dimensions for the layer.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <label htmlFor="width">Width</label>
                  <Input
                    id="width"
                    defaultValue="100%"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <label htmlFor="maxWidth">Max. width</label>
                  <Input
                    id="maxWidth"
                    defaultValue="300px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <label htmlFor="height">Height</label>
                  <Input
                    id="height"
                    defaultValue="25px"
                    className="col-span-2 h-8"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <label htmlFor="maxHeight">Max. height</label>
                  <Input
                    id="maxHeight"
                    defaultValue="none"
                    className="col-span-2 h-8"
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Progress FIX: need to recheck and not working */}
      <div>
        <ProgressLinear defaultValue={64} />
      </div>

      {/* Radio Group FIX: not working */}
      <div>
        <RadioGroup defaultValue="comfortable">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="default" id="r1" />
            <label htmlFor="r1">Default</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <label htmlFor="r2">Comfortable</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="compact" id="r3" />
            <label htmlFor="r3">Compact</label>
          </div>
        </RadioGroup>
      </div>

      {/* Skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>

      <div>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>

      {/* @ts-expect-error  FIX: Select not working and style very bad  */}
      <Select collection={collection}>
        <SelectTrigger className="w-[180px]">
          <SelectValueText placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          {collection.items.map((item) => (
            <SelectItem key={item} item={item}>
              <SelectItemText>{item}</SelectItemText>
              <SelectItemIndicator>✓</SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Toggle Group TODO: need to recheck mode */}
      <div>
        <ToggleGroup>
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <Icon name="Bold" className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <Icon name="Italic" className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <Icon name="Underline" className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Toggle */}
      <div>
        <Toggle aria-label="Toggle bold">
          <Icon name="Bold" className="size-4" />
        </Toggle>
      </div>

      {/* Tooltip FIX: style */}
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add to library</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </main>
  )
}
