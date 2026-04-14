import { redirect } from 'next/navigation'
import { getCurrentUserProfile } from '@/actions/profile'
import { ProfileForm } from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const result = await getCurrentUserProfile()

  if ('error' in result) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">
          Dados pessoais e imagem usada na sua experiencia dentro da Lexia.
        </p>
      </div>

      <ProfileForm initial={result} />
    </div>
  )
}
