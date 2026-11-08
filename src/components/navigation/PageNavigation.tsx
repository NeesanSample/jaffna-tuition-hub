import { useEffect, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Home } from 'lucide-react'
import { Button } from '../ui/button'
import { advanceTrail, backVisit, breadcrumbs, pageMemoryUrl, visitIndex } from './navigationModel'
import { readTrail, subscribeNavigation, writeMemory } from './navigationStore'
import { PageMemoryContext } from './PageMemory'

export function PageNavigation({ scope, home = '/dashboard', students = [], batches = [], children }: {
  scope: string; home?: string; students?: { id: string; name: string }[]; batches?: { id: string; name: string }[]; children: ReactNode
}) {
  const location = useLocation(), navigate = useNavigate(), action = useNavigationType()
  const url = location.pathname + location.search
  const crumbs = breadcrumbs(location.pathname, location.search, { url: home, label: home === '/' ? 'Overview' : 'Dashboard' }, students, batches)
  const trail = useSyncExternalStore(subscribeNavigation, () => readTrail(scope), () => readTrail(scope))
  // Router transitions may render the previous location after native history has
  // advanced. Associate an index only with its matching location key.
  const index = visitIndex(location.key, window.history.state, trail)
  const next = advanceTrail(trail, { key: location.key, url, label: crumbs.at(-1)!.label, index }, action)
  useEffect(() => { if (next !== trail) writeMemory(`jth-navigation:${scope}`, next) }, [scope, next, trail])
  const previous = backVisit(next)
  const parent = crumbs.length > 1 ? crumbs[crumbs.length - 2] : crumbs[0]
  const target = previous || parent
  const canGoBack = !!previous || target.url !== url
  function back() {
    if (!canGoBack) return
    if (previous && index !== undefined && previous.index !== undefined && previous.index < index) navigate(previous.index - index)
    else navigate(target.url, { replace: true })
  }
  return <PageMemoryContext value={{ scope, url: pageMemoryUrl(url) }}>
    <div className="page-navigation no-print">
      <Button variant="outline" size="sm" disabled={!canGoBack} onClick={back} aria-label={`Back to ${target.label}`}><ArrowLeft size={15} /><span>Back{canGoBack ? ` to ${target.label}` : ''}</span></Button>
      <nav aria-label="Breadcrumb" className="page-breadcrumbs"><ol>{crumbs.map((crumb, i) => <li key={`${crumb.url}-${i}`}>
        {i > 0 && <ChevronRight size={13} aria-hidden="true" />}
        {i === crumbs.length - 1 ? <span aria-current="page">{crumb.label}</span> : <Link to={crumb.url}>{i === 0 && <Home size={13} aria-hidden="true" />}{crumb.label}</Link>}
      </li>)}</ol></nav>
    </div>
    {children}
  </PageMemoryContext>
}
