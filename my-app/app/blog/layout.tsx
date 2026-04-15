import type { Metadata } from "next"

export const metadata: Metadata = {
  title: 'My Blog',
  description: '...',
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <section>{children}</section>
}
