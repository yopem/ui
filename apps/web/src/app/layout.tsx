import type { Metadata } from "next"

import "./globals.css"

import SidebarExample from "@/components/navigation/sidebar"
import { SiteHeader } from "@/components/navigation/site-header"

export const metadata: Metadata = {
  title: "Yopem UI Web",
  description: "Yopem UI Web",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <SidebarExample>
          <SiteHeader />
          <div className="flex flex-1 flex-col">{children}</div>
        </SidebarExample>
      </body>
    </html>
  )
}
