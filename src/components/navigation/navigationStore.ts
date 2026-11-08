import { emptyTrail, restoreTrail } from './navigationModel'
import type { Trail } from './navigationModel'
const values = new Map<string, unknown>()
const listeners = new Set<() => void>()
export function subscribeNavigation(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
export function readMemory<T>(key: string, initial: T | (() => T)): T {
  if (!values.has(key)) {
    let value: T
    try { const raw = sessionStorage.getItem(key); value = raw === null ? (typeof initial === 'function' ? (initial as () => T)() : initial) : JSON.parse(raw) }
    catch { value = typeof initial === 'function' ? (initial as () => T)() : initial }
    values.set(key, value)
  }
  return values.get(key) as T
}
export function writeMemory<T>(key: string, value: T) {
  if (Object.is(values.get(key), value)) return
  values.set(key, value)
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* In-memory Back navigation remains available. */ }
  listeners.forEach(listener => listener())
}
export function readTrail(scope: string): Trail {
  const key = `jth-navigation:${scope}`
  if (!values.has(key)) { let trail = emptyTrail; try { trail = restoreTrail(sessionStorage.getItem(key)) } catch { /* Private browsing may disable storage. */ } values.set(key, trail) }
  return values.get(key) as Trail
}
