'use client'

import { useMemo } from 'react'
import type { UserRole } from '@/types/database'
import {
  canManage,
  canManageSettings,
  canManageUsers,
  canWrite,
  isAdmin,
} from '@/lib/permissions'

interface UsePermissionsResult {
  role: UserRole
  canWrite: boolean
  canManage: boolean
  canManageSettings: boolean
  canManageUsers: boolean
  isAdmin: boolean
}

export function usePermissions(role: UserRole): UsePermissionsResult {
  return useMemo(
    () => ({
      role,
      canWrite: canWrite(role),
      canManage: canManage(role),
      canManageSettings: canManageSettings(role),
      canManageUsers: canManageUsers(role),
      isAdmin: isAdmin(role),
    }),
    [role]
  )
}
