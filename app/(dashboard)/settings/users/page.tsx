import { UsersClient } from '@/components/settings/UsersClient'
import { MOCK_USERS, MOCK_INVITES } from '@/lib/mock/users'

export default function SettingsUsersPage() {
  return (
    <div className="max-w-4xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Usuários</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie os membros da equipe e seus níveis de acesso.
        </p>
      </div>
      <div className="p-6">
        <UsersClient initialUsers={MOCK_USERS} initialInvites={MOCK_INVITES} />
      </div>
    </div>
  )
}
