import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    (<div
      className={cn("animate-pulse rounded-md bg-[#0A0A0A]/10", className)}
      {...props} />)
  );
}

export { Skeleton }