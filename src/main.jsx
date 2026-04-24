import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import App from '@/App.jsx'
import { ensureSdkLoaded } from '@/api/base44Client'

// Wait for the SDK to finish dynamic-importing before the first render, so
// authenticated pages don't hit the mock on first paint. On public onboarding
// routes this resolves instantly (SDK is skipped entirely).
ensureSdkLoaded().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
})