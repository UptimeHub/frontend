import { useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarCheckIcon,
  EditIcon,
  PlusIcon,
  RotateCcwIcon,
  TimerIcon,
  UsersIcon,
  WarehouseIcon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { useAuth } from "@/auth/auth-provider"
import { ErrorBlock, LoadingBlock } from "@/components/data-state"
import { MetricCard } from "@/components/metric-card"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { bookingApi, resourceApi } from "@/lib/api"
import { displayDateTime } from "@/lib/datetime"
import {
  buildSpecificationValues,
  missingRequiredSpecifications,
  resourceSpecificationEntries,
  specificationInputValue,
} from "@/lib/resource-specs"
import type {
  ResourceDto,
  ResourceStatus,
  ResourceTypeDto,
  SpecificationDefinition,
} from "@/types/api"

const resourceSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(3, "Description is required"),
  resourceTypeId: z.number().min(1),
  status: z.enum([
    "PUBLISHED",
    "MAINTENANCE",
    "NOT_PUBLISHED",
    "ARCHIVED",
    "DELETED",
  ]),
  specificationValues: z.record(z.string(), z.string()),
})

type ResourceFormValues = z.infer<typeof resourceSchema>

export function AdminPage() {
  const auth = useAuth()
  const queryClient = useQueryClient()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<ResourceDto | null>(null)

  const resources = useQuery({
    queryKey: ["resources", "admin"],
    queryFn: () => resourceApi.resources({ size: 50, sort: "name,asc" }),
  })
  const resourceTypes = useQuery({
    queryKey: ["resource-types", "admin"],
    queryFn: () => resourceApi.resourceTypes({ size: 50 }),
  })
  const bookings = useQuery({
    queryKey: ["bookings", "admin"],
    queryFn: () => bookingApi.adminBookings({ size: 50, sort: "startTime,desc" }),
    refetchInterval: 45_000,
  })
  const cancelBooking = useMutation({
    mutationFn: bookingApi.cancelAsAdmin,
    onSuccess: () => {
      toast.success("Booking cancelled")
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["availability"] })
    },
  })

  const activeBookings = bookings.data?.content.filter((booking) =>
    ["ACTIVE", "PENDING"].includes(booking.status)
  )
  const utilization = resources.data?.content.length
    ? Math.round(((activeBookings?.length ?? 0) / resources.data.content.length) * 100)
    : 0

  const typeMap = useMemo(
    () => new Map(resourceTypes.data?.content.map((item) => [item.id, item])),
    [resourceTypes.data]
  )

  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Organization Admin - Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage resources and booking queues for the authenticated
              organization.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingResource(null)
              setSheetOpen(true)
            }}
          >
            <PlusIcon data-icon="inline-start" />
            Add Resource
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Resources"
            value={resources.data?.page.totalElements ?? 0}
            delta="+12% vs last month"
            icon={WarehouseIcon}
          />
          <MetricCard
            title="Active Bookings"
            value={activeBookings?.length ?? 0}
            delta="+9% vs last month"
            icon={CalendarCheckIcon}
          />
          <MetricCard
            title="Pending Requests"
            value={
              bookings.data?.content.filter((item) => item.status === "PENDING")
                .length ?? 0
            }
            delta="+2% vs last month"
            icon={TimerIcon}
          />
          <MetricCard
            title="Utilization"
            value={`${utilization}%`}
            delta="+6% vs last month"
            icon={UsersIcon}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Resources</p>
                <p className="text-xs text-muted-foreground">
                  Status changes are scoped by the backend organization claim.
                </p>
              </div>
              <Button variant="outline" size="sm">View all</Button>
            </div>
            {resources.isLoading ? <LoadingBlock rows={5} /> : null}
            {resources.error ? <ErrorBlock error={resources.error} /> : null}
            {resources.data ? (
              <div className="overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Specifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.data.content.map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>
                        {typeMap.get(resource.resourceTypeId)?.name ?? resource.resourceTypeId}
                      </TableCell>
                      <TableCell>
                        {resourceSpecificationSummary(
                          resource,
                          typeMap.get(resource.resourceTypeId)
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={resource.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingResource(resource)
                            setSheetOpen(true)
                          }}
                        >
                          <EditIcon />
                          <span className="sr-only">Edit resource</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-card shadow-xs">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Booking Queue</p>
              <p className="text-xs text-muted-foreground">
                Pending and current reservations.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {(bookings.data?.content ?? []).slice(0, 6).map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-border bg-background p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {displayDateTime(booking.startTime)} -{" "}
                        {booking.endTime.slice(11, 16)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Resource {booking.resourceId.slice(0, 8)}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    disabled={["CANCELLED", "EXPIRED", "FAILED"].includes(
                      booking.status
                    )}
                    onClick={() => cancelBooking.mutate(booking.id)}
                  >
                    <RotateCcwIcon data-icon="inline-start" />
                    Cancel
                  </Button>
                </div>
              ))}
              {!bookings.data?.content.length ? (
                <p className="text-sm text-muted-foreground">
                  No organization bookings returned by the API.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <ResourceSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        resource={editingResource}
        resourceTypes={resourceTypes.data?.content ?? []}
        organizationId={auth.profile?.organizationId}
      />
    </main>
  )
}

function resourceSpecificationSummary(
  resource: ResourceDto,
  resourceType?: ResourceTypeDto
) {
  const entries = resourceSpecificationEntries(resource, resourceType)
    .filter((entry) => entry.value !== undefined && entry.value !== "")
    .slice(0, 3)

  if (!entries.length) {
    return "-"
  }

  return entries
    .map((entry) => `${entry.label}: ${String(entry.value)}`)
    .join(", ")
}

function specificationDefaultsForDefinitions(
  definitions: SpecificationDefinition[],
  values: Record<string, string | number | boolean> | undefined
) {
  return definitions.reduce<Record<string, string>>((result, definition) => {
    result[definition.name] = specificationInputValue(values?.[definition.name])
    return result
  }, {})
}

function ResourceSheet({
  open,
  onOpenChange,
  resource,
  resourceTypes,
  organizationId,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  resource: ResourceDto | null
  resourceTypes: ResourceTypeDto[]
  organizationId?: string | null
}) {
  const queryClient = useQueryClient()
  const defaultResourceType =
    resourceTypes.find((type) => type.id === resource?.resourceTypeId) ??
    resourceTypes[0]
  const resourceSpecificationDefaults = specificationDefaultsForDefinitions(
    defaultResourceType?.specificationDefinitions ?? [],
    resource?.specificationValues
  )
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    values: {
      name: resource?.name ?? "",
      description: resource?.description ?? "",
      resourceTypeId: resource?.resourceTypeId ?? defaultResourceType?.id ?? 1,
      status: resource?.status ?? "NOT_PUBLISHED",
      specificationValues: resourceSpecificationDefaults,
    },
  })
  const selectedResourceTypeId = useWatch({
    control: form.control,
    name: "resourceTypeId",
  })
  const selectedStatus = useWatch({ control: form.control, name: "status" })
  const selectedSpecificationValues = useWatch({
    control: form.control,
    name: "specificationValues",
  })
  const selectedResourceType = resourceTypes.find(
    (type) => type.id === selectedResourceTypeId
  )

  const saveResource = useMutation({
    mutationFn: (values: ResourceFormValues) => {
      if (!organizationId) {
        throw new Error("JWT is missing the organization_id claim.")
      }

      const resourceType = resourceTypes.find(
        (type) => type.id === values.resourceTypeId
      )
      const definitions = resourceType?.specificationDefinitions ?? []
      const missing = missingRequiredSpecifications(
        definitions,
        values.specificationValues
      )

      if (missing.length) {
        throw new Error(
          `Required specifications are missing: ${missing
            .map((definition) => definition.label || definition.name)
            .join(", ")}`
        )
      }

      const specificationValues = buildSpecificationValues(
        definitions,
        values.specificationValues
      )
      const payload = {
        name: values.name,
        description: values.description,
        resourceTypeId: values.resourceTypeId,
        organizationId,
        customCharacteristics: resource?.customCharacteristics,
        ...(Object.keys(specificationValues).length
          ? { specificationValues }
          : {}),
      }
      if (resource) {
        return resourceApi.updateResource({
          ...payload,
          id: resource.id,
          status: values.status as ResourceStatus,
        })
      }
      return resourceApi.createResource(payload).then(() => undefined)
    },
    onSuccess: () => {
      toast.success(resource ? "Resource updated" : "Resource created")
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error("Could not save resource", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{resource ? "Edit resource" : "Create resource"}</SheetTitle>
          <SheetDescription>
            Resource payloads are sent with the organization from the token when
            the backend receives the request.
          </SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-5 px-4"
          onSubmit={form.handleSubmit((values) => saveResource.mutate(values))}
        >
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="resource-name">Name</FieldLabel>
              <Input id="resource-name" {...form.register("name")} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.description)}>
              <FieldLabel htmlFor="resource-description">Description</FieldLabel>
              <Textarea
                id="resource-description"
                rows={3}
                {...form.register("description")}
              />
            </Field>
            <Field>
              <FieldLabel>Resource Type</FieldLabel>
              <Select
                value={String(selectedResourceTypeId)}
                onValueChange={(value) => {
                  const nextResourceTypeId = Number(value)
                  const nextResourceType = resourceTypes.find(
                    (type) => type.id === nextResourceTypeId
                  )
                  const currentValues = form.getValues("specificationValues")

                  form.setValue("resourceTypeId", nextResourceTypeId, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                  form.setValue(
                    "specificationValues",
                    specificationDefaultsForDefinitions(
                      nextResourceType?.specificationDefinitions ?? [],
                      currentValues
                    ),
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    }
                  )
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                value={selectedStatus}
                onValueChange={(value) =>
                  form.setValue("status", value as ResourceStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {[
                      "PUBLISHED",
                      "MAINTENANCE",
                      "NOT_PUBLISHED",
                      "ARCHIVED",
                    ].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {selectedResourceType?.specificationDefinitions.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedResourceType.specificationDefinitions.map((definition) => {
                  const fieldName = `specificationValues.${definition.name}` as const
                  const fieldId = `spec-${definition.name}`

                  return (
                    <Field key={definition.name}>
                      <FieldLabel htmlFor={fieldId}>
                        {definition.label || definition.name}
                        {definition.required ? " *" : ""}
                      </FieldLabel>
                      {definition.dataType === "BOOLEAN" ? (
                        <Select
                          value={
                            selectedSpecificationValues?.[definition.name] ?? ""
                          }
                          onValueChange={(value) =>
                            form.setValue(fieldName, value, {
                              shouldDirty: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger id={fieldId} className="w-full">
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="true">true</SelectItem>
                              <SelectItem value="false">false</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={fieldId}
                          type={
                            definition.dataType === "NUMBER" ? "number" : "text"
                          }
                          {...form.register(fieldName)}
                        />
                      )}
                      <FieldDescription>
                        {definition.dataType}
                        {definition.searchable ? " searchable" : ""}
                        {definition.filterable ? " filterable" : ""}
                      </FieldDescription>
                    </Field>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
                This resource type does not define specification fields.
              </div>
            )}
          </FieldGroup>
          <SheetFooter className="px-0">
            <Button type="submit" disabled={saveResource.isPending}>
              Save resource
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
