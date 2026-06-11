import { jwtDecode } from "jwt-decode"

import type { AdminRole, UUID } from "@/types/api"

export interface TokenProfile {
  subject: UUID | null
  username: string | null
  email: string | null
  roles: string[]
  permissions: string[]
  organizationId: UUID | null
  expiresAt: number | null
}

interface JwtPayload {
  sub?: string
  preferred_username?: string
  username?: string
  email?: string
  exp?: number
  organization_id?: string
  permissions?: string[]
  realm_access?: {
    roles?: string[]
  }
}

export function parseTokenProfile(token: string): TokenProfile {
  const payload = jwtDecode<JwtPayload>(token)
  return {
    subject: payload.sub ?? null,
    username: payload.preferred_username ?? payload.username ?? null,
    email: payload.email ?? null,
    roles: payload.realm_access?.roles ?? [],
    permissions: payload.permissions ?? [],
    organizationId: payload.organization_id ?? null,
    expiresAt: payload.exp ?? null,
  }
}

export function hasRole(profile: TokenProfile | null, role: AdminRole): boolean {
  return Boolean(profile?.roles.includes(role))
}

export function hasPermission(
  profile: TokenProfile | null,
  permission: string
): boolean {
  return Boolean(profile?.permissions.includes(permission))
}

export function isExpired(profile: TokenProfile | null, now = Date.now()): boolean {
  if (!profile?.expiresAt) return false
  return profile.expiresAt * 1000 <= now
}
