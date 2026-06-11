import { useState } from "react"
import { KeyRoundIcon, LogInIcon, ShieldCheckIcon, XIcon } from "lucide-react"

import { useAuth } from "@/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function AuthPanel({ intent = "Sign in required" }: { intent?: string }) {
  const auth = useAuth()
  const [token, setToken] = useState("")

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl items-center px-4 py-10">
      <Card className="w-full rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ShieldCheckIcon className="text-primary" />
            {intent}
          </CardTitle>
          <CardDescription>
            UptimeHub uses Keycloak JWTs for protected booking and admin
            workflows. Public discovery remains available without a token.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void auth.signIn()} disabled={!auth.oidcConfigured}>
              <LogInIcon data-icon="inline-start" />
              Sign in with Keycloak
            </Button>
            {auth.mode !== "public" ? (
              <Button variant="outline" onClick={() => void auth.signOut()}>
                <XIcon data-icon="inline-start" />
                Clear session
              </Button>
            ) : null}
          </div>

          {auth.devTokenEnabled ? (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="dev-token">
                  <KeyRoundIcon />
                  Development bearer token
                </FieldLabel>
                <Textarea
                  id="dev-token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste a Keycloak access token for local testing"
                  rows={5}
                />
                <FieldDescription>
                  The token is stored in session storage and sent only as an
                  Authorization bearer token.
                </FieldDescription>
              </Field>
              <Button
                type="button"
                className="w-fit"
                onClick={() => {
                  auth.setDevToken(token)
                  setToken("")
                }}
              >
                Apply token
              </Button>
            </FieldGroup>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
