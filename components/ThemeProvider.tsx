'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme | null
  toggle: () => void
}>({ theme: null, toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // null no SSR — evita mismatch com o valor real do localStorage
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    // Lê o que o script inline já resolveu
    const isDark = document.documentElement.classList.contains('dark')
    setTheme(isDark ? 'dark' : 'light')
  }, [])

  function toggle() {
    // Se ainda não hidratou, lê direto do DOM
    const current = theme ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    const next: Theme = current === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('lexia-theme', next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

// Tipo exportado para uso externo
export type { Theme }

// Script inline que roda antes da hidratação — evita flash de tema errado
export const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('lexia-theme');
    var dark = t ? t === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
  } catch(e) {}
})();
`
