import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const KEY = 'learnProgress'

const readLocal = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 1000) : []
  } catch { return [] }
}
const writeLocal = (ids: Iterable<string>) => { try { localStorage.setItem(KEY, JSON.stringify([...ids])) } catch { /* storage blocked */ } }

/**
 * Which guide steps / roadmap checkpoints the learner has ticked.
 * Guests: saved in this browser. Signed-in users: saved on the server (so it follows them to any device);
 * anything ticked as a guest is moved to their account the first time they sign in.
 */
export function useLearnProgress() {
  const { user } = useAuth()
  const [done, setDone] = useState<Set<string>>(() => new Set(readLocal()))
  const userId = user?.id
  const synced = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) { setDone(new Set(readLocal())); synced.current = null; return }
    if (synced.current === userId) return
    synced.current = userId
    api.get('/learn/progress').then(async (r) => {
      const server = new Set<string>(r.data.data.completed)
      const guest = readLocal().filter((id) => !server.has(id))
      for (const id of guest) { // move guest progress into the account
        try { await api.post('/learn/progress', { lessonId: id, done: true }); server.add(id) } catch { break }
      }
      if (guest.length) writeLocal([])
      setDone(server)
    }).catch(() => { /* keep whatever we have */ })
  }, [userId])

  const toggle = useCallback(async (id: string) => {
    const next = !done.has(id)
    const updated = new Set(done)
    if (next) updated.add(id); else updated.delete(id)
    setDone(updated) // optimistic
    if (!userId) { writeLocal(updated); return }
    try { await api.post('/learn/progress', { lessonId: id, done: next }) }
    catch {
      toast.error('Could not save your progress')
      const back = new Set(updated)
      if (next) back.delete(id); else back.add(id)
      setDone(back)
    }
  }, [done, userId])

  return { done, toggle, signedIn: !!userId }
}
