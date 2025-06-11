import type { Metadata } from "next"

import "./globals.css"

import SidebarExample from "@/components/navigation/sidebar"
import { SiteHeader } from "@/components/navigation/site-header"
import { Providers } from "./providers"

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
        <Providers>
          <SidebarExample>
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SidebarExample>
        </Providers>
      </body>
    </html>
  )
}
