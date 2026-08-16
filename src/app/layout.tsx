import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "家計フル管理ダッシュボード",
  description:
    "収入・支払・貯金をまとめて記録し、予算と振り返りまでつなげる家計ダッシュボードです。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): React.ReactNode {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-transparent text-slate-900 antialiased">
        <div className="relative isolate">
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute left-[-6rem] top-[-4rem] h-80 w-80 rounded-full bg-amber-200/45 blur-3xl" />
            <div className="absolute right-[-5rem] top-16 h-[28rem] w-[28rem] rounded-full bg-teal-200/35 blur-3xl" />
            <div className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-sky-200/30 blur-3xl" />
          </div>
          {children}
        </div>
      </body>
    </html>
  )
}
