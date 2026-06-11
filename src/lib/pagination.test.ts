import { describe, expect, it } from "vitest"

import { normalizePage } from "@/lib/pagination"

describe("normalizePage", () => {
  it("normalizes the live content + page shape", () => {
    const page = normalizePage({
      content: [{ id: 1 }],
      page: { size: 5, number: 0, totalElements: 1, totalPages: 1 },
    })

    expect(page.content).toHaveLength(1)
    expect(page.page).toEqual({
      size: 5,
      number: 0,
      totalElements: 1,
      totalPages: 1,
    })
  })

  it("normalizes classic Spring page fields", () => {
    const page = normalizePage({
      content: ["a", "b"],
      totalElements: 4,
      totalPages: 2,
      size: 2,
      number: 1,
    })

    expect(page.page.totalElements).toBe(4)
    expect(page.page.number).toBe(1)
  })
})
