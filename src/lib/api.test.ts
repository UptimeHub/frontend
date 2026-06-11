import { afterEach, describe, expect, it, vi } from "vitest"

import { apiRequest, setAccessTokenProvider } from "@/lib/api"

describe("apiRequest", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setAccessTokenProvider(() => null)
  })

  it("sends only bearer Authorization for authenticated requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    )
    vi.stubGlobal("fetch", fetchMock)
    setAccessTokenProvider(() => "abc")

    await apiRequest<{ ok: boolean }>("/api/resource")

    const headers = fetchMock.mock.calls[0][1].headers as Headers
    expect(headers.get("Authorization")).toBe("Bearer abc")
    expect(headers.has("X-User-Id")).toBe(false)
  })

  it("parses structured API error payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: 400,
            error: "VALIDATION_ERROR",
            message: "Validation failed",
            fieldErrors: { name: "Name is required" },
          }),
          {
            status: 400,
            headers: { "content-type": "application/json" },
          }
        )
      )
    )

    await expect(apiRequest("/api/resource")).rejects.toMatchObject({
      status: 400,
      payload: { fieldErrors: { name: "Name is required" } },
    })
  })
})
