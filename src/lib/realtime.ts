import { useEffect } from "react"
import { Client } from "@stomp/stompjs"
import { toast } from "sonner"
import type { QueryClient } from "@tanstack/react-query"

import { API_BASE_URL } from "@/lib/api"
import type { BookingStatusMessage } from "@/types/api"

export function useBookingRealtime(
  token: string | null,
  queryClient: QueryClient
) {
  useEffect(() => {
    if (!token) return

    let cancelled = false
    let client: Client | null = null

    void import("sockjs-client").then(({ default: SockJS }) => {
      if (cancelled) return

      client = new Client({
        webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 10_000,
        debug: () => undefined,
        onConnect: () => {
          client?.subscribe("/user/queue/booking-status", (message) => {
            const payload = JSON.parse(message.body) as BookingStatusMessage
            if (payload.status === "CONFIRMED") {
              toast.success("Booking confirmed", {
                description: `Booking ${payload.bookingId.slice(0, 8)} is active.`,
              })
            } else {
              toast.error("Booking failed", {
                description:
                  payload.reason ?? "The requested slot was not reserved.",
              })
            }
            queryClient.invalidateQueries({ queryKey: ["bookings"] })
            queryClient.invalidateQueries({ queryKey: ["availability"] })
          })
        },
        onStompError: () => {
          queryClient.invalidateQueries({ queryKey: ["bookings"] })
        },
      })

      client.activate()
    })

    return () => {
      cancelled = true
      if (client) {
        void client.deactivate()
      }
    }
  }, [queryClient, token])
}
