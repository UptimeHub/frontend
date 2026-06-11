export type UUID = string

export type OrganizationStatus = "ACTIVE" | "INACTIVE" | "PENDING"
export type CatalogStatus = "PUBLISHED" | "ARCHIVED" | "NOT_PUBLISHED"
export type ResourceStatus =
  | "PUBLISHED"
  | "MAINTENANCE"
  | "NOT_PUBLISHED"
  | "ARCHIVED"
  | "DELETED"
export type BookingStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED"
export type AvailabilityStatus = "AVAILABLE" | "UNAVAILABLE"
export type AdminRole = "ORGANIZATION_ADMIN" | "PLATFORM_ADMIN"
export type SpecificationDataType = "TEXT" | "NUMBER" | "BOOLEAN"

export interface PageMetadata {
  size: number
  number: number
  totalElements: number
  totalPages: number
}

export interface PageResponse<T> {
  content: T[]
  page?: Partial<PageMetadata>
  pageable?: unknown
  totalElements?: number
  totalPages?: number
  size?: number
  number?: number
  numberOfElements?: number
  empty?: boolean
}

export interface NormalizedPage<T> {
  content: T[]
  page: PageMetadata
}

export interface ProviderTypeDto {
  id: number
  name: string
  description: string
}

export interface OrganizationSummaryResponse {
  id: UUID
  name: string
  taxpayerIdNumber: string
  email: string
  providerTypeId: number
}

export interface OrganizationDetailedResponse
  extends OrganizationSummaryResponse {
  status: OrganizationStatus
  createdAt: string
  updatedAt: string
}

export interface OrganizationCreateRequest {
  name: string
  taxpayerIdNumber: string
  email: string
  providerTypeId: number
}

export interface OrganizationUpdateRequest
  extends Partial<OrganizationCreateRequest> {
  id: UUID
}

export interface AdminCreateRequest {
  organizationId: UUID | null
  firstName: string
  lastName: string
  username: string
  email: string
  password: string
  role: AdminRole
}

export interface UserResponse {
  id: UUID
  firstName: string
  lastName: string
  username: string
  email: string
  role: AdminRole
  organizationId: UUID | null
}

export interface CategoryDto {
  id: number
  name: string
  description: string
  status: CatalogStatus
  createdAt?: string
  updatedAt?: string
  createdBy?: UUID
  updatedBy?: UUID
}

export interface SpecificationDefinition {
  name: string
  label: string
  required: boolean
  searchable: boolean
  filterable: boolean
  dataType: SpecificationDataType
}

export interface ResourceTypeDto {
  id: number
  name: string
  description: string
  status: CatalogStatus
  categoryId: number
  specificationDefinitions: SpecificationDefinition[]
  createdAt?: string
  updatedAt?: string
  createdBy?: UUID
  updatedBy?: UUID
}

export interface ResourceDto {
  id: UUID
  organizationId: UUID
  name: string
  description: string
  status: ResourceStatus
  resourceTypeId: number
  customCharacteristics?: Record<string, string>
  specificationValues?: Record<string, string | number | boolean>
}

export interface DetailedResourceResponse extends ResourceDto {
  createdAt?: string
  updatedAt?: string
  createdBy?: UUID
  updatedBy?: UUID
}

export interface ResourceCreateRequest {
  name: string
  description: string
  resourceTypeId: number
  organizationId: UUID
  customCharacteristics?: Record<string, string>
  specificationValues?: Record<string, string | number | boolean>
}

export interface ResourceUpdateRequest extends Partial<ResourceCreateRequest> {
  id: UUID
  status?: ResourceStatus
}

export interface BookingCreateRequest {
  resourceId: UUID
  startTime: string
  endTime: string
}

export interface BookingDto extends BookingCreateRequest {
  id: UUID
  organizationId: UUID
  userId: UUID
  status: BookingStatus
  createdAt: string
  updatedAt: string
}

export interface AvailabilityPeriodDto {
  startTime: string
  endTime: string
  status: AvailabilityStatus
}

export interface AvailabilityResponse {
  resourceId: UUID
  from: string
  to: string
  periods: AvailabilityPeriodDto[]
}

export interface BookingStatusMessage {
  userId: UUID
  bookingId: UUID
  resourceId: UUID
  status: "CONFIRMED" | "FAILED"
  reason: string | null
  occurredAt: string
}

export interface ResourceFilters {
  id?: UUID
  organizationId?: UUID
  name?: string
  search?: string
  resourceTypeId?: number
  status?: ResourceStatus
  page?: number
  size?: number
  sort?: string
}

export interface BookingFilters {
  status?: BookingStatus
  resourceId?: UUID
  userId?: UUID
  from?: string
  to?: string
  page?: number
  size?: number
  sort?: string
}

export interface ApiErrorPayload {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
  fieldErrors?: Record<string, string>
}
