import { createFileRoute } from "@tanstack/react-router";

import appCss from "@/styles.css?url";

export const Route = createFileRoute("/tailwind/")({
  head: () => ({
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/tailwind/"!</div>;
}
