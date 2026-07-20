import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#0A0A0A] shadow-sm placeholder:text-[#0A0A0A]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1356E2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }