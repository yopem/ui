const alertComponent = {
  name: "Alert",
  description:
    "A simple alert component to display important messages or warnings.",
  code: `
import React from "react"

type AlertProps = {
  type?: "success" | "error" | "info"
  message: string
}

export function Alert({ type = "info", message }: AlertProps) {
  const bgColor =
    type === "success" ? "bg-green-100 text-green-800" :
    type === "error" ? "bg-red-100 text-red-800" :
    "bg-blue-100 text-blue-800"

  return (
    <div className={\`rounded p-4 \${bgColor} border border-current\`}>
      {message}
    </div>
  )
}
  `,
  preview: (
    <div className="space-y-2">
      <div className="rounded border border-green-800 bg-green-100 p-4 text-green-800">
        Success! Your action was completed.
      </div>
      <div className="rounded border border-red-800 bg-red-100 p-4 text-red-800">
        Error! Something went wrong.
      </div>
      <div className="rounded border border-blue-800 bg-blue-100 p-4 text-blue-800">
        Info! Please read this information.
      </div>
    </div>
  ),
}

export default alertComponent
