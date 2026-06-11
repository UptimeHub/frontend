import { describe, expect, it } from "vitest"

import { combineDateAndTime, toLocalDateTimeString } from "@/lib/datetime"

describe("datetime helpers", () => {
  it("formats Date values as local datetime strings without timezone suffix", () => {
    const value = new Date(2026, 5, 8, 9, 5, 7)

    expect(toLocalDateTimeString(value)).toBe("2026-06-08T09:05:07")
  })

  it("combines date and time for backend LocalDateTime inputs", () => {
    expect(combineDateAndTime("2026-06-08", "10:00")).toBe(
      "2026-06-08T10:00:00"
    )
  })
})
