const pad = (value: number) => String(value).padStart(2, "0")

export function toLocalDateTimeString(value: Date | string): string {
  if (typeof value === "string") {
    return value.replace(/\.\d+$/, "").replace(/Z$/, "").slice(0, 19)
  }

  return [
    value.getFullYear(),
    pad(value.getMonth() + 1),
    pad(value.getDate()),
  ].join("-") + `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
    value.getSeconds()
  )}`
}

export function toDateInputValue(value: Date): string {
  return [value.getFullYear(), pad(value.getMonth() + 1), pad(value.getDate())].join(
    "-"
  )
}

export function toTimeInputValue(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time.length === 5 ? `${time}:00` : time}`
}

export function addHours(value: Date, hours: number): Date {
  const next = new Date(value)
  next.setHours(next.getHours() + hours)
  return next
}

export function displayDateTime(value?: string): string {
  if (!value) return "-"
  const [date, time = ""] = value.split("T")
  return `${date} ${time.slice(0, 5)}`
}
