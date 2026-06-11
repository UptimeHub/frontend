import type { ReactNode } from "react"

import { AuthPanel } from "@/components/auth-panel"
import type { AdminRole } from "@/types/api"
import { useAuth } from "@/auth/auth-provider"
import { NotFoundPage } from "@/pages/not-found-page"

export function RequireAuth({
  role,
  children,
}: {
  role?: AdminRole
  children: ReactNode
}) {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return <AuthPanel intent="Sign in required" />
  }

  if (role && !auth.profile?.roles.includes(role)) {
    return <NotFoundPage />
  }

  return children
}
