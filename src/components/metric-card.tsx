import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function MetricCard({
  title,
  value,
  delta,
  icon: Icon,
}: {
  title: string
  value: string | number
  delta?: string
  icon: LucideIcon
}) {
  return (
    <Card className="rounded-lg shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal text-foreground">
          {value}
        </div>
        {delta ? <p className="mt-1 text-xs text-success">{delta}</p> : null}
      </CardContent>
    </Card>
  )
}
