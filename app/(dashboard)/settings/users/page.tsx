import { UsersClient } from '@/components/settings/UsersClient'
import { getUsersAndInvites } from '@/actions/users'

export default async function SettingsUsersPage() {
  const result = await getUsersAndInvites()
  const error = 'error' in result ? result.error : null
  const users = 'error' in result ? [] : result.users
  const invites = 'error' in result ? [] : result.invites

  return (
    <div className="max-w-4xl">
      <div className="border-b border-border px-6 py-5">
        <h1 className="text-lg font-semibold">Usuários</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Gerencie os membros da equipe e seus níveis de acesso.
        </p>
      </div>
      <div className="p-6">
        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : (
          <UsersClient initialUsers={users} initialInvites={invites} />
        )}
      </div>
    </div>
  )
}
