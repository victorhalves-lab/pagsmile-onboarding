import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm transition-all duration-200",
        "placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:border-[var(--pagsmile-green)] focus-visible:ring-4 focus-visible:ring-[var(--pagsmile-green)]/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "hover:border-slate-300",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }