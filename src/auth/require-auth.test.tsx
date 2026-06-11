import { renderToString } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RequireAuth } from "@/auth/require-auth"
import { useAuth } from "@/auth/auth-provider"
import type { AdminRole } from "@/types/api"

vi.mock("@/auth/auth-provider", () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

function authValue({
  authenticated,
  roles = [],
}: {
  authenticated: boolean
  roles?: string[]
}) {
  return {
    token: authenticated ? "token" : null,
    profile: authenticated
      ? {
          subject: "user-1",
          username: "tester",
          email: "tester@example.com",
          roles,
          permissions: [],
          organizationId: null,
          expiresAt: null,
        }
      : null,
    mode: authenticated ? "dev-token" : "public",
    oidcConfigured: true,
    devTokenEnabled: true,
    isAuthenticated: authenticated,
    signIn: vi.fn(),
    signOut: vi.fn(),
    completeSignIn: vi.fn(),
    setDevToken: vi.fn(),
    clearDevToken: vi.fn(),
  } as const
}

function renderGuard(role?: AdminRole) {
  return renderToString(
    <MemoryRouter>
      <RequireAuth role={role}>
        <div>Protected route</div>
      </RequireAuth>
    </MemoryRouter>
  )
}

describe("RequireAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the sign-in gate when no token is present", () => {
    mockUseAuth.mockReturnValue(authValue({ authenticated: false }))

    const html = renderGuard("PLATFORM_ADMIN")

    expect(html).toContain("Sign in required")
    expect(html).not.toContain("Protected route")
    expect(html).not.toContain("Page not found")
  })

  it("returns 404 for an authenticated user without the required role", () => {
    mockUseAuth.mockReturnValue(
      authValue({ authenticated: true, roles: ["ORGANIZATION_ADMIN"] })
    )

    const html = renderGuard("PLATFORM_ADMIN")

    expect(html).toContain("Page not found")
    expect(html).not.toContain("Protected route")
    expect(html).not.toContain("Sign in required")
  })

  it("renders the route for an authenticated user with the required role", () => {
    mockUseAuth.mockReturnValue(
      authValue({ authenticated: true, roles: ["PLATFORM_ADMIN"] })
    )

    expect(renderGuard("PLATFORM_ADMIN")).toContain("Protected route")
  })
})
