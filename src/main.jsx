import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './assets/styles.css'

console.log("APP VERSION: 2026-02-10 14:30 - Fixed single_choice & Logic");

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
