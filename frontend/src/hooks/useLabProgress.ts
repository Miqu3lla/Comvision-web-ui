import { useSyncExternalStore } from 'react'
import { LABS, TOTAL_STEPS } from '../data/labs'

// Everything the user does is stored in localStorage under one key.
interface Store {
  done: Record<string, string[]>          // lab number -> completed step ids
  ran: Record<string, string[]>           // lab number -> steps whose output was opened
  notes: Record<string, string>           // "lab:step" or "lab:conclusion" -> text
}
const KEY = 'cvlab.progress.v1'
const empty = (): Store => ({ done: {}, ran: {}, notes: {} })

let cache: Store = load()
const listeners = new Set<() => void>()

function load(): Store {
  try { return { ...empty(), ...JSON.parse(localStorage.getItem(KEY) || '{}') } } catch { return empty() }
}
function commit(next: Store) {
  cache = next
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* storage unavailable */ }
  listeners.forEach((l) => l())
}
const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb) }
const snapshot = () => cache

const addTo = (m: Record<string, string[]>, lab: number, id: string) =>
  ({ ...m, [lab]: Array.from(new Set([...(m[lab] ?? []), id])) })

export const progressActions = {
  markDone: (lab: number, step: string) => commit({ ...cache, done: addTo(cache.done, lab, step) }),
  unmark: (lab: number, step: string) =>
    commit({ ...cache, done: { ...cache.done, [lab]: (cache.done[lab] ?? []).filter((s) => s !== step) } }),
  markRan: (lab: number, step: string) => commit({ ...cache, ran: addTo(cache.ran, lab, step) }),
  setNote: (key: string, text: string) => commit({ ...cache, notes: { ...cache.notes, [key]: text } }),
  reset: () => commit(empty()),
}

export type LabStatus = 'not-started' | 'in-progress' | 'done'

export function useLabProgress() {
  const s = useSyncExternalStore(subscribe, snapshot)
  const doneCount = (lab: number) => (s.done[lab] ?? []).length
  const status = (lab: number): LabStatus => {
    const total = LABS.find((l) => l.n === lab)!.steps.length
    const d = doneCount(lab)
    return d === 0 && !(s.ran[lab] ?? []).length ? 'not-started' : d >= total ? 'done' : 'in-progress'
  }
  const totalDone = LABS.reduce((a, l) => a + doneCount(l.n), 0)
  // First lab/step that is not yet done: where "Continue" should go.
  const next = (() => {
    for (const l of LABS) {
      const step = l.steps.find((st) => !(s.done[l.n] ?? []).includes(st.id))
      if (step) return { lab: l.n, step: step.id }
    }
    return null
  })()
  return {
    store: s, doneCount, status, totalDone, totalSteps: TOTAL_STEPS, next,
    labsDone: LABS.filter((l) => status(l.n) === 'done').length,
    isDone: (lab: number, step: string) => (s.done[lab] ?? []).includes(step),
    hasRun: (lab: number, step: string) => (s.ran[lab] ?? []).includes(step),
    note: (key: string) => s.notes[key] ?? '',
    ...progressActions,
  }
}
