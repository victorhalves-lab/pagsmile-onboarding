import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
// Install global SDK crash shield BEFORE any render. Even on public routes where
// the SDK is never imported, the platform may inject it asynchronously and crash
// with "Right-hand side of 'instanceof' is not callable" on anonymous visitors.
import '@/api/base44Client'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)