import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { runOidcExchangeOnce } from "@/auth/oidc-exchange"
import { setAccessTokenProvider } from "@/lib/api"
import { isExpired, parseTokenProfile, type TokenProfile } from "@/lib/auth"

const DEV_TOKEN_KEY = "uptimehub.devToken"
const OIDC_TOKEN_KEY = "uptimehub.oidcToken"
const OIDC_ID_TOKEN_KEY = "uptimehub.oidcIdToken"
const OIDC_STATE_KEY = "uptimehub.oidcState"

type AuthMode = "oidc" | "dev-token" | "public"

interface AuthContextValue {
  token: string | null
  profile: TokenProfile | null
  mode: AuthMode
  oidcConfigured: boolean
  devTokenEnabled: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  completeSignIn: () => Promise<void>
  setDevToken: (token: string) => void
  clearDevToken: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getOidcConfig() {
  const authority = import.meta.env.VITE_KEYCLOAK_URL
  const tokenAuthority =
    import.meta.env.VITE_KEYCLOAK_TOKEN_BASE_URL ?? import.meta.env.VITE_KEYCLOAK_URL
  const realm = import.meta.env.VITE_KEYCLOAK_REALM
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

  if (!authority || !tokenAuthority || !realm || !clientId) {
    return null
  }

  const realmUrl = `${authority.replace(/\/$/, "")}/realms/${realm}`
  const tokenRealmUrl = `${tokenAuthority.replace(/\/$/, "")}/realms/${realm}`
  return {
    clientId,
    authorizationEndpoint: `${realmUrl}/protocol/openid-connect/auth`,
    tokenEndpoint: `${tokenRealmUrl}/protocol/openid-connect/token`,
    logoutEndpoint: `${realmUrl}/protocol/openid-connect/logout`,
  }
}

function createStateValue() {
  const values = new Uint32Array(4)
  window.crypto.getRandomValues(values)
  return Array.from(values, (value) => value.toString(16).padStart(8, "0")).join(
    ""
  )
}

function createSigninUrl(config: NonNullable<ReturnType<typeof getOidcConfig>>) {
  const origin = window.location.origin
  const state = createStateValue()
  sessionStorage.setItem(OIDC_STATE_KEY, state)

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${origin}/auth/callback`,
    response_type: "code",
    scope: "openid profile email",
    state,
  })

  return `${config.authorizationEndpoint}?${params.toString()}`
}

function profileFromToken(token: string | null): TokenProfile | null {
  if (!token) return null
  try {
    const profile = parseTokenProfile(token)
    return isExpired(profile) ? null : profile
  } catch {
    return null
  }
}

async function readTokenError(response: Response) {
  const fallback = `Token exchange failed with HTTP ${response.status}`
  const text = await response.text()

  try {
    const payload = JSON.parse(text) as {
      error?: string
      error_description?: string
    }

    return payload.error_description ?? payload.error ?? fallback
  } catch {
    return text || fallback
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError"
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs = 15_000
) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    window.clearTimeout(timeout)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [oidcConfig] = useState(() => getOidcConfig())
  const [oidcToken, setOidcToken] = useState(() =>
    sessionStorage.getItem(OIDC_TOKEN_KEY)
  )
  const [devToken, setDevTokenState] = useState(() =>
    sessionStorage.getItem(DEV_TOKEN_KEY)
  )
  const devTokenEnabled = import.meta.env.VITE_ENABLE_DEV_TOKEN !== "false"
  const oidcConfigured = Boolean(oidcConfig)

  const token = oidcToken ?? devToken ?? null
  const profile = useMemo(() => profileFromToken(token), [token])
  const mode: AuthMode = oidcToken
    ? "oidc"
    : devToken
      ? "dev-token"
      : "public"

  useEffect(() => {
    setAccessTokenProvider(() => token)
  }, [token])

  const setDevToken = useCallback((value: string) => {
    const tokenValue = value.trim()
    if (!tokenValue) return
    sessionStorage.setItem(DEV_TOKEN_KEY, tokenValue)
    setDevTokenState(tokenValue)
    toast.success("Development token applied")
  }, [])

  const clearDevToken = useCallback(() => {
    sessionStorage.removeItem(DEV_TOKEN_KEY)
    setDevTokenState(null)
  }, [])

  const signIn = useCallback(async () => {
    if (oidcConfig) {
      sessionStorage.removeItem(OIDC_TOKEN_KEY)
      sessionStorage.removeItem(OIDC_ID_TOKEN_KEY)
      window.location.assign(createSigninUrl(oidcConfig))
      return
    }
    toast.info("OIDC is not configured", {
      description: "Use the development token panel for authenticated routes.",
    })
  }, [oidcConfig])

  const completeSignIn = useCallback(async () => {
    if (!oidcConfig) {
      throw new Error("OIDC is not configured")
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get("code")
    const state = params.get("state")
    const storedState = sessionStorage.getItem(OIDC_STATE_KEY)
    const storedToken = sessionStorage.getItem(OIDC_TOKEN_KEY)

    if (storedToken) {
      setOidcToken(storedToken)
      return
    }

    if (!code || !state || state !== storedState) {
      throw new Error("The login response state did not match this session.")
    }

    const response = await runOidcExchangeOnce(code, async () => {
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: oidcConfig.clientId,
        code,
        redirect_uri: `${window.location.origin}/auth/callback`,
      })

      const tokenResponse = await fetchWithTimeout(
        oidcConfig.tokenEndpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body,
        }
      ).catch((error: unknown) => {
        if (isAbortError(error)) {
          throw new Error("Keycloak token exchange timed out.")
        }
        throw error
      })

      if (!tokenResponse.ok) {
        throw new Error(await readTokenError(tokenResponse))
      }

      return tokenResponse.json() as Promise<{
        access_token: string
        id_token?: string
      }>
    })

    sessionStorage.setItem(OIDC_TOKEN_KEY, response.access_token)
    if (response.id_token) {
      sessionStorage.setItem(OIDC_ID_TOKEN_KEY, response.id_token)
    }
    sessionStorage.removeItem(OIDC_STATE_KEY)
    setOidcToken(response.access_token)
  }, [oidcConfig])

  const signOut = useCallback(async () => {
    const idToken = sessionStorage.getItem(OIDC_ID_TOKEN_KEY)
    const hadOidcSession = Boolean(sessionStorage.getItem(OIDC_TOKEN_KEY) || idToken)
    clearDevToken()
    sessionStorage.removeItem(OIDC_TOKEN_KEY)
    sessionStorage.removeItem(OIDC_ID_TOKEN_KEY)
    sessionStorage.removeItem(OIDC_STATE_KEY)
    setOidcToken(null)

    if (oidcConfig && hadOidcSession) {
      const params = new URLSearchParams({
        client_id: oidcConfig.clientId,
        post_logout_redirect_uri: `${window.location.origin}/discover`,
      })
      if (idToken) {
        params.set("id_token_hint", idToken)
      }
      window.location.replace(`${oidcConfig.logoutEndpoint}?${params.toString()}`)
      return
    }

    window.location.replace("/discover")
  }, [clearDevToken, oidcConfig])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      profile,
      mode,
      oidcConfigured,
      devTokenEnabled,
      isAuthenticated: Boolean(profile),
      signIn,
      signOut,
      completeSignIn,
      setDevToken,
      clearDevToken,
    }),
    [
      token,
      profile,
      mode,
      oidcConfigured,
      devTokenEnabled,
      signIn,
      signOut,
      completeSignIn,
      setDevToken,
      clearDevToken,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return value
}
