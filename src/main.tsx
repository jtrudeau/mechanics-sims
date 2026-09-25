import React from 'react'
import ReactDOM from 'react-dom/client'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import './index.css'
import { applyStoredTheme } from './theme'

applyStoredTheme()
window.addEventListener('storage', (event) => {
  if (event.key === 'sn1-theme' && (event.newValue === 'dark' || event.newValue === 'light')) {
    document.documentElement.dataset.theme = event.newValue
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
