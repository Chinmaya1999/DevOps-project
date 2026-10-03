import React, { useEffect, useState } from 'react'
import { IndianRupee } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { Modal, errMsg, money } from '../../components/Admin/ui'

interface Pricing { monthly: number; yearly: number; min: number; max: number }

/** Admin-editable subscription prices. New prices apply to payments started after saving. */
const PricingSettings: React.FC = () => {
  const [current, setCurrent] = useState<Pricing | null>(null)
  const [monthly, setMonthly] = useState('')
  const [yearly, setYearly] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get('/admin/settings/pricing').then((r) => {
      setCurrent(r.data.data)
      setMonthly(String(r.data.data.monthly))
      setYearly(String(r.data.data.yearly))
    }).catch((e) => toast.error(errMsg(e, 'Could not load prices')))
  useEffect(() => { load() }, [])

  if (!current) return null

  const m = Number(monthly)
  const y = Number(yearly)
  const whole = (n: number) => Number.isInteger(n) && n >= current.min && n <= current.max
  const problem =
    !monthly || !yearly ? 'Enter both prices' :
    !whole(m) ? `Monthly must be a whole number from ${current.min} to ${current.max}` :
    !whole(y) ? `Yearly must be a whole number from ${current.min} to ${current.max}` :
    y < m ? 'The yearly price cannot be lower than one month' : ''
  const changed = m !== current.monthly || y !== current.yearly
  const saving = !problem && m > 0 ? Math.round((1 - y / (m * 12)) * 100) : 0

  const save = async () => {
    setBusy(true)
    try {
      await api.put('/admin/settings/pricing', { monthly: m, yearly: y })
      toast.success('Prices updated. New payments use them straight away.')
      setConfirm(false)
      await load()
    } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  return (
    <section className="card p-5 mb-6" aria-labelledby="price-h">
      <h2 id="price-h" className="font-display text-lg font-semibold flex items-center gap-2"><IndianRupee className="w-5 h-5 text-cyan-500" /> Subscription prices</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-gray-400">
        Current: {money(current.monthly)} per month · {money(current.yearly)} per year. A change applies to payments started <strong>after</strong> you save.
        Existing subscribers, payments already in progress and past invoices keep the amount they were charged.
      </p>
      <form className="mt-4 flex flex-wrap items-end gap-4" onSubmit={(e) => { e.preventDefault(); if (!problem && changed) setConfirm(true) }}>
        <label className="text-sm"><span className="block mb-1 font-medium">Monthly (₹)</span>
          <input inputMode="numeric" className="input !w-36 !py-2" value={monthly} onChange={(e) => setMonthly(e.target.value.replace(/\D/g, ''))} /></label>
        <label className="text-sm"><span className="block mb-1 font-medium">Yearly (₹)</span>
          <input inputMode="numeric" className="input !w-36 !py-2" value={yearly} onChange={(e) => setYearly(e.target.value.replace(/\D/g, ''))} /></label>
        <button disabled={!!problem || !changed} className="btn-primary !py-2 !px-5 disabled:opacity-50">Save prices</button>
        <p className="text-sm basis-full text-slate-500 dark:text-gray-400" aria-live="polite">
          {problem ? <span className="text-red-500">{problem}</span> : changed ? `Yearly would save customers ${saving}% compared with paying monthly.` : 'No changes.'}
        </p>
      </form>

      {confirm && (
        <Modal title="Change subscription prices?" onClose={() => setConfirm(false)}>
          <div className="space-y-4 text-sm text-slate-600 dark:text-gray-300">
            <ul className="space-y-1">
              <li>Monthly: <strong>{money(current.monthly)}</strong> → <strong>{money(m)}</strong></li>
              <li>Yearly: <strong>{money(current.yearly)}</strong> → <strong>{money(y)}</strong></li>
            </ul>
            <p>People who open checkout from now on are charged the new price. The change is recorded in the audit log.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10">Cancel</button>
              <button onClick={save} disabled={busy} className="flex-1 btn-primary disabled:opacity-60">{busy ? 'Saving…' : 'Confirm'}</button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}

export default PricingSettings
