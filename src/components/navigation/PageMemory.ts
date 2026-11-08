import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { readMemory, subscribeNavigation, writeMemory } from './navigationStore'
export const PageMemoryContext = createContext<{ scope: string; url: string } | undefined>(undefined)
/** Remember list/report controls while the user visits another page. */
export function usePageState<T>(name: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const page = useContext(PageMemoryContext)
  if (!page) throw Error('Page navigation context is unavailable.')
  const key = `jth-page:${page.scope}:${page.url}:${name}`
  const value = useSyncExternalStore(subscribeNavigation, () => readMemory(key, initial), () => readMemory(key, initial))
  const setValue = useCallback<Dispatch<SetStateAction<T>>>(next => {
    const previous = readMemory(key, initial)
    writeMemory(key, typeof next === 'function' ? (next as (old: T) => T)(previous) : next)
  }, [key, initial])
  return [value, setValue]
}
