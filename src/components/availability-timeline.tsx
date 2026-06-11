import type { AvailabilityPeriodDto } from "@/types/api"
import { displayDateTime } from "@/lib/datetime"
import { cn } from "@/lib/utils"

export function AvailabilityTimeline({
  periods,
}: {
  periods?: AvailabilityPeriodDto[]
}) {
  if (!periods?.length) {
    return (
      <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        No availability periods returned for this range.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid min-h-10 grid-cols-[repeat(auto-fit,minmax(48px,1fr))] overflow-hidden rounded-lg border border-border bg-muted">
        {periods.map((period) => (
          <div
            key={`${period.startTime}-${period.endTime}`}
            className={cn(
              "border-r border-background/80 px-2 py-2 text-[11px] leading-tight last:border-r-0",
              period.status === "AVAILABLE"
                ? "bg-success text-success-foreground"
                : "bg-slate-300 text-slate-700"
            )}
            title={`${displayDateTime(period.startTime)} - ${displayDateTime(period.endTime)}`}
          >
            <span className="block truncate">{period.startTime.slice(11, 16)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-success" />
          Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-slate-300" />
          Unavailable
        </span>
      </div>
    </div>
  )
}
