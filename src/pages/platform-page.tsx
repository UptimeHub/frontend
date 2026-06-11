import { useMemo } from "react"
import type { FormEventHandler, ReactNode } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArchiveIcon,
  Building2Icon,
  PlusIcon,
  ShieldCheckIcon,
  TagsIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { ErrorBlock, LoadingBlock } from "@/components/data-state"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { coreApi, resourceApi } from "@/lib/api"
import type { AdminRole, CatalogStatus, SpecificationDefinition } from "@/types/api"

const organizationSchema = z.object({
  name: z.string().min(2),
  taxpayerIdNumber: z.string().min(2),
  email: z.string().email(),
  providerTypeId: z.number().min(1),
})

const providerTypeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
})

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
})

const specificationDataTypes = ["TEXT", "NUMBER", "BOOLEAN"] as const

const specificationDefinitionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  label: z.string().trim().min(1, "Label is required"),
  required: z.boolean(),
  searchable: z.boolean(),
  filterable: z.boolean(),
  dataType: z.enum(specificationDataTypes),
})

const resourceTypeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  categoryId: z.number().min(1),
  specificationDefinitions: z.array(specificationDefinitionSchema),
})

const adminUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  username: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4),
  role: z.enum(["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"]),
  organizationId: z.string().optional(),
})

