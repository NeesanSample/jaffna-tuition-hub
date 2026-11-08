export interface Crumb { label: string; url: string }
export interface Visit extends Crumb { key: string; index?: number }
export interface Trail { entries: Visit[]; cursor: number }
export const emptyTrail: Trail = { entries: [], cursor: -1 }
export function internalUrl(url: string) { return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\') }
export function advanceTrail(trail: Trail, visit: Visit, action: string): Trail {
  if (!internalUrl(visit.url) || visit.url.split('?')[0] === '/login') return trail
  // A new document opened by address/anchor starts a new router history. A
  // normal refresh retains its existing key and can reuse the saved trail.
  if (visit.key === 'default' && visit.index === 0 && !trail.entries.some(e => e.key === 'default' && e.url === visit.url && e.index === 0)) return { entries: [visit], cursor: 0 }
  const found = trail.entries.findIndex(entry => entry.key === visit.key)
  if (found >= 0) {
    const old = trail.entries[found]
    if (trail.cursor === found && old.url === visit.url && old.label === visit.label && old.index === visit.index) return trail
    return { entries: trail.entries.map((e, i) => i === found ? visit : e), cursor: found }
  }
  if (action === 'REPLACE' && trail.cursor >= 0) return { ...trail, entries: trail.entries.map((e, i) => i === trail.cursor ? visit : e) }
  const entries = [...trail.entries.slice(0, trail.cursor + 1), visit].slice(-80)
  return { entries, cursor: entries.length - 1 }
}
export function backVisit(trail: Trail): Visit | undefined {
  const current = trail.entries[trail.cursor]
  for (let i = trail.cursor - 1; i >= 0; i--) if (trail.entries[i].url !== current?.url) return trail.entries[i]
}
export function visitIndex(key: string, native: { key?: string; idx?: number } | null, trail: Trail) {
  const matches = native?.key === key || !native?.key && key === 'default'
  return matches && typeof native?.idx === 'number' ? native.idx : trail.entries.find(entry => entry.key === key)?.index
}
export function restoreTrail(raw: string | null): Trail {
  try {
    const value = JSON.parse(raw || 'null')
    if (value && Array.isArray(value.entries) && value.entries.length <= 80 && Number.isInteger(value.cursor) && value.cursor >= 0 && value.cursor < value.entries.length && value.entries.every((entry: Visit) => typeof entry.key === 'string' && typeof entry.label === 'string' && typeof entry.url === 'string' && internalUrl(entry.url) && (entry.index === undefined || Number.isInteger(entry.index)))) return value
  } catch { /* A damaged navigation preference must not block the application. */ }
  return emptyTrail
}
export function pageMemoryUrl(url: string) {
  const [pathname, search = ''] = url.split('?')
  const query = new URLSearchParams(search)
  query.delete('receipt')
  query.sort()
  return pathname + (query.size ? `?${query}` : '')
}
export function breadcrumbs(pathname: string, search: string, home: Crumb, students: { id: string; name: string }[] = [], batches: { id: string; name: string }[] = []): Crumb[] {
  if (pathname === home.url || pathname === '/') return [home]
  const parts = pathname.split('/').filter(Boolean)
  const query = new URLSearchParams(search)
  const section = parts[0]
  const labels: Record<string, string> = { students: 'Students', batches: 'Batches', classes: 'Classes', centres: 'Tuition centres', branches: 'Branches', teaching: 'Teaching setup', timetable: 'Weekly timetable', attendance: 'Attendance', fees: 'Fees', reports: 'Reports', settings: 'Settings' }
  const result = [home]
  if (section === 'fees' && home.url === '/dashboard') {
    const withoutReceipt = new URLSearchParams(search); withoutReceipt.delete('receipt')
    result.push({ label: 'Fees', url: '/fees/collect' })
    if (parts[1] === 'dues') result.push({ label: 'Outstanding fees', url: pathname + search })
    if (query.has('receipt')) { result[result.length - 1].url = pathname + (withoutReceipt.size ? `?${withoutReceipt}` : ''); result.push({ label: 'Receipt', url: pathname + search }) }
    return result
  }
  result.push({ label: labels[section] || 'Page', url: `/${section}` })
  if (section === 'students' && parts[1]) {
    if (parts[1] === 'new') result.push({ label: 'Register student', url: pathname })
    else {
      result.push({ label: students.find(s => s.id === parts[1])?.name || 'Student profile', url: `/students/${parts[1]}` })
      if (parts[2] === 'edit') result.push({ label: 'Edit student', url: pathname })
    }
  } else if (section === 'batches' && parts[1]) result.push({ label: batches.find(b => b.id === parts[1])?.name || 'Class details', url: pathname })
  else if (section === 'attendance' && parts[1] === 'reports') result.push({ label: 'Attendance reports', url: pathname })
  else if (section === 'attendance' && query.has('session')) result.push({ label: 'Class register', url: pathname + search })
  else if (section === 'classes' && query.has('batch')) result.push({ label: batches.find(b => b.id === query.get('batch'))?.name || 'Class students', url: pathname + search })
  result[result.length - 1].url = pathname + search
  return result
}
