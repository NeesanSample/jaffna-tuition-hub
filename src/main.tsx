import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import WorkspaceEntry from './WorkspaceEntry'

createRoot(document.getElementById('root')!).render(<StrictMode><WorkspaceEntry/></StrictMode>)
