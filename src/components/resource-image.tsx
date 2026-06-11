export function ResourceImage({
  alt = "Modern coworking conference room",
  className = "",
}: {
  alt?: string
  className?: string
}) {
  return (
    <img
      src="/assets/conference-room.png"
      alt={alt}
      className={`aspect-[16/10] rounded-lg border border-border object-cover ${className}`}
    />
  )
}
