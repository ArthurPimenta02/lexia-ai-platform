import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lexia AI — Acesso',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Painel de marca — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-brand px-12 py-10">
        <div>
          <span className="text-2xl font-bold text-white tracking-tight">Lexia AI</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Operação jurídica com IA integrada.
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Gerencie leads, atendimentos e processos num único lugar. Deixe a IA cuidar da triagem enquanto você foca no que importa.
          </p>
        </div>

        <p className="text-blue-200 text-sm">© 2025 Lexia AI. Todos os direitos reservados.</p>
      </div>

      {/* Painel de formulário */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Logo mobile — só aparece quando o painel lateral está oculto */}
        <div className="mb-8 lg:hidden">
          <span className="text-2xl font-bold text-brand">Lexia AI</span>
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
