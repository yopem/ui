import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@yopem-ui/react"
import { Icon } from "@yopem-ui/react-icons"

const collapsibleComponent = {
  name: "Collapsible",
  description: "A collapsible component with header, content, and footer.",
  code: `
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
  `,
  preview: (
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
  ),
}

export default collapsibleComponent
