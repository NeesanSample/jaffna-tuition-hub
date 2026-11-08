import { lazy, Suspense } from 'react'
const Hub=lazy(()=>import('./App'))
const Pilot=lazy(()=>import('./features/pilot/PilotApp'))
export default function WorkspaceEntry(){const hub=window.location.pathname==='/hub'||window.location.pathname.startsWith('/hub/');return <Suspense fallback={<p role="status" style={{padding:32}}>Loading workspace…</p>}>{hub?<Hub/>:<Pilot/>}</Suspense>}
