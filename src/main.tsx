import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ChaiProvider } from './context/ChaiContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChaiProvider>
      <App />
    </ChaiProvider>
  </StrictMode>,
)
