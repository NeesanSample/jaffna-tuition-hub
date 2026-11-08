import { ToastContext } from './useToast'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Moon, Sun, X, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/button'
type Theme = 'light' | 'dark'
const ThemeContext = createContext<{theme:Theme;toggle:()=>void}>({theme:'light',toggle:()=>{}})
export function ThemeProvider({children}:{children:ReactNode}) {
 const [theme,setTheme]=useState<Theme>(()=>{try {const saved=localStorage.getItem('jth-theme');if(saved==='light'||saved==='dark')return saved}catch{}return window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'})
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;try{localStorage.setItem('jth-theme',theme)}catch{}},[theme])
 return <ThemeContext.Provider value={{theme,toggle:()=>setTheme(t=>t==='light'?'dark':'light')}}>{children}</ThemeContext.Provider>
}
export function ThemeToggle(){const {theme,toggle}=useContext(ThemeContext);return <Button variant="outline" className="icon-button" onClick={toggle} aria-label={`Switch to ${theme==='light'?'dark':'light'} mode`} title={`Switch to ${theme==='light'?'dark':'light'} mode`}>{theme==='light'?<Moon size={18}/>:<Sun size={18}/>}</Button>}

export function ToastProvider({children}:{children:ReactNode}){const [toast,setToast]=useState<{message:string;id:number}>();useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(undefined),6500);return()=>clearTimeout(timer)},[toast]);return <ToastContext.Provider value={message=>setToast({message,id:Date.now()})}>{children}<div className="toast-region" role="status" aria-live="polite">{toast&&<div className="toast" key={toast.id}><CheckCircle2 size={20}/><span>{toast.message}</span><Button variant="outline" className="icon-button" aria-label="Dismiss notification" onClick={()=>setToast(undefined)}><X size={16}/></Button></div>}</div></ToastContext.Provider>}


