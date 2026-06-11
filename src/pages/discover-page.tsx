import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  Building2Icon,
  FilterIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  UsersIcon,
} from "lucide-react"

import { ErrorBlock, LoadingBlock } from "@/components/data-state"
import { ResourceImage } from "@/components/resource-image"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { coreApi, resourceApi } from "@/lib/api"
import { resourceSpecificationEntries } from "@/lib/resource-specs"
import type { ResourceDto, ResourceTypeDto } from "@/types/api"

const ALL = "all"

export function DiscoverPage() {
  const [search, setSearch] = useState("")
  const [categoryId, setCategoryId] = useState(ALL)
  const [providerTypeId, setProviderTypeId] = useState(ALL)
  const [organizationId, setOrganizationId] = useState(ALL)
  const [resourceTypeId, setResourceTypeId] = useState(ALL)

  const organizations = useQuery({
    queryKey: ["organizations", "public"],
    queryFn: () => coreApi.organizations({ size: 50, sort: "name,asc" }),
  })
  const providerTypes = useQuery({
    queryKey: ["provider-types"],
    queryFn: () => coreApi.providerTypes({ size: 50, sort: "name,asc" }),
  })
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => resourceApi.categories({ size: 50, sort: "name,asc" }),
  })
  const resourceTypes = useQuery({
    queryKey: ["resource-types"],
    queryFn: () => resourceApi.resourceTypes({ size: 50, sort: "name,asc" }),
  })
  const resources = useQuery({
    queryKey: ["resources", { search, organizationId, resourceTypeId }],
    queryFn: () =>
      resourceApi.resources({
        search,
        organizationId: organizationId === ALL ? undefined : organizationId,
        resourceTypeId:
          resourceTypeId === ALL ? undefined : Number(resourceTypeId),
        size: 25,
        sort: "name,asc",
      }),
  })

  const organizationMap = useMemo(
    () => new Map(organizations.data?.content.map((item) => [item.id, item])),
    [organizations.data]
  )
  const providerMap = useMemo(
    () => new Map(providerTypes.data?.content.map((item) => [item.id, item])),
    [providerTypes.data]
  )
  const typeMap = useMemo(
    () => new Map(resourceTypes.data?.content.map((item) => [item.id, item])),
    [resourceTypes.data]
  )
  const categoryMap = useMemo(
    () => new Map(categories.data?.content.map((item) => [item.id, item])),
    [categories.data]
  )

  const filteredResources = useMemo(() => {
    const items = resources.data?.content ?? []
    return items.filter((resource) => {
      const type = typeMap.get(resource.resourceTypeId)
      const organization = organizationMap.get(resource.organizationId)
      if (categoryId !== ALL && type?.categoryId !== Number(categoryId)) {
        return false
      }
      if (
        providerTypeId !== ALL &&
        organization?.providerTypeId !== Number(providerTypeId)
      ) {
        return false
      }
      return true
    })
  }, [categoryId, organizationMap, providerTypeId, resources.data, typeMap])
  const firstResource = filteredResources[0]
  const firstResourceOrganization = firstResource
    ? organizationMap.get(firstResource.organizationId)
    : undefined
  const firstResourceType = firstResource
    ? typeMap.get(firstResource.resourceTypeId)
    : undefined

  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Public Discovery - Find a Resource
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse live published resources and check availability before
              reserving.
            </p>
          </div>
          <Button variant="outline">
            <SlidersHorizontalIcon data-icon="inline-start" />
            More filters
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 shadow-xs">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1.6fr)_repeat(4,minmax(140px,1fr))]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="resource-search">Search</Label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="resource-search"
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search resources, locations, or keywords..."
                />
              </div>
            </div>
            <FilterSelect
              label="Category"
              value={categoryId}
              onValueChange={setCategoryId}
              items={categories.data?.content.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
            <FilterSelect
              label="Provider Type"
              value={providerTypeId}
              onValueChange={setProviderTypeId}
              items={providerTypes.data?.content.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
            <FilterSelect
              label="Organization"
              value={organizationId}
              onValueChange={setOrganizationId}
              items={organizations.data?.content.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
            />
            <FilterSelect
              label="Resource Type"
              value={resourceTypeId}
              onValueChange={setResourceTypeId}
              items={resourceTypes.data?.content.map((item) => ({
                value: String(item.id),
                label: item.name,
              }))}
            />
          </div>
        </div>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {filteredResources.length} resources found
                </p>
                <p className="text-xs text-muted-foreground">
                  Public requests are limited to published data.
                </p>
              </div>
              <Button variant="outline" size="sm">
                <FilterIcon data-icon="inline-start" />
                Sort by nearest
              </Button>
            </div>

            {resources.isLoading ? <LoadingBlock rows={5} /> : null}
            {resources.error ? <ErrorBlock error={resources.error} /> : null}
            {resources.data ? (
              <div className="overflow-x-auto">
                <ResourceTable
                  resources={filteredResources}
                  organizationMap={organizationMap}
                  providerMap={providerMap}
                  typeMap={typeMap}
                  categoryMap={categoryMap}
                />
              </div>
            ) : null}
          </div>

          <Card className="rounded-lg shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Discovery summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <ResourceImage className="h-48 w-full md:h-56" />
              <div className="grid grid-cols-2 gap-3">
                <SummaryItem
                  icon={Building2Icon}
                  label="Organizations"
                  value={organizations.data?.page.totalElements ?? 0}
                />
                <SummaryItem
                  icon={UsersIcon}
                  label="Resource types"
                  value={resourceTypes.data?.page.totalElements ?? 0}
                />
              </div>
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="font-medium">
                  {firstResource?.name ?? "No published resource selected"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {firstResource
                    ? `${firstResourceOrganization?.name ?? "Unknown organization"}, ${
                        firstResourceType?.name ?? firstResource.resourceTypeId
                      }`
                    : "Public discovery data will appear here when resources are returned."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function FilterSelect({
  label,
  value,
  onValueChange,
  items = [],
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  items?: Array<{ value: string; label: string }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value={ALL}>All</SelectItem>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

function ResourceTable({
  resources,
  organizationMap,
  providerMap,
  typeMap,
  categoryMap,
}: {
  resources: ResourceDto[]
  organizationMap: Map<string, { name: string; providerTypeId: number }>
  providerMap: Map<number, { name: string }>
  typeMap: Map<number, ResourceTypeDto>
  categoryMap: Map<number, { name: string }>
}) {
  return (
    <>
    <div className="grid gap-3 p-4 md:hidden">
      {resources.map((resource) => {
        const organization = organizationMap.get(resource.organizationId)
        const type = typeMap.get(resource.resourceTypeId)
        const category = type ? categoryMap.get(type.categoryId) : undefined
        const provider = organization
          ? providerMap.get(organization.providerTypeId)
          : undefined
        return (
          <div
            key={resource.id}
            className="rounded-lg border border-border bg-background p-3"
          >
            <div className="flex gap-3">
              <ResourceImage className="w-20 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium">{resource.name}</p>
                <p className="text-xs text-muted-foreground">
                  {organization?.name ?? "Unknown organization"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {category?.name ?? "Unknown category"} -{" "}
                  {provider?.name ?? "Unknown provider"} -{" "}
                  {type?.name ?? resource.resourceTypeId}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-muted-foreground">
                {resourceSpecificationSummary(resource, type)}
              </div>
              <StatusBadge status={resource.status} />
            </div>
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to={`/resources/${resource.id}`}>View Availability</Link>
            </Button>
          </div>
        )
      })}
    </div>
    <Table className="hidden min-w-[980px] md:table">
      <TableHeader>
        <TableRow>
          <TableHead>Resource</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Provider Type</TableHead>
          <TableHead>Specifications</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => {
          const organization = organizationMap.get(resource.organizationId)
          const type = typeMap.get(resource.resourceTypeId)
          const category = type ? categoryMap.get(type.categoryId) : undefined
          const provider = organization
            ? providerMap.get(organization.providerTypeId)
            : undefined
          return (
            <TableRow key={resource.id}>
              <TableCell>
                <div className="flex min-w-56 items-center gap-3">
                  <ResourceImage className="w-16 shrink-0" />
                  <div>
                    <p className="font-medium">{resource.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {type?.name ?? `Type ${resource.resourceTypeId}`}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{organization?.name ?? "Unknown"}</TableCell>
              <TableCell>{category?.name ?? "Unknown category"}</TableCell>
              <TableCell>{provider?.name ?? "Unknown provider"}</TableCell>
              <TableCell>{resourceSpecificationSummary(resource, type)}</TableCell>
              <TableCell>
                <StatusBadge status={resource.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/resources/${resource.id}`}>View Availability</Link>
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    </>
  )
}

function SummaryItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2Icon
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <Icon className="text-primary" />
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
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
