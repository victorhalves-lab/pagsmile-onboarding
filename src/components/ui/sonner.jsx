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
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#002443] group-[.toaster]:border-slate-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#002443]/70",
          actionButton:
            "group-[.toast]:bg-[#2bc196] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-slate-100 group-[.toast]:text-[#002443]",
          success: "group-[.toaster]:border-[#2bc196] group-[.toaster]:text-[#002443]",
          error: "group-[.toaster]:border-red-500 group-[.toaster]:text-[#002443]",
        },
      }}
      {...props} />)
  );
}

export { Toaster }