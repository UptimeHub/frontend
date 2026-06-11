import { useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarIcon, CheckCircle2Icon, ClockIcon } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/auth/auth-provider"
import { AvailabilityTimeline } from "@/components/availability-timeline"
import { ErrorBlock, LoadingBlock } from "@/components/data-state"
import { ResourceImage } from "@/components/resource-image"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { bookingApi, coreApi, resourceApi } from "@/lib/api"
import {
  combineDateAndTime,
  displayDateTime,
  toDateInputValue,
} from "@/lib/datetime"
import { resourceSpecificationEntries } from "@/lib/resource-specs"

export function ResourceDetailPage() {
  const { resourceId } = useParams()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const today = useMemo(() => new Date(), [])
  const [date, setDate] = useState(toDateInputValue(today))
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("12:00")

  const from = combineDateAndTime(date, "08:00")
  const to = combineDateAndTime(date, "18:00")
  const startDateTime = combineDateAndTime(date, startTime)
  const endDateTime = combineDateAndTime(date, endTime)
  const invalidTimeRange = startDateTime >= endDateTime

  const resource = useQuery({
    queryKey: ["resource", resourceId],
    queryFn: () => resourceApi.resource(resourceId ?? ""),
    enabled: Boolean(resourceId),
  })
  const organizations = useQuery({
    queryKey: ["organizations", "detail"],
    queryFn: () => coreApi.organizations({ size: 50 }),
  })
  const resourceTypes = useQuery({
    queryKey: ["resource-types", "detail"],
    queryFn: () => resourceApi.resourceTypes({ size: 50 }),
  })
  const availability = useQuery({
    queryKey: ["availability", resourceId, from, to],
    queryFn: () => bookingApi.availability(resourceId ?? "", from, to),
    enabled: Boolean(resourceId),
    refetchInterval: 30_000,
  })
  const upcoming = useQuery({
    queryKey: ["bookings", "admin-current", resourceId],
    queryFn: () => bookingApi.currentForResource(resourceId ?? ""),
    enabled: Boolean(resourceId && auth.profile?.roles.includes("ORGANIZATION_ADMIN")),
  })

  const createBooking = useMutation({
    mutationFn: () =>
      bookingApi.create({
        resourceId: resourceId ?? "",
        startTime: startDateTime,
        endTime: endDateTime,
      }),
    onSuccess: (booking) => {
      toast.success("Booking request created", {
        description: `Status: ${booking.status}. Realtime updates will confirm or fail it.`,
      })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["availability"] })
    },
    onError: (error) => {
      toast.error("Could not reserve slot", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  const selectedResource = resource.data
  const organization = organizations.data?.content.find(
    (item) => item.id === selectedResource?.organizationId
  )
  const type = resourceTypes.data?.content.find(
    (item) => item.id === selectedResource?.resourceTypeId
  )
  const specificationEntries = selectedResource
    ? resourceSpecificationEntries(selectedResource, type)
    : []

  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      {resource.isLoading ? <LoadingBlock rows={5} /> : null}
      {resource.error ? <ErrorBlock error={resource.error} /> : null}
      {selectedResource ? (
        <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_260px]">
          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <ResourceImage />
              <CardTitle className="text-lg">{selectedResource.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <DetailLine label="Organization" value={organization?.name ?? "Unknown organization"} />
              <DetailLine label="Resource type" value={type?.name ?? selectedResource.resourceTypeId} />
              {specificationEntries.length ? (
                specificationEntries.map((entry) => (
                  <DetailLine
                    key={entry.name}
                    label={entry.label}
                    value={entry.value === undefined ? "-" : String(entry.value)}
                  />
                ))
              ) : (
                <DetailLine label="Specifications" value="-" />
              )}
              <DetailLine label="Status" value={<StatusBadge status={selectedResource.status} />} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-5">
            <Card className="rounded-lg shadow-xs">
              <CardHeader>
                <CardTitle className="text-lg">
                  Booking Flow - Check Availability & Reserve
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <FieldGroup className="grid gap-4 md:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="booking-date">
                      <CalendarIcon />
                      Date
                    </FieldLabel>
                    <Input
                      id="booking-date"
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="booking-start">
                      <ClockIcon />
                      Start time
                    </FieldLabel>
                    <Input
                      id="booking-start"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="booking-end">End time</FieldLabel>
                    <Input
                      id="booking-end"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                    />
                  </Field>
                </FieldGroup>

                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Availability - {date}</p>
                  {availability.isLoading ? <LoadingBlock rows={2} /> : null}
                  {availability.error ? <ErrorBlock error={availability.error} /> : null}
                  <AvailabilityTimeline periods={availability.data?.periods} />
                </div>

                <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2Icon className="mr-2 inline" />
                  This slot will be submitted as pending and confirmed by the
                  booking service.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg shadow-xs">
              <CardHeader>
                <CardTitle className="text-base">Upcoming bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Booked by</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(upcoming.data ?? []).slice(0, 4).map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          {displayDateTime(booking.startTime)} -{" "}
                          {booking.endTime.slice(11, 16)}
                        </TableCell>
                        <TableCell>{booking.userId.slice(0, 8)}</TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!upcoming.data?.length ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-muted-foreground">
                          Sign in as an organization admin to see current bookings.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card className="h-fit rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Your selection</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <DetailLine label="Date" value={date} />
              <DetailLine label="Time" value={`${startTime} - ${endTime}`} />
              <DetailLine label="Resource" value={selectedResource.name} />
              <Button
                disabled={createBooking.isPending}
                onClick={() => {
                  if (!auth.isAuthenticated) {
                    toast.info("Sign in required", {
                      description: "Use Keycloak or paste a development JWT to reserve.",
                    })
                    return
                  }
                  if (invalidTimeRange) {
                    toast.error("Invalid booking time", {
                      description: "Start time must be before end time.",
                    })
                    return
                  }
                  createBooking.mutate()
                }}
              >
                Reserve now
              </Button>
              <Button variant="outline">Save as draft</Button>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </main>
  )
}

function DetailLine({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
