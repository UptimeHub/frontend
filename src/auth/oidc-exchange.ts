const pendingExchanges = new Map<string, Promise<unknown>>()

export function runOidcExchangeOnce<T>(
  code: string,
  exchange: () => Promise<T>,
  exchanges: Map<string, Promise<unknown>> = pendingExchanges
) {
  const pendingExchange = exchanges.get(code) as Promise<T> | undefined
  if (pendingExchange) {
    return pendingExchange
  }

  const nextExchange = exchange().finally(() => {
    exchanges.delete(code)
  })

  exchanges.set(code, nextExchange)
  return nextExchange
}
