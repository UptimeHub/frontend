import { useState } from "react"
import { Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDaysIcon, RotateCcwIcon } from "lucide-react"
import { toast } from "sonner"

import { EmptyBlock, ErrorBlock, LoadingBlock } from "@/components/data-state"
import { ResourceImage } from "@/components/resource-image"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { bookingApi } from "@/lib/api"
import { displayDateTime } from "@/lib/datetime"
import type { BookingStatus } from "@/types/api"

const ALL = "all"
const statuses: BookingStatus[] = [
  "PENDING",
  "ACTIVE",
  "EXPIRED",
  "CANCELLED",
  "FAILED",
]

export function BookingsPage() {
  const [status, setStatus] = useState(ALL)
  const queryClient = useQueryClient()
  const bookings = useQuery({
    queryKey: ["bookings", "mine", status],
    queryFn: () =>
      bookingApi.myBookings({
        status: status === ALL ? undefined : (status as BookingStatus),
        size: 25,
        sort: "startTime,desc",
      }),
    refetchInterval: 45_000,
  })
  const cancelBooking = useMutation({
    mutationFn: bookingApi.cancelMine,
    onSuccess: () => {
      toast.success("Booking cancelled")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["availability"] })
    },
    onError: (error) => {
      toast.error("Could not cancel booking", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">My Bookings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track pending, active, cancelled, and failed reservations.
            </p>
          </div>
          <Button asChild>
            <Link to="/discover">
              <CalendarDaysIcon data-icon="inline-start" />
              Book a resource
            </Link>
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="max-w-xs">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-2 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {statuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
          {bookings.isLoading ? <LoadingBlock rows={5} /> : null}
          {bookings.error ? <ErrorBlock error={bookings.error} /> : null}
          {bookings.data?.content.length ? (
            <div className="overflow-x-auto">
            <Table className="min-w-[820px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.data.content.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-3">
                        <ResourceImage className="w-16 shrink-0" />
                        <div>
                          <p className="font-medium">
                            {booking.resourceId.slice(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Resource booking
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {displayDateTime(booking.startTime)} -{" "}
                      {booking.endTime.slice(11, 16)}
                    </TableCell>
                    <TableCell>{booking.organizationId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={["CANCELLED", "EXPIRED", "FAILED"].includes(
                          booking.status
                        )}
                        onClick={() => cancelBooking.mutate(booking.id)}
                      >
                        <RotateCcwIcon data-icon="inline-start" />
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          ) : null}
          {bookings.data && !bookings.data.content.length ? (
            <div className="p-4">
              <EmptyBlock
                title="No bookings found"
                description="Reserve a published resource to see it here."
              />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
