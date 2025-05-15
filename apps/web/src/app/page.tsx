"use client"

import * as React from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

export default function Home() {
  return (
    <main className="container mx-auto flex flex-col space-y-8 px-4 py-8 sm:px-6">
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
        <Alert variant="danger">
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
        <Badge variant="danger">Danger</Badge>
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
        <Button variant="danger">Danger</Button>
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

      {/* Checkbox FIX: not working */}
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

      {/* Select FIX: not working  */}
    </main>
  )
}
