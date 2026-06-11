import { describe, expect, it } from "vitest"

import { runOidcExchangeOnce } from "@/auth/oidc-exchange"

describe("oidc exchange lock", () => {
  it("reuses the same pending exchange for duplicate authorization codes", async () => {
    const exchanges = new Map<string, Promise<unknown>>()
    let exchangeCount = 0

    const first = runOidcExchangeOnce(
      "code-a",
      async () => {
        exchangeCount += 1
        return "token-a"
      },
      exchanges
    )
    const second = runOidcExchangeOnce("code-a", async () => "token-b", exchanges)

    expect(first).toBe(second)
    await expect(first).resolves.toBe("token-a")
    expect(exchangeCount).toBe(1)
  })

  it("allows retry after a completed exchange", async () => {
    const exchanges = new Map<string, Promise<unknown>>()

    await expect(
      runOidcExchangeOnce("code-a", async () => "token-a", exchanges)
    ).resolves.toBe("token-a")

    await expect(
      runOidcExchangeOnce("code-a", async () => "token-b", exchanges)
    ).resolves.toBe("token-b")
  })
})
