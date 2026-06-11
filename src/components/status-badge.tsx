import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  PUBLISHED: "status-success",
  ACTIVE: "status-success",
  CONFIRMED: "status-success",
  AVAILABLE: "status-success",
  PENDING: "status-warning",
  NOT_PUBLISHED: "status-muted",
  INACTIVE: "status-muted",
  UNAVAILABLE: "status-muted",
  MAINTENANCE: "status-warning",
  CANCELLED: "status-danger",
  FAILED: "status-danger",
  ARCHIVED: "status-muted",
  DELETED: "status-danger",
  SUSPENDED: "status-muted",
}

export function StatusBadge({
  status,
  className,
}: {
  status?: string
  className?: string
}) {
  if (!status) return null
  return (
    <Badge
      variant="outline"
      className={cn("h-5 rounded-md px-2 text-[11px] font-medium", statusStyles[status] ?? "status-muted", className)}
    >
      {status.replace("_", " ")}
    </Badge>
  )
}