export function PlatformPage() {
  const queryClient = useQueryClient()
  const providerTypes = useQuery({
    queryKey: ["provider-types", "platform"],
    queryFn: () => coreApi.providerTypes({ size: 50, sort: "name,asc" }),
  })
  const organizations = useQuery({
    queryKey: ["organizations", "platform"],
    queryFn: () => coreApi.organizations({ size: 50, sort: "name,asc" }),
  })
  const categories = useQuery({
    queryKey: ["categories", "platform"],
    queryFn: () => resourceApi.categories({ size: 50, sort: "name,asc" }),
  })
  const resourceTypes = useQuery({
    queryKey: ["resource-types", "platform"],
    queryFn: () => resourceApi.resourceTypes({ size: 50, sort: "name,asc" }),
  })
  const selectedOrganizationId = organizations.data?.content[0]?.id
  const platformAdmins = useQuery({
    queryKey: ["admin-users", "platform"],
    queryFn: () => coreApi.adminUsers("PLATFORM_ADMIN"),
  })
  const organizationAdmins = useQuery({
    queryKey: ["admin-users", "organization", selectedOrganizationId],
    queryFn: () =>
      coreApi.adminUsers("ORGANIZATION_ADMIN", selectedOrganizationId),
    enabled: Boolean(selectedOrganizationId),
  })

  const providerMap = useMemo(
    () => new Map(providerTypes.data?.content.map((item) => [item.id, item])),
    [providerTypes.data]
  )
  const categoryMap = useMemo(
    () => new Map(categories.data?.content.map((item) => [item.id, item])),
    [categories.data]
  )

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ["provider-types"] })
    queryClient.invalidateQueries({ queryKey: ["organizations"] })
    queryClient.invalidateQueries({ queryKey: ["categories"] })
    queryClient.invalidateQueries({ queryKey: ["resource-types"] })
    queryClient.invalidateQueries({ queryKey: ["admin-users"] })
  }

  return (
    <main className="min-w-0 px-4 py-5 lg:px-6">
      <section className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Platform Admin - Catalog & Administration
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations, provider taxonomy, resource catalog, and admin
            users.
          </p>
        </div>

        <Tabs defaultValue="organizations" className="flex flex-col gap-5">
          <TabsList className="w-fit">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="provider-types">Provider Types</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="resource-types">Resource Types</TabsTrigger>
            <TabsTrigger value="admin-users">Admin Users</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel title="Organizations" error={organizations.error} loading={organizations.isLoading}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Provider Type</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(organizations.data?.content ?? []).map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>
                          {providerMap.get(org.providerTypeId)?.name ?? org.providerTypeId}
                        </TableCell>
                        <TableCell>{org.email}</TableCell>
                        <TableCell className="text-right">
                          <OrganizationStatusButtons organizationId={org.id} onDone={invalidateCatalog} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Panel>
              <CreateOrganizationForm
                providerTypes={providerTypes.data?.content ?? []}
                onDone={invalidateCatalog}
              />
            </div>
          </TabsContent>

          <TabsContent value="provider-types" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel title="Provider Types" error={providerTypes.error} loading={providerTypes.isLoading}>
                <SimpleTable
                  columns={["Name", "Description"]}
                  rows={(providerTypes.data?.content ?? []).map((item) => [
                    item.name,
                    item.description,
                  ])}
                />
              </Panel>
              <CreateProviderTypeForm onDone={invalidateCatalog} />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel title="Categories" error={categories.error} loading={categories.isLoading}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categories.data?.content ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CatalogStatusButtons
                            status={item.status}
                            onChange={(status) =>
                              resourceApi
                                .updateCategory({ id: item.id, status })
                                .then(invalidateCatalog)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Panel>
              <CreateCategoryForm onDone={invalidateCatalog} />
            </div>
          </TabsContent>

          <TabsContent value="resource-types" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel title="Resource Types" error={resourceTypes.error} loading={resourceTypes.isLoading}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Specifications</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(resourceTypes.data?.content ?? []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {categoryMap.get(item.categoryId)?.name ?? item.categoryId}
                        </TableCell>
                        <TableCell>{item.specificationDefinitions.length}</TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <CatalogStatusButtons
                            status={item.status}
                            onChange={(status) =>
                              resourceApi
                                .updateResourceType({ id: item.id, status })
                                .then(invalidateCatalog)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Panel>
              <CreateResourceTypeForm
                categories={categories.data?.content ?? []}
                onDone={invalidateCatalog}
              />
            </div>
          </TabsContent>

          <TabsContent value="admin-users" className="mt-0">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Panel
                title="Admin Users"
                error={platformAdmins.error ?? organizationAdmins.error}
                loading={platformAdmins.isLoading || organizationAdmins.isLoading}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(platformAdmins.data ?? []), ...(organizationAdmins.data ?? [])].map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.organizationId?.slice(0, 8) ?? "Platform"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Panel>
              <CreateAdminUserForm
                organizations={organizations.data?.content ?? []}
                onDone={invalidateCatalog}
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

function Panel({
  title,
  children,
  loading,
  error,
}: {
  title: string
  children: ReactNode
  loading?: boolean
  error?: unknown
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-xs">
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-medium">{title}</p>
      </div>
      {loading ? <LoadingBlock rows={5} /> : null}
      {error ? <ErrorBlock error={error} /> : null}
      {!loading && !error ? <div className="overflow-x-auto">{children}</div> : null}
    </div>
  )
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={`${row[0]}-${rowIndex}`}>
            {row.map((cell, cellIndex) => (
              <TableCell key={`${cell}-${cellIndex}`}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function OrganizationStatusButtons({
  organizationId,
  onDone,
}: {
  organizationId: string
  onDone: () => void
}) {
  const mutation = useMutation({
    mutationFn: (activate: boolean) =>
      coreApi.setOrganizationStatus(organizationId, activate),
    onSuccess: onDone,
    onError: (error) => {
      toast.error("Could not update organization", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="xs" onClick={() => mutation.mutate(true)}>
        Activate
      </Button>
      <Button variant="outline" size="xs" onClick={() => mutation.mutate(false)}>
        Deactivate
      </Button>
    </div>
  )
}

function CatalogStatusButtons({
  status,
  onChange,
}: {
  status: CatalogStatus
  onChange: (status: CatalogStatus) => Promise<void>
}) {
  const mutation = useMutation({
    mutationFn: onChange,
    onSuccess: () => toast.success("Status updated"),
    onError: (error) => {
      toast.error("Could not update status", {
        description: error instanceof Error ? error.message : undefined,
      })
    },
  })
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="xs"
        disabled={status === "PUBLISHED"}
        onClick={() => mutation.mutate("PUBLISHED")}
      >
        Publish
      </Button>
      <Button
        variant="outline"
        size="xs"
        disabled={status === "ARCHIVED"}
        onClick={() => mutation.mutate("ARCHIVED")}
      >
        <ArchiveIcon data-icon="inline-start" />
        Archive
      </Button>
    </div>
  )
}

function CreateOrganizationForm({
  providerTypes,
  onDone,
}: {
  providerTypes: Array<{ id: number; name: string }>
  onDone: () => void
}) {
  const form = useForm<z.infer<typeof organizationSchema>>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      taxpayerIdNumber: "",
      email: "",
      providerTypeId: providerTypes[0]?.id ?? 1,
    },
  })
  const selectedProviderTypeId = useWatch({
    control: form.control,
    name: "providerTypeId",
  })
  const mutation = useMutation({
    mutationFn: coreApi.createOrganization,
    onSuccess: () => {
      toast.success("Organization created")
      form.reset()
      onDone()
    },
  })
  return (
    <FormCard
      icon={Building2Icon}
      title="Add Organization"
      description="Create an organization with pending status."
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      disabled={mutation.isPending}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} />
        </Field>
        <Field>
          <FieldLabel>Taxpayer ID</FieldLabel>
          <Input {...form.register("taxpayerIdNumber")} />
        </Field>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field>
          <FieldLabel>Provider Type</FieldLabel>
          <Select
            value={String(selectedProviderTypeId)}
            onValueChange={(value) => form.setValue("providerTypeId", Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {providerTypes.map((type) => (
                  <SelectItem key={type.id} value={String(type.id)}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
    </FormCard>
  )
}

function CreateProviderTypeForm({ onDone }: { onDone: () => void }) {
  const form = useForm<z.infer<typeof providerTypeSchema>>({
    resolver: zodResolver(providerTypeSchema),
    defaultValues: { name: "", description: "" },
  })
  const mutation = useMutation({
    mutationFn: coreApi.createProviderType,
    onSuccess: () => {
      toast.success("Provider type created")
      form.reset()
      onDone()
    },
  })
  return (
    <FormCard
      icon={TagsIcon}
      title="Add Provider Type"
      description="Provider types power public organization filters."
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      disabled={mutation.isPending}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={3} {...form.register("description")} />
        </Field>
      </FieldGroup>
    </FormCard>
  )
}

function CreateCategoryForm({ onDone }: { onDone: () => void }) {
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", description: "" },
  })
  const mutation = useMutation({
    mutationFn: resourceApi.createCategory,
    onSuccess: () => {
      toast.success("Category created")
      form.reset()
      onDone()
    },
  })
  return (
    <FormCard
      icon={TagsIcon}
      title="Add Category"
      description="Category create uses query parameters per the API docs."
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      disabled={mutation.isPending}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={3} {...form.register("description")} />
        </Field>
      </FieldGroup>
    </FormCard>
  )
}

function CreateResourceTypeForm({
  categories,
  onDone,
}: {
  categories: Array<{ id: number; name: string }>
  onDone: () => void
}) {
  const emptySpecification = (): SpecificationDefinition => ({
    name: "",
    label: "",
    required: false,
    searchable: false,
    filterable: false,
    dataType: "TEXT",
  })
  const form = useForm<z.infer<typeof resourceTypeSchema>>({
    resolver: zodResolver(resourceTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: categories[0]?.id ?? 1,
      specificationDefinitions: [],
    },
  })
  const specificationFields = useFieldArray({
    control: form.control,
    name: "specificationDefinitions",
  })
  const selectedCategoryId = useWatch({
    control: form.control,
    name: "categoryId",
  })
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof resourceTypeSchema>) =>
      resourceApi.createResourceType({
        name: values.name,
        description: values.description,
        categoryId: values.categoryId,
        specificationDefinitions: values.specificationDefinitions,
      }),
    onSuccess: () => {
      toast.success("Resource type created")
      form.reset({
        name: "",
        description: "",
        categoryId: categories[0]?.id ?? 1,
        specificationDefinitions: [],
      })
      onDone()
    },
  })
  return (
    <FormCard
      icon={TagsIcon}
      title="Add Resource Type"
      description="Define the resource metadata fields required by the API."
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      disabled={mutation.isPending}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Name</FieldLabel>
          <Input {...form.register("name")} />
        </Field>
        <Field>
          <FieldLabel>Description</FieldLabel>
          <Textarea rows={3} {...form.register("description")} />
        </Field>
        <Field>
          <FieldLabel>Category</FieldLabel>
          <Select
            value={String(selectedCategoryId)}
            onValueChange={(value) => form.setValue("categoryId", Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Specifications</FieldLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => specificationFields.append(emptySpecification())}
            >
              <PlusIcon data-icon="inline-start" />
              Add spec
            </Button>
          </div>
          {specificationFields.fields.length ? (
            <div className="flex flex-col gap-4">
              {specificationFields.fields.map((field, index) => {
                const baseName = `specificationDefinitions.${index}` as const
                const errors =
                  form.formState.errors.specificationDefinitions?.[index]

                return (
                  <div
                    key={field.id}
                    className="flex flex-col gap-3 border-t pt-4 first:border-t-0 first:pt-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Specification {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove specification ${index + 1}`}
                        onClick={() => specificationFields.remove(index)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                    <div className="grid gap-3">
                      <Field data-invalid={Boolean(errors?.name)}>
                        <FieldLabel htmlFor={`${field.id}-name`}>
                          Name
                        </FieldLabel>
                        <Input
                          id={`${field.id}-name`}
                          aria-invalid={Boolean(errors?.name)}
                          placeholder="capacity"
                          {...form.register(`${baseName}.name`)}
                        />
                        <FieldError errors={[errors?.name]} />
                      </Field>
                      <Field data-invalid={Boolean(errors?.label)}>
                        <FieldLabel htmlFor={`${field.id}-label`}>
                          Label
                        </FieldLabel>
                        <Input
                          id={`${field.id}-label`}
                          aria-invalid={Boolean(errors?.label)}
                          placeholder="Capacity"
                          {...form.register(`${baseName}.label`)}
                        />
                        <FieldError errors={[errors?.label]} />
                      </Field>
                      <Field>
                        <FieldLabel>Data type</FieldLabel>
                        <Controller
                          control={form.control}
                          name={`${baseName}.dataType`}
                          render={({ field: dataTypeField }) => (
                            <Select
                              value={dataTypeField.value}
                              onValueChange={dataTypeField.onChange}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {specificationDataTypes.map((dataType) => (
                                    <SelectItem
                                      key={dataType}
                                      value={dataType}
                                    >
                                      {dataType}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </Field>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ["required", "Required"],
                        ["searchable", "Searchable"],
                        ["filterable", "Filterable"],
                      ].map(([key, label]) => {
                        const checkboxId = `${field.id}-${key}`
                        return (
                          <Controller
                            key={key}
                            control={form.control}
                            name={`${baseName}.${key as "required" | "searchable" | "filterable"}`}
                            render={({ field: checkboxField }) => (
                              <Field
                                orientation="horizontal"
                                className="rounded-md border border-input px-2.5 py-2"
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={checkboxField.value}
                                  onCheckedChange={(checked) =>
                                    checkboxField.onChange(checked === true)
                                  }
                                />
                                <FieldLabel htmlFor={checkboxId}>
                                  {label}
                                </FieldLabel>
                              </Field>
                            )}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <FieldDescription>
              No specifications added.
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </FormCard>
  )
}

function CreateAdminUserForm({
  organizations,
  onDone,
}: {
  organizations: Array<{ id: string; name: string }>
  onDone: () => void
}) {
  const form = useForm<z.infer<typeof adminUserSchema>>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      role: "ORGANIZATION_ADMIN",
      organizationId: organizations[0]?.id,
    },
  })
  const role = useWatch({ control: form.control, name: "role" })
  const organizationId = useWatch({ control: form.control, name: "organizationId" })
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof adminUserSchema>) =>
      coreApi.createAdminUser({
        ...values,
        role: values.role as AdminRole,
        organizationId:
          values.role === "ORGANIZATION_ADMIN"
            ? values.organizationId ?? organizations[0]?.id ?? null
            : null,
      }),
    onSuccess: () => {
      toast.success("Admin user created")
      form.reset()
      onDone()
    },
  })
  return (
    <FormCard
      icon={ShieldCheckIcon}
      title="Add Admin User"
      description="Creates platform or organization admins in Keycloak."
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      disabled={mutation.isPending}
    >
      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>First name</FieldLabel>
            <Input {...form.register("firstName")} />
          </Field>
          <Field>
            <FieldLabel>Last name</FieldLabel>
            <Input {...form.register("lastName")} />
          </Field>
        </div>
        <Field>
          <FieldLabel>Username</FieldLabel>
          <Input {...form.register("username")} />
        </Field>
        <Field>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" {...form.register("email")} />
        </Field>
        <Field>
          <FieldLabel>Password</FieldLabel>
          <Input type="password" {...form.register("password")} />
        </Field>
        <Field>
          <FieldLabel>Role</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => form.setValue("role", value as AdminRole)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ORGANIZATION_ADMIN">ORGANIZATION_ADMIN</SelectItem>
                <SelectItem value="PLATFORM_ADMIN">PLATFORM_ADMIN</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        {role === "ORGANIZATION_ADMIN" ? (
          <Field>
            <FieldLabel>Organization</FieldLabel>
            <Select
              value={organizationId}
              onValueChange={(value) => form.setValue("organizationId", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </FieldGroup>
    </FormCard>
  )
}

function FormCard({
  icon: Icon,
  title,
  description,
  children,
  onSubmit,
  disabled,
}: {
  icon: typeof Building2Icon
  title: string
  description: string
  children: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
  disabled?: boolean
}) {
  return (
    <Card className="rounded-lg shadow-xs">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-5" onSubmit={onSubmit}>
          {children}
          <FieldDescription>
            Protected requests require a valid PLATFORM_ADMIN token.
          </FieldDescription>
          <Button type="submit" disabled={disabled}>
            <PlusIcon data-icon="inline-start" />
            Create
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
