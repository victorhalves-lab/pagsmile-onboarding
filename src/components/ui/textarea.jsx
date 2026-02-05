import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#002443] shadow-sm placeholder:text-[#002443]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2bc196] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }