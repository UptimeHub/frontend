import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] min-w-0 items-center justify-center px-4 py-10 lg:px-6">
      <section className="w-full max-w-md text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you are looking for is not available in this workspace.
        </p>
        <Button asChild className="mt-5">
          <Link to="/discover">Go to discovery</Link>
        </Button>
      </section>
    </main>
  )
}
