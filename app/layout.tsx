import type { Metadata } from 'next'
import { Inter, Fira_Code } from 'next/font/google'
import Script from 'next/script'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider, themeScript } from '@/components/ThemeProvider'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const firaCode = Fira_Code({
  variable: '--font-fira-code',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Lexia AI',
  description: 'Plataforma de operação comercial e atendimento jurídico com IA integrada.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${firaCode.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full overflow-hidden bg-background text-foreground">
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
