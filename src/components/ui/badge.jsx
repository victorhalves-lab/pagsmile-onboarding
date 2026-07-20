import * as React from "react"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1356E2] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#1356E2] text-white shadow hover:bg-[#1356E2]/80",
        secondary:
          "border-transparent bg-slate-100 text-[#0A0A0A] hover:bg-slate-200",
        destructive:
          "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        outline: "text-[#0A0A0A] border-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }