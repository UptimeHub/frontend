import { NavLink, Outlet } from "react-router-dom"
import {
  BellIcon,
  Building2Icon,
  CalendarDaysIcon,
  CircleHelpIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
} from "lucide-react"

import { useAuth } from "@/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status-badge"
import { hasRole } from "@/lib/auth"
import { cn } from "@/lib/utils"
import type { AdminRole } from "@/types/api"

type PrimaryNavItem = {
  to: string
  label: string
  icon: typeof SearchIcon
  access: "public" | "authenticated" | AdminRole
}

const primaryNav: PrimaryNavItem[] = [
  { to: "/discover", label: "Discover", icon: SearchIcon, access: "public" },
  {
    to: "/bookings",
    label: "My Bookings",
    icon: CalendarDaysIcon,
    access: "authenticated",
  },
  {
    to: "/admin",
    label: "Organization Admin",
    icon: LayoutDashboardIcon,
    access: "ORGANIZATION_ADMIN",
  },
  {
    to: "/platform",
    label: "Platform Admin",
    icon: ShieldIcon,
    access: "PLATFORM_ADMIN",
  },
]

const supportNav = [
  { to: "/help", label: "Help & Support", icon: CircleHelpIcon },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
]

export function AppShell() {
  const auth = useAuth()
  const visiblePrimaryNav = primaryNav.filter((item) => {
    if (item.access === "public") {
      return true
    }

    if (item.access === "authenticated") {
      return auth.isAuthenticated
    }

    return hasRole(auth.profile, item.access)
  })

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" className="lg:hidden">
              <MenuIcon />
              <span className="sr-only">Open navigation</span>
            </Button>
            <NavLink to="/discover" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Building2Icon />
              </span>
              <span className="text-sm font-semibold">UptimeHub</span>
            </NavLink>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <StatusBadge status={auth.isAuthenticated ? "ACTIVE" : "PENDING"} />
            <span>{auth.profile?.username ?? "Public session"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm">
              <BellIcon />
              <span className="sr-only">Notifications</span>
            </Button>
            {auth.isAuthenticated ? (
              <Button variant="outline" size="sm" onClick={() => void auth.signOut()}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" onClick={() => void auth.signIn()}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100svh-3.5rem)] border-r border-border bg-card lg:block">
          <div className="flex h-full flex-col gap-5 p-4">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="mt-1 truncate text-sm font-medium">
                {auth.profile?.organizationId ? "Authenticated workspace" : "Public discovery"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {auth.profile?.organizationId ?? "No organization claim"}
              </p>
            </div>

            <nav className="flex flex-col gap-1">
              {visiblePrimaryNav.map((item) => (
                <ShellLink key={item.to} {...item} />
              ))}
            </nav>

            <Separator />

            <nav className="flex flex-col gap-1">
              {supportNav.map((item) => (
                <ShellLink key={item.to} {...item} />
              ))}
            </nav>

          </div>
        </aside>

        <Outlet />
      </div>
    </div>
  )
}

function ShellLink({
  to,
  label,
  icon: Icon,
}: {
  to: string
  label: string
  icon: typeof SearchIcon
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground",
          isActive && "bg-primary/10 text-primary"
        )
      }
    >
      <Icon />
      <span>{label}</span>
    </NavLink>
  )
}
