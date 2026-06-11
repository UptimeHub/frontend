import { useEffect, useRef } from "react"
import { Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "@/auth/auth-provider"
import { RequireAuth } from "@/auth/require-auth"
import { AppShell } from "@/components/app-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AdminPage } from "@/pages/admin-page"
import { BookingsPage } from "@/pages/bookings-page"
import { DiscoverPage } from "@/pages/discover-page"
import { NotFoundPage } from "@/pages/not-found-page"
import { PlatformPage } from "@/pages/platform-page"
import { ResourceDetailPage } from "@/pages/resource-detail-page"

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/discover" replace />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/resources/:resourceId" element={<ResourceDetailPage />} />
        <Route
          path="/bookings"
          element={
            <RequireAuth>
              <BookingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="ORGANIZATION_ADMIN">
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route
          path="/platform"
          element={
            <RequireAuth role="PLATFORM_ADMIN">
              <PlatformPage />
            </RequireAuth>
          }
        />
        <Route path="/help" element={<PlaceholderPage title="Help & Support" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AuthCallbackPage() {
  const { completeSignIn } = useAuth()
  const navigate = useNavigate()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }

    startedRef.current = true
    completeSignIn()
      .then(() => {
        navigate("/discover", { replace: true })
      })
      .catch((error: unknown) => {
        toast.error("Could not complete sign in", {
          description: error instanceof Error ? error.message : undefined,
        })
        navigate("/discover", { replace: true })
      })
  }, [completeSignIn, navigate])

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4">
      <Alert className="max-w-md">
        <AlertTitle>Completing sign in</AlertTitle>
        <AlertDescription>
          UptimeHub is exchanging the Keycloak authorization code for a session.
        </AlertDescription>
      </Alert>
    </main>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      <Alert>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          This utility area is reserved for operational support content. The
          booking and administration workflows are available from the main
          navigation.
        </AlertDescription>
      </Alert>
    </main>
  )
}
