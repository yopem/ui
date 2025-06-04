import type { Metadata } from "next"

import "./globals.css"

import SidebarExample from "@/components/sidebar/sidebar"

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
        <SidebarExample>{children}</SidebarExample>
      </body>
    </html>
  )
}
