import React from "react";

const PINBANK_LOGO = "https://media.base44.com/images/public/6983b65f017b96d5f695f9bb/c0c42c436_01-pinbank-logo-sunset.png";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4 relative overflow-hidden">
      {/* Pin Bank brand gradient accents */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0A0A0A] via-[#1356E2] to-[#E84B1C] z-50" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-[#1356E2]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-[#E84B1C]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Pin Bank Logo */}
        <div className="text-center mb-8">
          <img
            src={PINBANK_LOGO}
            alt="Pin Bank"
            className="h-10 w-auto mx-auto mb-6"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-[#0A0A0A]/8 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">{title}</h1>
            {subtitle && <p className="text-[#0A0A0A]/50 text-sm mt-1.5">{subtitle}</p>}
          </div>
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-[#0A0A0A]/50 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}