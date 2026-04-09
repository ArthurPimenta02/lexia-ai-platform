import type { Metadata } from 'next'
import { Inter, Fira_Code } from 'next/font/google'
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
    <html lang="pt-BR" className={`${inter.variable} ${firaCode.variable} h-full antialiased`}>
      <head>
        {/* Aplica tema antes da hidratação — evita flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
