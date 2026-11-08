import { Timetable } from './features/timetable/Timetable'
import { AttendanceReports } from './features/reports/AttendanceReports'
import { Teaching } from './features/teaching/Teaching'
import { Classes } from './features/classes/Classes'
import { AttendancePage } from './features/attendance/AttendancePage'
import { FeesPage } from './features/fees/FeesPage'
import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom'
import { Dashboard } from './features/dashboard/Dashboard'
import type { Session, Snapshot } from './domain/entities'
import { repository } from './repositories/mockRepository'
import { Login } from './features/auth/Login'
import { Locations } from './features/locations/Locations'
import { Students, StudentProfile } from './features/students/Students'
import { Button } from './components/ui/button'
import { AppShell } from './components/layout/AppShell'
import { EmptyState, Feedback, LoadingSkeleton } from './components/shared/Primitives'
import { ThemeProvider, ToastProvider } from './contexts/Preferences'
import './App.css'
function Workspace({session,onLogout}:{session:Session;onLogout:()=>void}){
 const location=useLocation();const [data,setData]=useState<Snapshot>();const [error,setError]=useState('')
 const refresh=useCallback(async()=>{const next=await repository.snapshot(session);setData(next);setError('')},[session])
 useEffect(()=>{let live=true;repository.snapshot(session).then(next=>{if(live){setData(next);setError('')}}).catch(e=>{if(live)setError(e.message)});return()=>{live=false}},[session])
 return <AppShell session={session} data={data} onLogout={onLogout}>{error?<><Feedback error={error}/><Button onClick={()=>{void refresh().catch(e=>setError(e.message))}}>Try again</Button></>:!data?<LoadingSkeleton/>:<Routes><Route path="/" element={<Dashboard data={data}/>}/><Route path="/students" element={<Students key={location.search} data={data} session={session} refresh={refresh}/>}/><Route path="/students/:id" element={<StudentProfile data={data} session={session}/>}/><Route path="/centres" element={<Locations key={`centres-${location.search}`} kind="centres" data={data} session={session} refresh={refresh}/>}/><Route path="/branches" element={<Locations key={`branches-${location.search}`} kind="branches" data={data} session={session} refresh={refresh}/>}/><Route path="/teaching" element={<Teaching session={session} data={data}/>}/><Route path="/classes" element={<Classes key={location.search} session={session} data={data}/>}/><Route path="/timetable" element={<Timetable session={session} data={data}/>}/><Route path="/attendance/reports" element={<AttendanceReports session={session} data={data}/>}/><Route path="/attendance" element={<AttendancePage session={session} data={data}/>}/><Route path="/fees" element={<FeesPage session={session} data={data}/>}/><Route path="*" element={<EmptyState title="Page not found" description="This page may have moved. Your workspace is right here." action={<Button asChild><Link to="/">Back to overview</Link></Button>}/>}/></Routes>}</AppShell>
}
export default function App(){const [session,setSession]=useState<Session>();return <ThemeProvider><ToastProvider><BrowserRouter basename="/hub">{session?<Workspace key={`${session.role}-${session.centreId}-${session.branchId}`} session={session} onLogout={()=>setSession(undefined)}/>:<Login onLogin={setSession}/>}</BrowserRouter></ToastProvider></ThemeProvider>}


