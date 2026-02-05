import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-[var(--pagsmile-blue)]/20 bg-white px-4 py-2 text-base text-[var(--pagsmile-blue)] shadow-sm transition-all duration-200",
        "placeholder:text-[var(--pagsmile-blue)]/40",
        "focus-visible:outline-none focus-visible:border-[var(--pagsmile-green)] focus-visible:ring-4 focus-visible:ring-[var(--pagsmile-green)]/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-[var(--pagsmile-blue)]/40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }