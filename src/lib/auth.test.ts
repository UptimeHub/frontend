import { describe, expect, it } from "vitest"

import { hasRole, parseTokenProfile } from "@/lib/auth"

function unsignedJwt(payload: object) {
  const encoded = btoa(JSON.stringify(payload))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
  return `eyJhbGciOiJub25lIn0.${encoded}.`
}

describe("auth token parsing", () => {
  it("extracts roles, permissions, and organization_id from a JWT", () => {
    const token = unsignedJwt({
      sub: "user-1",
      preferred_username: "admin",
      organization_id: "org-1",
      permissions: ["resource:manage"],
      realm_access: { roles: ["ORGANIZATION_ADMIN"] },
    })

    const profile = parseTokenProfile(token)

    expect(profile.organizationId).toBe("org-1")
    expect(profile.permissions).toContain("resource:manage")
    expect(hasRole(profile, "ORGANIZATION_ADMIN")).toBe(true)
  })
})
