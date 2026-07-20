"use client";
import { Toaster as Sonner } from "sonner"

const Toaster = ({
  ...props
}) => {
  return (
    (<Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#0A0A0A] group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#0A0A0A]/70",
          actionButton:
            "group-[.toast]:bg-[#1356E2] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-[#0A0A0A]",
          success: "group-[.toaster]:border-[#1356E2] group-[.toaster]:text-[#0A0A0A]",
          error: "group-[.toaster]:border-red-500 group-[.toaster]:text-[#0A0A0A]",
        },
      }}
      {...props} />)
  );
}

export { Toaster }