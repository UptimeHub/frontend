import type {
  AdminCreateRequest,
  AdminRole,
  ApiErrorPayload,
  AvailabilityResponse,
  BookingCreateRequest,
  BookingDto,
  BookingFilters,
  CategoryDto,
  DetailedResourceResponse,
  NormalizedPage,
  OrganizationCreateRequest,
  OrganizationDetailedResponse,
  OrganizationSummaryResponse,
  OrganizationUpdateRequest,
  PageResponse,
  ProviderTypeDto,
  ResourceCreateRequest,
  ResourceDto,
  ResourceFilters,
  ResourceTypeDto,
  ResourceUpdateRequest,
  UserResponse,
  UUID,
} from "@/types/api"
import { normalizePage } from "@/lib/pagination"

const DEFAULT_API_BASE_URL = "http://84.247.166.242:8899"

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ??
  (import.meta.env.DEV ? "/gateway" : DEFAULT_API_BASE_URL)

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue | QueryValue[]>

let accessTokenProvider: () => string | null = () => null

export function setAccessTokenProvider(provider: () => string | null) {
  accessTokenProvider = provider
}

export class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(status: number, payload?: ApiErrorPayload) {
    super(payload?.message || payload?.error || `Request failed with ${status}`)
    this.name = "ApiError"
    this.status = status
    this.payload = payload
  }
}

function appendQuery(path: string, query?: QueryParams): string {
  if (!query) return path
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    const values = Array.isArray(value) ? value : [value]
    values.forEach((item) => {
      if (item !== undefined && item !== null && item !== "") {
        params.append(key, String(item))
      }
    })
  })

  const search = params.toString()
  return search ? `${path}${path.includes("?") ? "&" : "?"}${search}` : path
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    return (await response.json()) as T
  }

  return (await response.text()) as T
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { query?: QueryParams } = {}
): Promise<T> {
  const token = accessTokenProvider()
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  let body = init.body
  if (
    body &&
    typeof body === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json")
  }

  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof Blob)
  ) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${appendQuery(path, init.query)}`, {
    ...init,
    headers,
    body,
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | undefined
    try {
      payload = await parseResponse<ApiErrorPayload>(response)
    } catch {
      payload = undefined
    }
    throw new ApiError(response.status, payload)
  }

  return parseResponse<T>(response)
}

function asPage<T>(response: PageResponse<T> | T[]): NormalizedPage<T> {
  return normalizePage(response)
}

export const coreApi = {
  providerTypes: (query?: QueryParams) =>
    apiRequest<PageResponse<ProviderTypeDto>>("/api/core/provider-type/all", {
      query,
    }).then(asPage),
  createProviderType: (body: Omit<ProviderTypeDto, "id">) =>
    apiRequest<ProviderTypeDto>("/api/core/provider-type", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProviderType: (body: ProviderTypeDto) =>
    apiRequest<ProviderTypeDto>("/api/core/provider-type", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  organizations: (query?: QueryParams) =>
    apiRequest<PageResponse<OrganizationSummaryResponse>>(
      "/api/core/organization/all",
      { query }
    ).then(asPage),
  organizationSummary: (id: UUID) =>
    apiRequest<OrganizationSummaryResponse>(`/api/core/organization/summary/${id}`),
  organizationDetailed: (id: UUID) =>
    apiRequest<OrganizationDetailedResponse>(
      `/api/core/organization/detailed/${id}`
    ),
  createOrganization: (body: OrganizationCreateRequest) =>
    apiRequest<OrganizationDetailedResponse>("/api/core/organization", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOrganization: (body: OrganizationUpdateRequest) =>
    apiRequest<OrganizationDetailedResponse>("/api/core/organization", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  setOrganizationStatus: (organizationId: UUID, activate: boolean) =>
    apiRequest<void>("/api/core/organization/status", {
      method: "POST",
      query: { organizationId, activate },
    }),
  adminUsers: (role: AdminRole, organizationId?: UUID) =>
    apiRequest<UserResponse[]>("/api/core/admin-user/all", {
      query: { role, organizationId },
    }),
  createAdminUser: (body: AdminCreateRequest) =>
    apiRequest<void>("/api/core/admin-user/", {
      method: "POST",
      body: JSON.stringify(body),
    }),
}

export const resourceApi = {
  categories: (query?: QueryParams) =>
    apiRequest<PageResponse<CategoryDto>>("/api/resource/category", {
      query,
    }).then(asPage),
  categoryFilters: () =>
    apiRequest<Record<string, string[]>>("/api/resource/category/filters"),
  createCategory: (body: Pick<CategoryDto, "name" | "description">) =>
    apiRequest<CategoryDto>("/api/resource/category", {
      method: "POST",
      query: body,
    }),
  updateCategory: (body: Partial<CategoryDto> & { id: number }) =>
    apiRequest<void>("/api/resource/category", {
      method: "PATCH",
      query: body as QueryParams,
    }),
  resourceTypes: (query?: QueryParams) =>
    apiRequest<PageResponse<ResourceTypeDto>>("/api/resource/type", {
      query,
    }).then(asPage),
  typeFilters: () =>
    apiRequest<Record<string, string[]>>("/api/resource/type/filters"),
  createResourceType: (
    body: Omit<ResourceTypeDto, "id" | "status" | "createdAt" | "updatedAt">
  ) =>
    apiRequest<ResourceTypeDto>("/api/resource/type", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateResourceType: (body: Partial<ResourceTypeDto> & { id: number }) =>
    apiRequest<void>("/api/resource/type", {
      method: "PATCH",
      query: {
        id: body.id,
        name: body.name,
        description: body.description,
        status: body.status,
        categoryId: body.categoryId,
      },
    }),
  resources: (query?: ResourceFilters) =>
    apiRequest<PageResponse<ResourceDto>>("/api/resource", {
      query: query as QueryParams | undefined,
    }).then(asPage),
  resource: (resourceId: UUID) =>
    apiRequest<ResourceDto | DetailedResourceResponse>(`/api/resource/${resourceId}`),
  createResource: (body: ResourceCreateRequest) =>
    apiRequest<DetailedResourceResponse>("/api/resource", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateResource: (body: ResourceUpdateRequest) =>
    apiRequest<void>("/api/resource", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
}

export const bookingApi = {
  availability: (resourceId: UUID, from: string, to: string) =>
    apiRequest<AvailabilityResponse>(
      `/api/booking/resource/availability/${resourceId}`,
      { query: { from, to } }
    ),
  create: (body: BookingCreateRequest) =>
    apiRequest<BookingDto>("/api/booking", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  myBookings: (query?: BookingFilters) =>
    apiRequest<PageResponse<BookingDto>>("/api/booking/my", {
      query: query as QueryParams | undefined,
    }).then(asPage),
  booking: (bookingId: UUID) =>
    apiRequest<BookingDto>(`/api/booking/${bookingId}`),
  cancelMine: (bookingId: UUID) =>
    apiRequest<BookingDto>(`/api/booking/${bookingId}/cancel`, {
      method: "POST",
    }),
  adminBookings: (query?: BookingFilters) =>
    apiRequest<PageResponse<BookingDto>>("/api/admin/booking", {
      query: query as QueryParams | undefined,
    }).then(asPage),
  currentForResource: (resourceId: UUID) =>
    apiRequest<BookingDto[]>("/api/admin/booking/current", {
      query: { resourceId },
    }),
  cancelAsAdmin: (bookingId: UUID) =>
    apiRequest<BookingDto>(`/api/admin/booking/${bookingId}/cancel`, {
      method: "POST",
    }),
}
