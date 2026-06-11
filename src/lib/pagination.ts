import type { NormalizedPage, PageResponse } from "@/types/api"

export function normalizePage<T>(input: PageResponse<T> | T[]): NormalizedPage<T> {
  if (Array.isArray(input)) {
    return {
      content: input,
      page: {
        size: input.length,
        number: 0,
        totalElements: input.length,
        totalPages: input.length ? 1 : 0,
      },
    }
  }

  const content = Array.isArray(input.content) ? input.content : []
  const page = input.page ?? {}
  const size = page.size ?? input.size ?? content.length
  const number = page.number ?? input.number ?? 0
  const totalElements = page.totalElements ?? input.totalElements ?? content.length
  const totalPages =
    page.totalPages ??
    input.totalPages ??
    (size > 0 ? Math.ceil(totalElements / size) : 0)

  return {
    content,
    page: { size, number, totalElements, totalPages },
  }
}
